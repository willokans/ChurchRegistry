import { NextResponse } from 'next/server';
import { getUserFromToken, getParishes, getConfirmations } from '@/lib/api-store';

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
  const [parishes, confirmations] = await Promise.all([getParishes(), getConfirmations()]);
  const parishName = parishes.find((p) => p.id === id)?.parishName;
  const list = confirmations.filter((c) => (c.parish ?? '') === parishName);
  return NextResponse.json(list);
}
