import { NextResponse } from 'next/server';
import { getUserFromToken, getConfirmations, getBaptisms } from '@/lib/api-store';

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
  const [confirmations, baptisms] = await Promise.all([
    getConfirmations(),
    getBaptisms(),
  ]);
  // Show confirmations whose baptism belongs to this parish (so records created here appear in the list)
  const baptismIdsInParish = new Set(baptisms.filter((b) => b.parishId === id).map((b) => b.id));
  const list = confirmations.filter((c) => baptismIdsInParish.has(c.baptismId));
  return NextResponse.json(list);
}
