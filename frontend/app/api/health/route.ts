import { NextResponse } from 'next/server';

/**
 * Health/readiness endpoint for load balancers and monitoring.
 * GET /api/health returns 200 when the app is up and ready to serve traffic.
 */
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
