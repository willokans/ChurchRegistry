import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/api-store';
import { confirmations, nextId } from '@/lib/api-store';

export async function POST(request: Request) {
  const user = getUserFromToken(request.headers.get('Authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const record = {
    id: nextId('confirmation'),
    baptismId: 0,
    communionId: Number(body.communionId),
    confirmationDate: String(body.confirmationDate ?? ''),
    officiatingBishop: String(body.officiatingBishop ?? ''),
    parish: body.parish != null ? String(body.parish) : undefined,
  };
  confirmations.push(record);
  return NextResponse.json(record);
}
