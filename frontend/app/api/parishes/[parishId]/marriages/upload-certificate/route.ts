import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { getUserFromToken } from '@/lib/api-store';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase-server';

const MARRIAGE_CERTIFICATES_BUCKET = 'marriage-certificates';
const DATA_MARRIAGE_CERTIFICATES_DIR = path.join(process.cwd(), 'data', 'marriage-certificates');
const MAX_CERTIFICATE_SIZE_BYTES = 2 * 1024 * 1024;

/** Upload a marriage-related certificate (baptism, communion, or confirmation for groom/bride). Returns { path }. */
export async function POST(
  request: Request,
  context: { params: Promise<{ parishId: string }> }
) {
  const user = getUserFromToken(request.headers.get('Authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contentType = request.headers.get('Content-Type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'multipart/form-data required' }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const certificateType = String(formData.get('certificateType') ?? '').toLowerCase();
  const role = String(formData.get('role') ?? '').toLowerCase();

  if (!file || !(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'A certificate file is required.' }, { status: 400 });
  }
  if (!['baptism', 'communion', 'confirmation'].includes(certificateType)) {
    return NextResponse.json({ error: 'certificateType must be baptism, communion, or confirmation.' }, { status: 400 });
  }
  if (!['groom', 'bride'].includes(role)) {
    return NextResponse.json({ error: 'role must be groom or bride.' }, { status: 400 });
  }
  if (file.size > MAX_CERTIFICATE_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'Certificate file is too large. Maximum size is 2 MB.' },
      { status: 400 }
    );
  }

  const safeName = `${role}-${certificateType}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { data, error } = await supabase.storage
      .from(MARRIAGE_CERTIFICATES_BUCKET)
      .upload(safeName, buffer, { contentType: file.type || 'application/octet-stream' });
    if (error) {
      console.error('[marriages] certificate upload:', error);
      return NextResponse.json(
        { error: 'Failed to upload certificate. Ensure the marriage-certificates bucket exists.' },
        { status: 500 }
      );
    }
    return NextResponse.json({ path: data.path });
  }

  await fs.mkdir(DATA_MARRIAGE_CERTIFICATES_DIR, { recursive: true });
  const filePath = path.join(DATA_MARRIAGE_CERTIFICATES_DIR, safeName);
  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));
  return NextResponse.json({ path: `marriage-certificates/${safeName}` });
}
