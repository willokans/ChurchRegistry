import { NextResponse } from 'next/server';
import { getUserFromToken, getMarriages, nextId, addMarriage } from '@/lib/api-store';

export async function POST(request: Request) {
  const user = getUserFromToken(request.headers.get('Authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const list = await getMarriages();
  const record = {
    id: nextId(list),
    baptismId: 0,
    communionId: 0,
    confirmationId: Number(body.confirmationId),
    partnersName: String(body.partnersName ?? ''),
    marriageDate: String(body.marriageDate ?? ''),
    officiatingPriest: String(body.officiatingPriest ?? ''),
    parish: String(body.parish ?? ''),
  };
  await addMarriage(record);
  return NextResponse.json(record);
}
