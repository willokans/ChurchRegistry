import { NextResponse } from 'next/server';
import { getUserFromToken, getBaptismById, getParishes, getDioceses } from '@/lib/api-store';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromToken(_request.headers.get('Authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const baptism = await getBaptismById(numId);
  if (!baptism) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const [parishes, dioceses] = await Promise.all([getParishes(), getDioceses()]);
  const parish = parishes.find((p) => p.id === baptism.parishId);
  const diocese = parish ? dioceses.find((d) => d.id === parish.dioceseId) : undefined;
  return NextResponse.json({
    baptism,
    parishName: parish?.parishName ?? '',
    dioceseName: diocese?.name ?? '',
  });
}
