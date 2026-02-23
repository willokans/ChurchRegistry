import { NextResponse } from 'next/server';
import { getUserFromToken, getParishes, getDioceses, addParish } from '@/lib/api-store';

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
  const parishes = await getParishes();
  const list = parishes.filter((p) => p.dioceseId === id);
  return NextResponse.json(list);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ dioceseId: string }> }
) {
  const user = getUserFromToken(request.headers.get('Authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { dioceseId } = await params;
  const dioceseIdNum = parseInt(dioceseId, 10);
  if (Number.isNaN(dioceseIdNum)) {
    return NextResponse.json({ error: 'Invalid diocese id' }, { status: 400 });
  }
  const dioceses = await getDioceses();
  if (!dioceses.some((d) => d.id === dioceseIdNum)) {
    return NextResponse.json({ error: 'Diocese not found' }, { status: 404 });
  }
  let body: { parishName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parishName = typeof body.parishName === 'string' ? body.parishName.trim() : '';
  if (!parishName) {
    return NextResponse.json({ error: 'Parish name is required' }, { status: 400 });
  }
  const parish = await addParish(dioceseIdNum, parishName);
  return NextResponse.json(parish, { status: 201 });
}
