import { NextResponse } from 'next/server';
import { getUserFromToken, getBaptismsByParishId, getBaptisms, nextId, addBaptism } from '@/lib/api-store';

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
  const list = await getBaptismsByParishId(id);
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
  const dateOfBirth = String(body.dateOfBirth ?? '').trim();
  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dob.setHours(0, 0, 0, 0);
    if (dob > today) {
      return NextResponse.json(
        { error: 'Date of birth cannot be in the future' },
        { status: 400 }
      );
    }
  }
  const baptismName = String(body.baptismName ?? '').trim();
  const otherNames = String(body.otherNames ?? '').trim();
  const surname = String(body.surname ?? '').trim();
  const existing = await getBaptismsByParishId(parishIdNum);
  const isDuplicate = existing.some(
    (b) =>
      b.baptismName.trim() === baptismName &&
      (b.otherNames ?? '').trim() === otherNames &&
      b.surname.trim() === surname
  );
  if (isDuplicate) {
    return NextResponse.json(
      { error: 'A baptism with this combination of baptism name, other names and surname already exists in this parish.' },
      { status: 409 }
    );
  }
  const list = await getBaptisms();
  const record = {
    id: nextId(list),
    parishId: parishIdNum,
    baptismName,
    otherNames,
    surname,
    gender: String(body.gender ?? 'MALE'),
    dateOfBirth: String(body.dateOfBirth ?? ''),
    fathersName: String(body.fathersName ?? ''),
    mothersName: String(body.mothersName ?? ''),
    sponsorNames: String(body.sponsorNames ?? ''),
    officiatingPriest: String(body.officiatingPriest ?? '').trim(),
    address: body.address != null ? String(body.address) : undefined,
    parishAddress: body.parishAddress != null ? String(body.parishAddress) : undefined,
    parentAddress: body.parentAddress != null ? String(body.parentAddress) : undefined,
  };
  const created = await addBaptism(record);
  return NextResponse.json(created);
}
