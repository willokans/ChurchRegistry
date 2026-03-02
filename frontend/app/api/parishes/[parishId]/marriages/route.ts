import { NextResponse } from 'next/server';
import {
  getUserFromToken,
  getParishes,
  getMarriages,
  getMarriagePartiesByMarriageId,
  getMarriageWitnessesByMarriageId,
  getBaptismById,
} from '@/lib/api-store';

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
  const [parishes, marriages] = await Promise.all([getParishes(), getMarriages()]);
  const parishName = parishes.find((p) => p.id === id)?.parishName;
  const list = marriages.filter((m) => m.parish === parishName);
  const enriched = await Promise.all(
    list.map(async (m) => {
      const [parties, witnesses] = await Promise.all([
        getMarriagePartiesByMarriageId(m.id),
        getMarriageWitnessesByMarriageId(m.id),
      ]);

      const groom = parties.find((p) => String(p.role).toUpperCase() === 'GROOM');
      const bride = parties.find((p) => String(p.role).toUpperCase() === 'BRIDE');
      const [groomBaptism, brideBaptism] = await Promise.all([
        groom?.baptismId ? getBaptismById(groom.baptismId) : Promise.resolve(null),
        bride?.baptismId ? getBaptismById(bride.baptismId) : Promise.resolve(null),
      ]);

      return {
        ...m,
        parties,
        witnesses,
        groomName: groom?.fullName ?? undefined,
        brideName: bride?.fullName ?? undefined,
        groomFatherName: groomBaptism?.fathersName ?? undefined,
        groomMotherName: groomBaptism?.mothersName ?? undefined,
        brideFatherName: brideBaptism?.fathersName ?? undefined,
        brideMotherName: brideBaptism?.mothersName ?? undefined,
        witnessesDisplay: witnesses.map((w) => w.fullName).filter(Boolean).join(', ') || undefined,
      };
    })
  );

  return NextResponse.json(enriched);
}
