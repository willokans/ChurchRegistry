import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { getUserFromToken, getMarriagePartiesByMarriageId } from '@/lib/api-store';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase-server';

const MARRIAGE_CERTIFICATES_BUCKET = 'marriage-certificates';
const DATA_MARRIAGE_CERTIFICATES_DIR = path.join(process.cwd(), 'data', 'marriage-certificates');

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromToken(request.headers.get('Authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const marriageId = parseInt(id, 10);
  if (Number.isNaN(marriageId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const url = new URL(request.url);
  const role = String(url.searchParams.get('role') ?? '').toUpperCase();
  const type = String(url.searchParams.get('type') ?? '').toLowerCase();

  if (!['GROOM', 'BRIDE'].includes(role)) {
    return NextResponse.json({ error: 'role must be groom or bride' }, { status: 400 });
  }
  if (!['baptism', 'communion', 'confirmation'].includes(type)) {
    return NextResponse.json({ error: 'type must be baptism, communion, or confirmation' }, { status: 400 });
  }

  const parties = await getMarriagePartiesByMarriageId(marriageId);
  const party = parties.find((p) => String(p.role).toUpperCase() === role);
  if (!party) {
    return NextResponse.json({ error: 'Marriage party not found' }, { status: 404 });
  }

  const certPath =
    type === 'baptism'
      ? party.baptismCertificatePath
      : type === 'communion'
        ? party.communionCertificatePath
        : party.confirmationCertificatePath;
  if (!certPath) {
    return NextResponse.json({ error: 'No uploaded certificate for this party/sacrament' }, { status: 404 });
  }

  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (!supabase) {
        return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
      }
      const { data, error } = await supabase.storage.from(MARRIAGE_CERTIFICATES_BUCKET).download(certPath);
      if (error || !data) {
        return NextResponse.json({ error: 'Certificate file not found' }, { status: 404 });
      }
      const buffer = Buffer.from(await data.arrayBuffer());
      const contentType = data.type || 'application/octet-stream';
      const filename = certPath.split('/').pop() ?? 'marriage-certificate.pdf';
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${filename}"`,
        },
      });
    }

    const localPath = certPath.startsWith('marriage-certificates/')
      ? path.join(process.cwd(), 'data', certPath)
      : path.join(DATA_MARRIAGE_CERTIFICATES_DIR, certPath);
    const buffer = await fs.readFile(localPath);
    const ext = path.extname(localPath).toLowerCase();
    const contentType =
      ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/octet-stream';
    const filename = path.basename(localPath);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load certificate' }, { status: 500 });
  }
}
