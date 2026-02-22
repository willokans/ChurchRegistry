import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/api-store';
import { communions, parishes } from '@/lib/api-store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ parishId: string }> }
) {
  const user = getUserFromToken(request.headers.get('Authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { parishId } = await params;
  const id = parseInt(parishId, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid parish id' }, { status: 400 });
  }
  const parishName = parishes.find((p) => p.id === id)?.parishName;
  const list = communions
    .filter((c) => c.parish === parishName)
    .map((c) => ({ ...c }));
  return NextResponse.json(list);
}
