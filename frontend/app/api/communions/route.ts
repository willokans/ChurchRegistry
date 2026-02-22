import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/api-store';
import { communions, nextId } from '@/lib/api-store';

export async function POST(request: Request) {
  const user = getUserFromToken(request.headers.get('Authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const record = {
    id: nextId('communion'),
    baptismId: Number(body.baptismId),
    communionDate: String(body.communionDate ?? ''),
    officiatingPriest: String(body.officiatingPriest ?? ''),
    parish: String(body.parish ?? ''),
  };
  communions.push(record);
  return NextResponse.json(record);
}
