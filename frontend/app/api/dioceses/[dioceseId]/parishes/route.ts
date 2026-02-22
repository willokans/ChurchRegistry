import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/api-store';
import { parishes } from '@/lib/api-store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ dioceseId: string }> }
) {
  const user = getUserFromToken(request.headers.get('Authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { dioceseId } = await params;
  const id = parseInt(dioceseId, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid diocese id' }, { status: 400 });
  }
  const list = parishes.filter((p) => p.dioceseId === id);
  return NextResponse.json(list);
}
