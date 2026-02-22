import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/api-store';
import { dioceses } from '@/lib/api-store';

export async function GET(request: Request) {
  const user = getUserFromToken(request.headers.get('Authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(dioceses);
}
