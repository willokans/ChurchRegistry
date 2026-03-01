/**
 * Supabase (PostgreSQL) data store. Uses snake_case columns; maps to/from app camelCase types.
 * Used by api-store when NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.
 */

import { getSupabase } from './supabase-server';
import type {
  Diocese,
  Parish,
  Baptism,
  BaptismNote,
  FirstHolyCommunion,
  Confirmation,
  Marriage,
  MarriageParty,
  MarriageWitness,
  HolyOrder,
} from './api-store';

// --- Row types (snake_case as in DB) ---
type DioceseRow = { id: number; name: string };
type ParishRow = { id: number; diocese_id: number; parish_name: string; description: string | null };
type BaptismRow = {
  id: number;
  parish_id: number;
  baptism_name: string;
  other_names: string;
  surname: string;
  gender: string;
  date_of_birth: string;
  fathers_name: string;
  mothers_name: string;
  sponsor_names: string;
  officiating_priest: string;
  address: string | null;
  parish_address: string | null;
  parent_address: string | null;
  note: string | null;
};
type CommunionRow = {
  id: number;
  baptism_id: number;
  communion_date: string;
  officiating_priest: string;
  parish: string;
  baptism_certificate_path?: string | null;
  communion_certificate_path?: string | null;
};
type ConfirmationRow = {
  id: number;
  baptism_id: number;
  communion_id: number;
  confirmation_date: string;
  officiating_bishop: string;
  parish: string | null;
};
type MarriageRow = {
  id: number;
  baptism_id: number | null;
  communion_id: number | null;
  confirmation_id: number | null;
  partners_name: string;
  marriage_date: string;
  marriage_time: string | null;
  church_name: string | null;
  marriage_register: string | null;
  diocese: string | null;
  civil_registry_number: string | null;
  dispensation_granted: boolean | null;
  canonical_notes: string | null;
  officiating_priest: string;
  parish: string;
};
type MarriagePartyRow = {
  id: number;
  marriage_id: number;
  role: string;
  full_name: string;
  date_of_birth: string | null;
  place_of_birth: string | null;
  nationality: string | null;
  residential_address: string | null;
  phone: string | null;
  email: string | null;
  occupation: string | null;
  marital_status: string | null;
  baptism_id: number | null;
  communion_id: number | null;
  confirmation_id: number | null;
  baptism_certificate_path: string | null;
  communion_certificate_path: string | null;
  confirmation_certificate_path: string | null;
  baptism_church: string | null;
  communion_church: string | null;
  confirmation_church: string | null;
};
type MarriageWitnessRow = {
  id: number;
  marriage_id: number;
  full_name: string;
  phone: string | null;
  address: string | null;
  signature_path: string | null;
  sort_order: number;
};
type HolyOrderRow = {
  id: number;
  baptism_id: number;
  communion_id: number;
  confirmation_id: number;
  ordination_date: string;
  order_type: string;
  officiating_bishop: string;
  parish_id: number | null;
};
type BaptismNoteRow = {
  id: number;
  baptism_id: number;
  content: string;
  created_at: string;
};

function toDiocese(r: DioceseRow): Diocese {
  return { id: r.id, name: r.name };
}
function toParish(r: ParishRow): Parish {
  return {
    id: r.id,
    parishName: r.parish_name,
    dioceseId: r.diocese_id,
    description: r.description ?? undefined,
  };
}
function toBaptism(r: BaptismRow): Baptism {
  return {
    id: r.id,
    baptismName: r.baptism_name,
    otherNames: r.other_names ?? '',
    surname: r.surname,
    gender: r.gender,
    dateOfBirth: r.date_of_birth,
    fathersName: r.fathers_name,
    mothersName: r.mothers_name,
    sponsorNames: r.sponsor_names,
    officiatingPriest: r.officiating_priest ?? '',
    parishId: r.parish_id,
    address: r.address ?? undefined,
    parishAddress: r.parish_address ?? undefined,
    parentAddress: r.parent_address ?? undefined,
    note: r.note ?? undefined,
  };
}
function toCommunion(r: CommunionRow): FirstHolyCommunion {
  return {
    id: r.id,
    baptismId: r.baptism_id,
    communionDate: r.communion_date,
    officiatingPriest: r.officiating_priest,
    parish: r.parish,
    baptismCertificatePath: r.baptism_certificate_path ?? undefined,
    communionCertificatePath: r.communion_certificate_path ?? undefined,
  };
}
function toConfirmation(r: ConfirmationRow): Confirmation {
  return {
    id: r.id,
    baptismId: r.baptism_id,
    communionId: r.communion_id,
    confirmationDate: r.confirmation_date,
    officiatingBishop: r.officiating_bishop,
    parish: r.parish ?? undefined,
  };
}
function toMarriage(r: MarriageRow): Marriage {
  return {
    id: r.id,
    baptismId: r.baptism_id ?? undefined,
    communionId: r.communion_id ?? undefined,
    confirmationId: r.confirmation_id ?? undefined,
    partnersName: r.partners_name,
    marriageDate: r.marriage_date,
    marriageTime: r.marriage_time ?? undefined,
    churchName: r.church_name ?? undefined,
    marriageRegister: r.marriage_register ?? undefined,
    diocese: r.diocese ?? undefined,
    civilRegistryNumber: r.civil_registry_number ?? undefined,
    dispensationGranted: r.dispensation_granted ?? undefined,
    canonicalNotes: r.canonical_notes ?? undefined,
    officiatingPriest: r.officiating_priest,
    parish: r.parish,
  };
}
function toHolyOrder(r: HolyOrderRow): HolyOrder {
  return {
    id: r.id,
    baptismId: r.baptism_id,
    communionId: r.communion_id,
    confirmationId: r.confirmation_id,
    ordinationDate: r.ordination_date,
    orderType: r.order_type,
    officiatingBishop: r.officiating_bishop,
    parishId: r.parish_id ?? undefined,
  };
}

