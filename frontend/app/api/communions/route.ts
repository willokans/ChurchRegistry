import { NextResponse } from 'next/server';
import { getUserFromToken, getCommunions, nextId, addCommunion } from '@/lib/api-store';

export async function POST(request: Request) {
  const user = getUserFromToken(request.headers.get('Authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const list = await getCommunions();
  const record = {
    id: nextId(list),
    baptismId: Number(body.baptismId),
    communionDate: String(body.communionDate ?? ''),
    officiatingPriest: String(body.officiatingPriest ?? ''),
    parish: String(body.parish ?? ''),
  };
  const created = await addCommunion(record);
  return NextResponse.json(created);
}
