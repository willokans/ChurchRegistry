import { NextResponse } from 'next/server';
import { getUserFromToken, getDioceses } from '@/lib/api-store';

export async function GET(request: Request) {
  const user = getUserFromToken(request.headers.get('Authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const dioceses = await getDioceses();
  return NextResponse.json(dioceses);
}