function getDb() {
  const db = getSupabase();
  if (!db) throw new Error('Supabase not configured');
  return db;
}

// Dioceses
export async function getDioceses(): Promise<Diocese[]> {
  const { data, error } = await getDb().from('dioceses').select('*').order('id');
  if (error) throw error;
  return (data ?? []).map((r) => toDiocese(r as DioceseRow));
}

export async function addDiocese(name: string): Promise<Diocese> {
  const { data, error } = await getDb()
    .from('dioceses')
    .insert({ name })
    .select('*')
    .single();
  if (error) throw error;
  return toDiocese(data as DioceseRow);
}

// Parishes
export async function getParishes(): Promise<Parish[]> {
  const { data, error } = await getDb().from('parishes').select('*').order('id');
  if (error) throw error;
  return (data ?? []).map((r) => toParish(r as ParishRow));
}

export async function addParish(dioceseId: number, parishName: string): Promise<Parish> {
  const { data, error } = await getDb()
    .from('parishes')
    .insert({ diocese_id: dioceseId, parish_name: parishName })
    .select('*')
    .single();
  if (error) throw error;
  return toParish(data as ParishRow);
}

// Baptisms
export async function getBaptisms(): Promise<Baptism[]> {
  const { data, error } = await getDb().from('baptisms').select('*').order('id');
  if (error) throw error;
  return (data ?? []).map((r) => toBaptism(r as BaptismRow));
}

export async function getBaptismById(id: number): Promise<Baptism | null> {
  const { data, error } = await getDb().from('baptisms').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toBaptism(data as BaptismRow) : null;
}

export async function getBaptismsByParishId(parishId: number): Promise<Baptism[]> {
  const { data, error } = await getDb()
    .from('baptisms')
    .select('*')
    .eq('parish_id', parishId)
    .order('id');
  if (error) throw error;
  return (data ?? []).map((r) => toBaptism(r as BaptismRow));
}

export async function addBaptism(record: Baptism): Promise<Baptism> {
  const row = {
    parish_id: record.parishId,
    baptism_name: record.baptismName,
    other_names: record.otherNames ?? '',
    surname: record.surname,
    gender: record.gender,
    date_of_birth: record.dateOfBirth,
    fathers_name: record.fathersName,
    mothers_name: record.mothersName,
    sponsor_names: record.sponsorNames,
    officiating_priest: record.officiatingPriest ?? '',
    address: record.address ?? null,
    parish_address: record.parishAddress ?? null,
    parent_address: record.parentAddress ?? null,
    note: record.note ?? null,
  };
  const { data, error } = await getDb().from('baptisms').insert(row).select('*').single();
  if (error) throw error;
  return toBaptism(data as BaptismRow);
}

function toBaptismNote(r: BaptismNoteRow): BaptismNote {
  return {
    id: r.id,
    baptismId: r.baptism_id,
    content: r.content,
    createdAt: r.created_at,
  };
}

export async function getBaptismNoteHistory(baptismId: number): Promise<BaptismNote[]> {
  try {
    const { data, error } = await getDb()
      .from('baptism_notes')
      .select('*')
      .eq('baptism_id', baptismId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data ?? []).map((r) => toBaptismNote(r as BaptismNoteRow));
  } catch {
    return [];
  }
}

