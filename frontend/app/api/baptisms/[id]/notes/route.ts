import { NextResponse } from 'next/server';
import { getUserFromToken, getBaptismById, getBaptismNoteHistory } from '@/lib/api-store';

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
  const notes = await getBaptismNoteHistory(numId);
  return NextResponse.json(notes);
}
