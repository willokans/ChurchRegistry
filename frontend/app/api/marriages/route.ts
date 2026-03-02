import { NextResponse } from 'next/server';
import {
  getUserFromToken,
  getMarriages,
  nextId,
  addMarriage,
  addMarriageWithParties,
  getBaptisms,
  addBaptism,
  getCommunions,
  addCommunion,
  getConfirmations,
  addConfirmation,
} from '@/lib/api-store';

type IncomingParty = {
  fullName?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  nationality?: string;
  residentialAddress?: string;
  phone?: string;
  email?: string;
  occupation?: string;
  maritalStatus?: string;
  baptismId?: number;
  communionId?: number;
  confirmationId?: number;
  baptismCertificatePath?: string;
  communionCertificatePath?: string;
  confirmationCertificatePath?: string;
  baptismChurch?: string;
  communionChurch?: string;
  confirmationChurch?: string;
  baptismSource?: 'this_parish' | 'external';
  communionSource?: 'this_parish' | 'external';
  confirmationSource?: 'this_parish' | 'external';
  externalBaptism?: {
    baptismName?: string;
    surname?: string;
    otherNames?: string;
    gender?: string;
    fathersName?: string;
    mothersName?: string;
    baptisedChurchAddress?: string;
  };
};

function toTrimmedString(value: unknown): string | undefined {
  if (value == null) return undefined;
  const str = String(value).trim();
  return str.length > 0 ? str : undefined;
}

async function createExternalBaptismRecord(
  parishHint: number,
  party: IncomingParty
): Promise<number> {
  const details = party.externalBaptism ?? {};
  const baptismName = toTrimmedString(details.baptismName);
  const surname = toTrimmedString(details.surname);
  const fathersName = toTrimmedString(details.fathersName);
  const mothersName = toTrimmedString(details.mothersName);
  if (!baptismName || !surname || !fathersName || !mothersName) {
    throw new Error(
      'Baptism Name, Surname, Father\'s Name, and Mother\'s Name are required for external baptism.'
    );
  }
  const baptisms = await getBaptisms();
  const today = new Date().toISOString().slice(0, 10);
  const created = await addBaptism({
    id: nextId(baptisms),
    parishId: parishHint,
    baptismName,
    otherNames: toTrimmedString(details.otherNames) ?? 'See Certificate',
    surname,
    gender: toTrimmedString(details.gender) ?? 'MALE',
    dateOfBirth: today,
    fathersName,
    mothersName,
    sponsorNames: 'See Certificate',
    officiatingPriest: 'See Certificate',
    parishAddress: toTrimmedString(details.baptisedChurchAddress),
  });
  return created.id;
}

async function createExternalCommunionRecord(
  baptismId: number,
  party: IncomingParty,
  marriageDate: string,
  parish: string
): Promise<number> {
  const communions = await getCommunions();
  const created = await addCommunion({
    id: nextId(communions),
    baptismId,
    communionDate: marriageDate || new Date().toISOString().slice(0, 10),
    officiatingPriest: 'See Certificate',
    parish: toTrimmedString(party.communionChurch) ?? parish,
    communionCertificatePath: toTrimmedString(party.communionCertificatePath),
  });
  return created.id;
}