export async function updateBaptism(id: number, patch: { note?: string }): Promise<Baptism | null> {
  const updates: Record<string, unknown> = {};
  if (patch.note !== undefined) updates.note = patch.note;
  if (Object.keys(updates).length === 0) return getBaptismById(id);
  if (patch.note !== undefined) {
    try {
      await getDb().from('baptism_notes').insert({ baptism_id: id, content: patch.note });
    } catch {
      // Table may not exist yet; run migration 008_baptism_notes_history.sql. Note still saved on baptisms.note.
    }
  }
  const { data, error } = await getDb().from('baptisms').update(updates).eq('id', id).select('*').single();
  if (error) throw error;
  return data ? toBaptism(data as BaptismRow) : null;
}

// Communions
export async function getCommunions(): Promise<FirstHolyCommunion[]> {
  const { data, error } = await getDb().from('communions').select('*').order('id');
  if (error) throw error;
  return (data ?? []).map((r) => toCommunion(r as CommunionRow));
}

export async function getCommunionById(id: number): Promise<FirstHolyCommunion | null> {
  const { data, error } = await getDb().from('communions').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toCommunion(data as CommunionRow) : null;
}

export async function getCommunionByBaptismId(baptismId: number): Promise<FirstHolyCommunion | null> {
  const { data, error } = await getDb()
    .from('communions')
    .select('*')
    .eq('baptism_id', baptismId)
    .not('baptism_certificate_path', 'is', null)
    .limit(1);
  if (error) throw error;
  const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
  return row ? toCommunion(row as CommunionRow) : null;
}

export async function addCommunion(record: FirstHolyCommunion): Promise<FirstHolyCommunion> {
  const row = {
    baptism_id: record.baptismId,
    communion_date: record.communionDate,
    officiating_priest: record.officiatingPriest,
    parish: record.parish,
    baptism_certificate_path: record.baptismCertificatePath ?? null,
    communion_certificate_path: record.communionCertificatePath ?? null,
  };
  const { data, error } = await getDb().from('communions').insert(row).select('*').single();
  if (error) throw error;
  return toCommunion(data as CommunionRow);
}

// Confirmations
export async function getConfirmations(): Promise<Confirmation[]> {
  const { data, error } = await getDb().from('confirmations').select('*').order('id');
  if (error) throw error;
  return (data ?? []).map((r) => toConfirmation(r as ConfirmationRow));
}

export async function getConfirmationById(id: number): Promise<Confirmation | null> {
  const { data, error } = await getDb().from('confirmations').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toConfirmation(data as ConfirmationRow) : null;
}

export async function addConfirmation(record: Confirmation): Promise<Confirmation> {
  const row = {
    baptism_id: record.baptismId,
    communion_id: record.communionId,
    confirmation_date: record.confirmationDate,
    officiating_bishop: record.officiatingBishop,
    parish: record.parish ?? null,
  };
  const { data, error } = await getDb().from('confirmations').insert(row).select('*').single();
  if (error) throw error;
  return toConfirmation(data as ConfirmationRow);
}

// Marriages
export async function getMarriages(): Promise<Marriage[]> {
  const { data, error } = await getDb().from('marriages').select('*').order('id');
  if (error) throw error;
  return (data ?? []).map((r) => toMarriage(r as MarriageRow));
}

export async function getMarriageById(id: number): Promise<Marriage | null> {
  const { data, error } = await getDb().from('marriages').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toMarriage(data as MarriageRow) : null;
}

export async function addMarriage(record: Marriage): Promise<Marriage> {
  const row = {
    baptism_id: record.baptismId ?? null,
    communion_id: record.communionId ?? null,
    confirmation_id: record.confirmationId ?? null,
    partners_name: record.partnersName,
    marriage_date: record.marriageDate,
    marriage_time: record.marriageTime ?? null,
    church_name: record.churchName ?? null,
    marriage_register: record.marriageRegister ?? null,
    diocese: record.diocese ?? null,
    civil_registry_number: record.civilRegistryNumber ?? null,
    dispensation_granted: record.dispensationGranted ?? null,
    canonical_notes: record.canonicalNotes ?? null,
    officiating_priest: record.officiatingPriest,
    parish: record.parish,
  };
  const { data, error } = await getDb().from('marriages').insert(row).select('*').single();
  if (error) throw error;
  return toMarriage(data as MarriageRow);
}

