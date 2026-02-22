import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/api-store';
import { baptisms, nextId } from '@/lib/api-store';

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
  const list = baptisms.filter((b) => b.parishId === id);
  return NextResponse.json(list);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ parishId: string }> }
) {
  const user = getUserFromToken(request.headers.get('Authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { parishId } = await params;
  const parishIdNum = parseInt(parishId, 10);
  if (Number.isNaN(parishIdNum)) {
    return NextResponse.json({ error: 'Invalid parish id' }, { status: 400 });
  }
  const body = await request.json();
  const record = {
    id: nextId('baptism'),
    parishId: parishIdNum,
    baptismName: String(body.baptismName ?? ''),
    surname: String(body.surname ?? ''),
    gender: String(body.gender ?? 'MALE'),
    dateOfBirth: String(body.dateOfBirth ?? ''),
    fathersName: String(body.fathersName ?? ''),
    mothersName: String(body.mothersName ?? ''),
    sponsorNames: String(body.sponsorNames ?? ''),
    address: body.address != null ? String(body.address) : undefined,
    parishAddress: body.parishAddress != null ? String(body.parishAddress) : undefined,
    parentAddress: body.parentAddress != null ? String(body.parentAddress) : undefined,
  };
  baptisms.push(record);
  return NextResponse.json(record);
}
