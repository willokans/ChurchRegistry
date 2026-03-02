import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { getUserFromToken, getBaptismById, getCommunionByBaptismId } from '@/lib/api-store';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase-server';

const BAPTISM_CERTIFICATES_BUCKET = 'baptism-certificates';
const DATA_CERTIFICATES_DIR = path.join(process.cwd(), 'data', 'baptism-certificates');

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromToken(request.headers.get('Authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const baptism = await getBaptismById(numId);
  if (!baptism) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const communion = await getCommunionByBaptismId(numId);
  if (!communion?.baptismCertificatePath) {
    return NextResponse.json({ error: 'No external certificate for this baptism' }, { status: 404 });
  }

  const certPath = communion.baptismCertificatePath;

  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (!supabase) {
        return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
      }
      const { data, error } = await supabase.storage.from(BAPTISM_CERTIFICATES_BUCKET).download(certPath);
      if (error || !data) {
        console.error('[external-certificate] Supabase download:', error);
        return NextResponse.json({ error: 'Certificate file not found' }, { status: 404 });
      }
      const buffer = Buffer.from(await data.arrayBuffer());
      const contentType = data.type || 'application/octet-stream';
      const filename = certPath.split('/').pop() ?? 'certificate.pdf';
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${filename}"`,
        },
      });
    }

    const localPath = certPath.startsWith('baptism-certificates/')
      ? path.join(process.cwd(), 'data', certPath)
      : path.join(DATA_CERTIFICATES_DIR, certPath);
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
  } catch (err) {
    console.error('[external-certificate]', err);
    return NextResponse.json({ error: 'Failed to load certificate' }, { status: 500 });
  }
}