async function createExternalConfirmationRecord(
  baptismId: number,
  communionId: number,
  party: IncomingParty,
  marriageDate: string,
  parish: string
): Promise<number> {
  const confirmations = await getConfirmations();
  const created = await addConfirmation({
    id: nextId(confirmations),
    baptismId,
    communionId,
    confirmationDate: marriageDate || new Date().toISOString().slice(0, 10),
    officiatingBishop: 'See Certificate',
    parish: toTrimmedString(party.confirmationChurch) ?? parish,
  });
  return created.id;
}

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
        parishId: body.marriage.parishId != null ? Number(body.marriage.parishId) : undefined,
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
      const groomRaw: IncomingParty = body.groom ?? {};
      const brideRaw: IncomingParty = body.bride ?? {};
      const parishIdHint = Number.isFinite(marriage.parishId) && (marriage.parishId as number) > 0
        ? (marriage.parishId as number)
        : 1;
      const hasExternalSacrament =
        groomRaw.baptismSource === 'external' ||
        groomRaw.communionSource === 'external' ||
        groomRaw.confirmationSource === 'external' ||
        brideRaw.baptismSource === 'external' ||
        brideRaw.communionSource === 'external' ||
        brideRaw.confirmationSource === 'external';
      if (
        hasExternalSacrament &&
        !(Number.isFinite(marriage.parishId) && (marriage.parishId as number) > 0)
      ) {
        return NextResponse.json(
          { error: 'Parish id is required to create external sacrament records.' },
          { status: 400 }
        );
      }

      // Resolve sacrament records for groom (create + link when "external").
      let groomBaptismId =
        groomRaw.baptismSource === 'this_parish' ? (groomRaw.baptismId != null ? Number(groomRaw.baptismId) : undefined) : undefined;
      if (groomRaw.baptismSource === 'external') {
        if (!toTrimmedString(groomRaw.baptismCertificatePath)) {
          return NextResponse.json({ error: 'Upload the groom baptism certificate for external baptism.' }, { status: 400 });
        }
        groomBaptismId = await createExternalBaptismRecord(parishIdHint, groomRaw);
      }

      let groomCommunionId =
        groomRaw.communionSource === 'this_parish' ? (groomRaw.communionId != null ? Number(groomRaw.communionId) : undefined) : undefined;
      if (groomRaw.communionSource === 'external') {
        if (!toTrimmedString(groomRaw.communionCertificatePath)) {
          return NextResponse.json({ error: 'Upload the groom Holy Communion certificate for external communion.' }, { status: 400 });
        }
        const linkedBaptismId = groomBaptismId ?? (groomRaw.baptismId != null ? Number(groomRaw.baptismId) : undefined);
        if (!linkedBaptismId) {
          return NextResponse.json({ error: 'Groom baptism must be selected or created before external communion can be linked.' }, { status: 400 });
        }
        groomCommunionId = await createExternalCommunionRecord(
          linkedBaptismId,
          groomRaw,
          marriage.marriageDate,
          marriage.parish
        );
      }

      let groomConfirmationId =
        groomRaw.confirmationSource === 'this_parish' ? (groomRaw.confirmationId != null ? Number(groomRaw.confirmationId) : undefined) : undefined;
      if (groomRaw.confirmationSource === 'external') {
        if (!toTrimmedString(groomRaw.confirmationCertificatePath)) {
          return NextResponse.json({ error: 'Upload the groom Confirmation certificate for external confirmation.' }, { status: 400 });
        }
        const linkedBaptismId = groomBaptismId ?? (groomRaw.baptismId != null ? Number(groomRaw.baptismId) : undefined);
        const linkedCommunionId = groomCommunionId ?? (groomRaw.communionId != null ? Number(groomRaw.communionId) : undefined);
        if (!linkedBaptismId || !linkedCommunionId) {
          return NextResponse.json({ error: 'Groom baptism and communion must be selected or created before external confirmation can be linked.' }, { status: 400 });
        }
        groomConfirmationId = await createExternalConfirmationRecord(
          linkedBaptismId,
          linkedCommunionId,
          groomRaw,
          marriage.marriageDate,
          marriage.parish
        );
      }

      // Resolve sacrament records for bride (create + link when "external").
      let brideBaptismId =
        brideRaw.baptismSource === 'this_parish' ? (brideRaw.baptismId != null ? Number(brideRaw.baptismId) : undefined) : undefined;
      if (brideRaw.baptismSource === 'external') {
        if (!toTrimmedString(brideRaw.baptismCertificatePath)) {
          return NextResponse.json({ error: 'Upload the bride baptism certificate for external baptism.' }, { status: 400 });
        }
        brideBaptismId = await createExternalBaptismRecord(parishIdHint, brideRaw);
      }

      let brideCommunionId =
        brideRaw.communionSource === 'this_parish' ? (brideRaw.communionId != null ? Number(brideRaw.communionId) : undefined) : undefined;
      if (brideRaw.communionSource === 'external') {
        if (!toTrimmedString(brideRaw.communionCertificatePath)) {
          return NextResponse.json({ error: 'Upload the bride Holy Communion certificate for external communion.' }, { status: 400 });
        }
        const linkedBaptismId = brideBaptismId ?? (brideRaw.baptismId != null ? Number(brideRaw.baptismId) : undefined);
        if (!linkedBaptismId) {
          return NextResponse.json({ error: 'Bride baptism must be selected or created before external communion can be linked.' }, { status: 400 });
        }
        brideCommunionId = await createExternalCommunionRecord(
          linkedBaptismId,
          brideRaw,
          marriage.marriageDate,
          marriage.parish
        );
      }

      let brideConfirmationId =
        brideRaw.confirmationSource === 'this_parish' ? (brideRaw.confirmationId != null ? Number(brideRaw.confirmationId) : undefined) : undefined;
      if (brideRaw.confirmationSource === 'external') {
        if (!toTrimmedString(brideRaw.confirmationCertificatePath)) {
          return NextResponse.json({ error: 'Upload the bride Confirmation certificate for external confirmation.' }, { status: 400 });
        }
        const linkedBaptismId = brideBaptismId ?? (brideRaw.baptismId != null ? Number(brideRaw.baptismId) : undefined);
        const linkedCommunionId = brideCommunionId ?? (brideRaw.communionId != null ? Number(brideRaw.communionId) : undefined);
        if (!linkedBaptismId || !linkedCommunionId) {
          return NextResponse.json({ error: 'Bride baptism and communion must be selected or created before external confirmation can be linked.' }, { status: 400 });
        }
        brideConfirmationId = await createExternalConfirmationRecord(
          linkedBaptismId,
          linkedCommunionId,
          brideRaw,
          marriage.marriageDate,
          marriage.parish
        );
      }

      const groom = {
        role: 'GROOM' as const,
        fullName: String(groomRaw.fullName ?? '').trim(),
        dateOfBirth: groomRaw.dateOfBirth != null ? String(groomRaw.dateOfBirth).trim() : undefined,
        placeOfBirth: groomRaw.placeOfBirth != null ? String(groomRaw.placeOfBirth).trim() : undefined,
        nationality: groomRaw.nationality != null ? String(groomRaw.nationality).trim() : undefined,
        residentialAddress: groomRaw.residentialAddress != null ? String(groomRaw.residentialAddress).trim() : undefined,
        phone: groomRaw.phone != null ? String(groomRaw.phone).trim() : undefined,
        email: groomRaw.email != null ? String(groomRaw.email).trim() : undefined,
        occupation: groomRaw.occupation != null ? String(groomRaw.occupation).trim() : undefined,
        maritalStatus: groomRaw.maritalStatus != null ? String(groomRaw.maritalStatus).trim() : undefined,
        baptismId: groomBaptismId,
        communionId: groomCommunionId,
        confirmationId: groomConfirmationId,
        baptismCertificatePath: groomRaw.baptismCertificatePath != null ? String(groomRaw.baptismCertificatePath) : undefined,
        communionCertificatePath: groomRaw.communionCertificatePath != null ? String(groomRaw.communionCertificatePath) : undefined,
        confirmationCertificatePath: groomRaw.confirmationCertificatePath != null ? String(groomRaw.confirmationCertificatePath) : undefined,
        baptismChurch: groomRaw.baptismChurch != null ? String(groomRaw.baptismChurch).trim() : undefined,
        communionChurch: groomRaw.communionChurch != null ? String(groomRaw.communionChurch).trim() : undefined,
        confirmationChurch: groomRaw.confirmationChurch != null ? String(groomRaw.confirmationChurch).trim() : undefined,
      };
      const bride = {
        role: 'BRIDE' as const,
        fullName: String(brideRaw.fullName ?? '').trim(),
        dateOfBirth: brideRaw.dateOfBirth != null ? String(brideRaw.dateOfBirth).trim() : undefined,
        placeOfBirth: brideRaw.placeOfBirth != null ? String(brideRaw.placeOfBirth).trim() : undefined,
        nationality: brideRaw.nationality != null ? String(brideRaw.nationality).trim() : undefined,
        residentialAddress: brideRaw.residentialAddress != null ? String(brideRaw.residentialAddress).trim() : undefined,
        phone: brideRaw.phone != null ? String(brideRaw.phone).trim() : undefined,
        email: brideRaw.email != null ? String(brideRaw.email).trim() : undefined,
        occupation: brideRaw.occupation != null ? String(brideRaw.occupation).trim() : undefined,
        maritalStatus: brideRaw.maritalStatus != null ? String(brideRaw.maritalStatus).trim() : undefined,
        baptismId: brideBaptismId,
        communionId: brideCommunionId,
        confirmationId: brideConfirmationId,
        baptismCertificatePath: brideRaw.baptismCertificatePath != null ? String(brideRaw.baptismCertificatePath) : undefined,
        communionCertificatePath: brideRaw.communionCertificatePath != null ? String(brideRaw.communionCertificatePath) : undefined,
        confirmationCertificatePath: brideRaw.confirmationCertificatePath != null ? String(brideRaw.confirmationCertificatePath) : undefined,
        baptismChurch: brideRaw.baptismChurch != null ? String(brideRaw.baptismChurch).trim() : undefined,
        communionChurch: brideRaw.communionChurch != null ? String(brideRaw.communionChurch).trim() : undefined,
        confirmationChurch: brideRaw.confirmationChurch != null ? String(brideRaw.confirmationChurch).trim() : undefined,
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
