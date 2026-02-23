import { NextResponse } from 'next/server';
import { getUserFromToken, getConfirmations, nextId, addConfirmation } from '@/lib/api-store';

export async function POST(request: Request) {
  const user = getUserFromToken(request.headers.get('Authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const list = await getConfirmations();
  const record = {
    id: nextId(list),
    baptismId: 0,
    communionId: Number(body.communionId),
    confirmationDate: String(body.confirmationDate ?? ''),
    officiatingBishop: String(body.officiatingBishop ?? ''),
    parish: body.parish != null ? String(body.parish) : undefined,
  };
  await addConfirmation(record);
  return NextResponse.json(record);
}
