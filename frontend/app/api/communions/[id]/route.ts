import { NextResponse } from 'next/server';
import { getUserFromToken, getCommunionById, getBaptismById, getParishes } from '@/lib/api-store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromToken(request.headers.get('Authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const record = await getCommunionById(numId);
  if (!record) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const baptism = await getBaptismById(record.baptismId);
  const parishes = await getParishes();
  const baptismParish = baptism ? parishes.find((p) => p.id === baptism.parishId) : undefined;
  const payload = {
    ...record,
    baptismName: baptism?.baptismName ?? undefined,
    otherNames: baptism?.otherNames ?? undefined,
    surname: baptism?.surname ?? undefined,
    dateOfBirth: baptism?.dateOfBirth ?? undefined,
    baptismParishName: baptismParish?.parishName ?? undefined,
  };
  return NextResponse.json(payload);
}
