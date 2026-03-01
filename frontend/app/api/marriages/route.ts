import { NextResponse } from 'next/server';
import { getUserFromToken, getMarriages, nextId, addMarriage, addMarriageWithParties } from '@/lib/api-store';

export async function POST(request: Request) {
  const user = getUserFromToken(request.headers.get('Authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // New form: groom + bride + marriage details + witnesses
  if (body.groom != null && body.bride != null && body.marriage != null) {
    try {
      const marriage = {
        partnersName: String(body.marriage.partnersName ?? '').trim() || `${body.groom.fullName ?? ''} & ${body.bride.fullName ?? ''}`,
        marriageDate: String(body.marriage.marriageDate ?? ''),
        marriageTime: body.marriage.marriageTime != null ? String(body.marriage.marriageTime) : undefined,
        churchName: body.marriage.churchName != null ? String(body.marriage.churchName).trim() : undefined,
        marriageRegister: body.marriage.marriageRegister != null ? String(body.marriage.marriageRegister).trim() : undefined,
        diocese: body.marriage.diocese != null ? String(body.marriage.diocese).trim() : undefined,
        civilRegistryNumber: body.marriage.civilRegistryNumber != null ? String(body.marriage.civilRegistryNumber).trim() : undefined,
        dispensationGranted: body.marriage.dispensationGranted === true,
        canonicalNotes: body.marriage.canonicalNotes != null ? String(body.marriage.canonicalNotes).trim() : undefined,
        officiatingPriest: String(body.marriage.officiatingPriest ?? '').trim(),
        parish: String(body.marriage.parish ?? '').trim(),
      };
      const groom = {
        fullName: String(body.groom.fullName ?? '').trim(),
        dateOfBirth: body.groom.dateOfBirth != null ? String(body.groom.dateOfBirth).trim() : undefined,
        placeOfBirth: body.groom.placeOfBirth != null ? String(body.groom.placeOfBirth).trim() : undefined,
        nationality: body.groom.nationality != null ? String(body.groom.nationality).trim() : undefined,
        residentialAddress: body.groom.residentialAddress != null ? String(body.groom.residentialAddress).trim() : undefined,
        phone: body.groom.phone != null ? String(body.groom.phone).trim() : undefined,
        email: body.groom.email != null ? String(body.groom.email).trim() : undefined,
        occupation: body.groom.occupation != null ? String(body.groom.occupation).trim() : undefined,
        maritalStatus: body.groom.maritalStatus != null ? String(body.groom.maritalStatus).trim() : undefined,
        baptismId: body.groom.baptismId != null ? Number(body.groom.baptismId) : undefined,
        communionId: body.groom.communionId != null ? Number(body.groom.communionId) : undefined,
        confirmationId: body.groom.confirmationId != null ? Number(body.groom.confirmationId) : undefined,
        baptismCertificatePath: body.groom.baptismCertificatePath != null ? String(body.groom.baptismCertificatePath) : undefined,
        communionCertificatePath: body.groom.communionCertificatePath != null ? String(body.groom.communionCertificatePath) : undefined,
        confirmationCertificatePath: body.groom.confirmationCertificatePath != null ? String(body.groom.confirmationCertificatePath) : undefined,
        baptismChurch: body.groom.baptismChurch != null ? String(body.groom.baptismChurch).trim() : undefined,
        communionChurch: body.groom.communionChurch != null ? String(body.groom.communionChurch).trim() : undefined,
        confirmationChurch: body.groom.confirmationChurch != null ? String(body.groom.confirmationChurch).trim() : undefined,
      };
      const bride = {
        fullName: String(body.bride.fullName ?? '').trim(),
        dateOfBirth: body.bride.dateOfBirth != null ? String(body.bride.dateOfBirth).trim() : undefined,
        placeOfBirth: body.bride.placeOfBirth != null ? String(body.bride.placeOfBirth).trim() : undefined,
        nationality: body.bride.nationality != null ? String(body.bride.nationality).trim() : undefined,
        residentialAddress: body.bride.residentialAddress != null ? String(body.bride.residentialAddress).trim() : undefined,
        phone: body.bride.phone != null ? String(body.bride.phone).trim() : undefined,
        email: body.bride.email != null ? String(body.bride.email).trim() : undefined,
        occupation: body.bride.occupation != null ? String(body.bride.occupation).trim() : undefined,
        maritalStatus: body.bride.maritalStatus != null ? String(body.bride.maritalStatus).trim() : undefined,
        baptismId: body.bride.baptismId != null ? Number(body.bride.baptismId) : undefined,
        communionId: body.bride.communionId != null ? Number(body.bride.communionId) : undefined,
        confirmationId: body.bride.confirmationId != null ? Number(body.bride.confirmationId) : undefined,
        baptismCertificatePath: body.bride.baptismCertificatePath != null ? String(body.bride.baptismCertificatePath) : undefined,
        communionCertificatePath: body.bride.communionCertificatePath != null ? String(body.bride.communionCertificatePath) : undefined,
        confirmationCertificatePath: body.bride.confirmationCertificatePath != null ? String(body.bride.confirmationCertificatePath) : undefined,
        baptismChurch: body.bride.baptismChurch != null ? String(body.bride.baptismChurch).trim() : undefined,
        communionChurch: body.bride.communionChurch != null ? String(body.bride.communionChurch).trim() : undefined,
        confirmationChurch: body.bride.confirmationChurch != null ? String(body.bride.confirmationChurch).trim() : undefined,
      };
      const witnesses = Array.isArray(body.witnesses)
        ? body.witnesses.map((w: { fullName?: string; phone?: string; address?: string; sortOrder?: number }, i: number) => ({
            fullName: String(w.fullName ?? '').trim(),
            phone: w.phone != null ? String(w.phone).trim() : undefined,
            address: w.address != null ? String(w.address).trim() : undefined,
            sortOrder: typeof w.sortOrder === 'number' ? w.sortOrder : i,
          }))
        : [];
      if (!marriage.marriageDate || !marriage.officiatingPriest || !marriage.parish) {
        return NextResponse.json(
          { error: 'Marriage date, officiating priest, and parish are required.' },
          { status: 400 }
        );
      }
      if (!groom.fullName || !bride.fullName) {
        return NextResponse.json(
          { error: 'Groom and bride full names are required.' },
          { status: 400 }
        );
      }
      const created = await addMarriageWithParties({
        marriage,
        groom,
        bride,
        witnesses: witnesses.filter((w: { fullName: string }) => w.fullName.length > 0),
      });
      return NextResponse.json(created);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create marriage';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Legacy: single confirmation + partners name
  const list = await getMarriages();
  const record = {
    id: nextId(list),
    baptismId: Number(body.baptismId ?? 0),
    communionId: Number(body.communionId ?? 0),
    confirmationId: Number(body.confirmationId),
    partnersName: String(body.partnersName ?? ''),
    marriageDate: String(body.marriageDate ?? ''),
    officiatingPriest: String(body.officiatingPriest ?? ''),
    parish: String(body.parish ?? ''),
  };
  const created = await addMarriage(record);
  return NextResponse.json(created);
}
