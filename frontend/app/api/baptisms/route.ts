import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { getUserFromToken, addBaptism, getBaptisms } from '@/lib/api-store';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase-server';

const BAPTISM_CERTIFICATES_BUCKET = 'baptism-certificates';
const DATA_CERTIFICATES_DIR = path.join(process.cwd(), 'data', 'baptism-certificates');
const MAX_CERTIFICATE_SIZE_BYTES = 2 * 1024 * 1024;

function nextId<T extends { id: number }>(items: T[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map((i) => i.id)) + 1;
}

function buildPlaceholderBaptism(
  parishId: number,
  nextBaptismId: number,
  external: {
    baptismName: string;
    surname: string;
    otherNames: string;
    gender: string;
    fathersName: string;
    mothersName: string;
    parishAddress: string;
  }
) {
  const today = new Date().toISOString().slice(0, 10);
  const surname = (external.surname && external.surname.trim()) ? external.surname.trim() : 'See Certificate';
  return {
    id: nextBaptismId,
    parishId,
    baptismName: external.baptismName || 'External',
    otherNames: (external.otherNames && external.otherNames.trim()) ? external.otherNames.trim() : 'See Certificate',
    surname,
    gender: external.gender || 'MALE',
    dateOfBirth: today,
    fathersName: external.fathersName || '—',
    mothersName: external.mothersName || '—',
    sponsorNames: 'See Certificate',
    officiatingPriest: 'See Certificate',
    parishAddress: external.parishAddress || undefined,
  };
}

/** POST: create external baptism only (multipart form with certificate + details). Returns { id } (baptismId). */
export async function POST(request: Request) {
  const user = getUserFromToken(request.headers.get('Authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contentType = request.headers.get('Content-Type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json(
      { error: 'Content-Type must be multipart/form-data for external baptism.' },
      { status: 400 }
    );
  }

  try {
    const formData = await request.formData();
    const parishId = parseInt(String(formData.get('parishId') ?? ''), 10);
    if (Number.isNaN(parishId) || parishId <= 0) {
      return NextResponse.json(
        { error: 'Parish is required for external baptism.' },
        { status: 400 }
      );
    }

    const file = formData.get('certificate') as File | null;
    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: 'Upload a baptism certificate when selecting Baptism from another Parish.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_CERTIFICATE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Certificate file is too large. Maximum size is 2 MB.' },
        { status: 400 }
      );
    }

    const externalBaptismName = String(formData.get('externalBaptismName') ?? '').trim();
    const externalSurname = String(formData.get('externalSurname') ?? '').trim();
    const externalOtherNames = String(formData.get('externalOtherNames') ?? '').trim();
    const externalGender = String(formData.get('externalGender') ?? 'MALE').trim() || 'MALE';
    const externalFathersName = String(formData.get('externalFathersName') ?? '').trim();
    const externalMothersName = String(formData.get('externalMothersName') ?? '').trim();
    const externalBaptisedChurchAddress = String(formData.get('externalBaptisedChurchAddress') ?? '').trim();

    if (!externalBaptismName || !externalFathersName || !externalMothersName) {
      return NextResponse.json(
        { error: 'Baptism name, father\'s name, and mother\'s name are required for external baptism.' },
        { status: 400 }
      );
    }
    if (!externalSurname) {
      return NextResponse.json(
        { error: 'Surname is required for external baptism.' },
        { status: 400 }
      );
    }

    // Store certificate (so it can be linked to a communion later if needed; for now we only create baptism)
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (!supabase) {
        return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
      }
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const { error } = await supabase.storage
        .from(BAPTISM_CERTIFICATES_BUCKET)
        .upload(safeName, buffer, { contentType: file.type || 'application/octet-stream' });
      if (error) {
        console.error('[baptisms] Supabase storage upload:', error);
        return NextResponse.json(
          { error: 'Failed to upload certificate. Ensure the bucket "' + BAPTISM_CERTIFICATES_BUCKET + '" exists.' },
          { status: 500 }
        );
      }
    } else {
      await fs.mkdir(DATA_CERTIFICATES_DIR, { recursive: true });
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = path.join(DATA_CERTIFICATES_DIR, safeName);
      const arrayBuffer = await file.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(arrayBuffer));
    }

    const baptisms = await getBaptisms();
    const placeholderId = nextId(baptisms);
    const placeholder = buildPlaceholderBaptism(parishId, placeholderId, {
      baptismName: externalBaptismName,
      surname: externalSurname,
      otherNames: externalOtherNames,
      gender: externalGender,
      fathersName: externalFathersName,
      mothersName: externalMothersName,
      parishAddress: externalBaptisedChurchAddress,
    });
    const created = await addBaptism(placeholder);
    return NextResponse.json({ id: created.id });
  } catch (err) {
    console.error('[baptisms] POST', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create baptism' },
      { status: 500 }
    );
  }
}