/** Create marriage with groom/bride parties and witnesses (new form flow). */
export interface CreateMarriageWithPartiesPayload {
  marriage: Omit<Marriage, 'id'>;
  groom: Omit<MarriageParty, 'id' | 'marriageId'>;
  bride: Omit<MarriageParty, 'id' | 'marriageId'>;
  witnesses: Array<Omit<MarriageWitness, 'id' | 'marriageId'>>;
}

export async function addMarriageWithParties(payload: CreateMarriageWithPartiesPayload): Promise<Marriage> {
  const { marriage, groom, bride, witnesses } = payload;
  const marriageRow = {
    baptism_id: null,
    communion_id: null,
    confirmation_id: null,
    partners_name: marriage.partnersName,
    marriage_date: marriage.marriageDate,
    marriage_time: marriage.marriageTime ?? null,
    church_name: marriage.churchName ?? null,
    marriage_register: marriage.marriageRegister ?? null,
    diocese: marriage.diocese ?? null,
    civil_registry_number: marriage.civilRegistryNumber ?? null,
    dispensation_granted: marriage.dispensationGranted ?? null,
    canonical_notes: marriage.canonicalNotes ?? null,
    officiating_priest: marriage.officiatingPriest,
    parish: marriage.parish,
  };
  const { data: marriageData, error: marriageError } = await getDb()
    .from('marriages')
    .insert(marriageRow)
    .select('*')
    .single();
  if (marriageError) throw marriageError;
  const marriageId = (marriageData as MarriageRow).id;

  const partyRow = (p: Omit<MarriageParty, 'id' | 'marriageId'>, role: 'GROOM' | 'BRIDE') => ({
    marriage_id: marriageId,
    role,
    full_name: p.fullName,
    date_of_birth: p.dateOfBirth ?? null,
    place_of_birth: p.placeOfBirth ?? null,
    nationality: p.nationality ?? null,
    residential_address: p.residentialAddress ?? null,
    phone: p.phone ?? null,
    email: p.email ?? null,
    occupation: p.occupation ?? null,
    marital_status: p.maritalStatus ?? null,
    baptism_id: p.baptismId ?? null,
    communion_id: p.communionId ?? null,
    confirmation_id: p.confirmationId ?? null,
    baptism_certificate_path: p.baptismCertificatePath ?? null,
    communion_certificate_path: p.communionCertificatePath ?? null,
    confirmation_certificate_path: p.confirmationCertificatePath ?? null,
    baptism_church: p.baptismChurch ?? null,
    communion_church: p.communionChurch ?? null,
    confirmation_church: p.confirmationChurch ?? null,
  });

  const { error: groomError } = await getDb()
    .from('marriage_parties')
    .insert(partyRow(groom, 'GROOM'));
  if (groomError) throw groomError;

  const { error: brideError } = await getDb()
    .from('marriage_parties')
    .insert(partyRow(bride, 'BRIDE'));
  if (brideError) throw brideError;

  if (witnesses.length > 0) {
    const witnessRows = witnesses.map((w, i) => ({
      marriage_id: marriageId,
      full_name: w.fullName,
      phone: w.phone ?? null,
      address: w.address ?? null,
      signature_path: w.signaturePath ?? null,
      sort_order: w.sortOrder ?? i,
    }));
    const { error: witError } = await getDb().from('marriage_witnesses').insert(witnessRows);
    if (witError) throw witError;
  }

  return toMarriage(marriageData as MarriageRow);
}

// Holy orders
export async function getHolyOrders(): Promise<HolyOrder[]> {
  const { data, error } = await getDb().from('holy_orders').select('*').order('id');
  if (error) throw error;
  return (data ?? []).map((r) => toHolyOrder(r as HolyOrderRow));
}

export async function getHolyOrderById(id: number): Promise<HolyOrder | null> {
  const { data, error } = await getDb().from('holy_orders').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toHolyOrder(data as HolyOrderRow) : null;
}

export async function addHolyOrder(record: HolyOrder): Promise<HolyOrder> {
  const row = {
    baptism_id: record.baptismId,
    communion_id: record.communionId,
    confirmation_id: record.confirmationId,
    ordination_date: record.ordinationDate,
    order_type: record.orderType,
    officiating_bishop: record.officiatingBishop,
    parish_id: record.parishId ?? null,
  };
  const { data, error } = await getDb().from('holy_orders').insert(row).select('*').single();
  if (error) throw error;
  return toHolyOrder(data as HolyOrderRow);
}

// nextId not used by Supabase (DB generates ids); export for api-store compatibility
export function nextId<T extends { id: number }>(items: T[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map((i) => i.id)) + 1;
}
