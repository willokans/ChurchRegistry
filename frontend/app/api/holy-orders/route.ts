import { NextResponse } from 'next/server';
import { getUserFromToken, getHolyOrders, nextId, addHolyOrder } from '@/lib/api-store';

export async function POST(request: Request) {
  const user = getUserFromToken(request.headers.get('Authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const list = await getHolyOrders();
  const record = {
    id: nextId(list),
    baptismId: 0,
    communionId: 0,
    confirmationId: Number(body.confirmationId),
    ordinationDate: String(body.ordinationDate ?? ''),
    orderType: String(body.orderType ?? ''),
    officiatingBishop: String(body.officiatingBishop ?? ''),
    parishId: body.parishId != null ? Number(body.parishId) : undefined,
  };
  await addHolyOrder(record);
  return NextResponse.json(record);
}
