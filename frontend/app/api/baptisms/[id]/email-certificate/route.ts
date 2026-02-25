import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getUserFromToken, getBaptismById, getParishes, getDioceses } from '@/lib/api-store';
import { buildBaptismCertificatePdf } from '@/lib/baptism-certificate-pdf';

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'Church Registry <onboarding@resend.dev>';

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s?.trim() ?? '');
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!resendApiKey) {
      return NextResponse.json(
        { error: 'Email is not configured. Set RESEND_API_KEY.' },
        { status: 503 }
      );
    }

    const { id } = await params;
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    let body: { to?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const to = typeof body.to === 'string' ? body.to.trim() : '';
    if (!to || !isValidEmail(to)) {
      return NextResponse.json({ error: 'Valid email address (to) is required' }, { status: 400 });
    }

    const baptism = await getBaptismById(numId);
    if (!baptism) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const [parishes, dioceses] = await Promise.all([getParishes(), getDioceses()]);
    const parish = parishes.find((p) => p.id === baptism.parishId);
    const diocese = parish ? dioceses.find((d) => d.id === parish.dioceseId) : undefined;
    const certificateData = {
      baptism: {
        baptismName: baptism.baptismName,
        otherNames: baptism.otherNames ?? '',
        surname: baptism.surname,
        dateOfBirth: baptism.dateOfBirth,
        gender: baptism.gender,
        fathersName: baptism.fathersName,
        mothersName: baptism.mothersName,
        sponsorNames: baptism.sponsorNames,
        officiatingPriest: baptism.officiatingPriest,
        parentAddress: baptism.parentAddress,
        address: baptism.address,
      },
      parishName: parish?.parishName ?? '',
      dioceseName: diocese?.name ?? '',
    };

    const pdfBuffer = buildBaptismCertificatePdf(certificateData);
    const resend = new Resend(resendApiKey);

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: 'Baptism Certificate',
      html: '<p>Please find your baptism certificate attached.</p>',
      attachments: [
        {
          filename: 'baptism-certificate.pdf',
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, message: 'Certificate sent' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    const detail = err instanceof Error ? err.stack : String(err);
    console.error('[email-certificate]', message, detail);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
