import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { getUserFromToken, getCommunionById } from '@/lib/api-store';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase-server';

const COMMUNION_CERTIFICATES_BUCKET = 'communion-certificates';
const DATA_COMMUNION_CERTIFICATES_DIR = path.join(process.cwd(), 'data', 'communion-certificates');

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
  const communion = await getCommunionById(numId);
  if (!communion) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (!communion.communionCertificatePath) {
    return NextResponse.json({ error: 'No uploaded communion certificate for this record' }, { status: 404 });
  }

  const certPath = communion.communionCertificatePath;

  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (!supabase) {
        return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
      }
      const { data, error } = await supabase.storage.from(COMMUNION_CERTIFICATES_BUCKET).download(certPath);
      if (error || !data) {
        console.error('[communion-certificate] Supabase download:', error);
        return NextResponse.json({ error: 'Certificate file not found' }, { status: 404 });
      }
      const buffer = Buffer.from(await data.arrayBuffer());
      const contentType = data.type || 'application/octet-stream';
      const filename = certPath.split('/').pop() ?? 'communion-certificate.pdf';
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${filename}"`,
        },
      });
    }

    const localPath = certPath.startsWith('communion-certificates/')
      ? path.join(process.cwd(), 'data', certPath)
      : path.join(DATA_COMMUNION_CERTIFICATES_DIR, certPath);
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
    console.error('[communion-certificate]', err);
    return NextResponse.json({ error: 'Failed to load certificate' }, { status: 500 });
  }
}
