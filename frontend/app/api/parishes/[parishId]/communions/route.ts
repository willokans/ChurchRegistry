import { NextResponse } from 'next/server';
import { getUserFromToken, getParishes, getCommunions, getBaptisms } from '@/lib/api-store';

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
  const [parishes, communions, baptisms] = await Promise.all([
    getParishes(),
    getCommunions(),
    getBaptisms(),
  ]);
  const parishName = parishes.find((p) => p.id === id)?.parishName;
  const filtered = communions.filter((c) => c.parish === parishName);
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
