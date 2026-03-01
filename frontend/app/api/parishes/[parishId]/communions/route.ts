import { NextResponse } from 'next/server';
import { getUserFromToken, getCommunions, getBaptisms } from '@/lib/api-store';

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
  const [communions, baptisms] = await Promise.all([
    getCommunions(),
    getBaptisms(),
  ]);
  // Show communions whose baptism belongs to this parish (so "communion in another church" records appear here)
  const baptismIdsInParish = new Set(baptisms.filter((b) => b.parishId === id).map((b) => b.id));
  const filtered = communions.filter((c) => baptismIdsInParish.has(c.baptismId));
  const baptismMap = new Map(baptisms.map((b) => [b.id, b]));
  const list = filtered.map((c) => {
    const b = baptismMap.get(c.baptismId);
    return {
      ...c,
      baptismName: b?.baptismName ?? '',
      otherNames: b?.otherNames ?? '',
      surname: b?.surname ?? '',
      dateOfBirth: b?.dateOfBirth ?? '',
      gender: b?.gender ?? '',
      fathersName: b?.fathersName ?? '',
      mothersName: b?.mothersName ?? '',
    };
  });
  return NextResponse.json(list);
}
