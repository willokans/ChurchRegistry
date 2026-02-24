/**
 * File-based JSON store so data survives server restarts (local dev).
 * Data is stored in the `data/` directory at the project root.
 */

import fs from 'fs/promises';
import path from 'path';
import type { Diocese, Parish, Baptism, FirstHolyCommunion, Confirmation, Marriage, HolyOrder } from './api-store';

const DATA_DIR = path.join(process.cwd(), 'data');

const FILES = {
  dioceses: 'dioceses.json',
  parishes: 'parishes.json',
  baptisms: 'baptisms.json',
  communions: 'communions.json',
  confirmations: 'confirmations.json',
  marriages: 'marriages.json',
  holyOrders: 'holy-orders.json',
} as const;

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(filename: string, defaultValue: T): Promise<T> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

async function writeJson<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function nextId<T extends { id: number }>(items: T[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map((i) => i.id)) + 1;
}

// Dioceses
export async function getDioceses(): Promise<Diocese[]> {
  const list = await readJson<Diocese[]>(FILES.dioceses, []);
  if (list.length === 0) {
    await writeJson(FILES.dioceses, []);
    return [];
  }
  return list;
}

export async function addDiocese(name: string): Promise<Diocese> {
  const list = await getDioceses();
  const diocese: Diocese = { id: nextId(list), name };
  list.push(diocese);
  await writeJson(FILES.dioceses, list);
  return diocese;
}

// Parishes
export async function getParishes(): Promise<Parish[]> {
  const list = await readJson<Parish[]>(FILES.parishes, []);
  if (list.length === 0) {
    await writeJson(FILES.parishes, []);
    return [];
  }
  return list;
}

export async function addParish(dioceseId: number, parishName: string): Promise<Parish> {
  const list = await getParishes();
  const parish: Parish = { id: nextId(list), parishName, dioceseId };
  list.push(parish);
  await writeJson(FILES.parishes, list);
  return parish;
}

// Baptisms (normalize so old JSON without officiatingPriest still conforms to Baptism)
function normalizeBaptism(b: Baptism & { officiatingPriest?: string }): Baptism {
  return { ...b, officiatingPriest: b.officiatingPriest ?? '' };
}
export async function getBaptisms(): Promise<Baptism[]> {
  const list = await readJson<(Baptism & { officiatingPriest?: string })[]>(FILES.baptisms, []);
  return list.map(normalizeBaptism);
}

export async function getBaptismById(id: number): Promise<Baptism | null> {
  const list = await getBaptisms();
  return list.find((b) => b.id === id) ?? null;
}

export async function getBaptismsByParishId(parishId: number): Promise<Baptism[]> {
  const list = await getBaptisms();
  return list.filter((b) => b.parishId === parishId);
}

export async function addBaptism(record: Baptism): Promise<Baptism> {
  const list = await getBaptisms();
  list.push(record);
  await writeJson(FILES.baptisms, list);
  return record;
}

// Communions
export async function getCommunions(): Promise<FirstHolyCommunion[]> {
  return readJson<FirstHolyCommunion[]>(FILES.communions, []);
}

export async function getCommunionById(id: number): Promise<FirstHolyCommunion | null> {
  const list = await getCommunions();
  return list.find((c) => c.id === id) ?? null;
}

export async function addCommunion(record: FirstHolyCommunion): Promise<FirstHolyCommunion> {
  const list = await getCommunions();
  list.push(record);
  await writeJson(FILES.communions, list);
  return record;
}

// Confirmations
export async function getConfirmations(): Promise<Confirmation[]> {
  return readJson<Confirmation[]>(FILES.confirmations, []);
}

export async function getConfirmationById(id: number): Promise<Confirmation | null> {
  const list = await getConfirmations();
  return list.find((c) => c.id === id) ?? null;
}

export async function addConfirmation(record: Confirmation): Promise<Confirmation> {
  const list = await getConfirmations();
  list.push(record);
  await writeJson(FILES.confirmations, list);
  return record;
}

// Marriages
export async function getMarriages(): Promise<Marriage[]> {
  return readJson<Marriage[]>(FILES.marriages, []);
}

export async function getMarriageById(id: number): Promise<Marriage | null> {
  const list = await getMarriages();
  return list.find((m) => m.id === id) ?? null;
}

export async function addMarriage(record: Marriage): Promise<Marriage> {
  const list = await getMarriages();
  list.push(record);
  await writeJson(FILES.marriages, list);
  return record;
}

// Holy orders
export async function getHolyOrders(): Promise<HolyOrder[]> {
  return readJson<HolyOrder[]>(FILES.holyOrders, []);
}

export async function getHolyOrderById(id: number): Promise<HolyOrder | null> {
  const list = await getHolyOrders();
  return list.find((h) => h.id === id) ?? null;
}

export async function addHolyOrder(record: HolyOrder): Promise<HolyOrder> {
  const list = await getHolyOrders();
  list.push(record);
  await writeJson(FILES.holyOrders, list);
  return record;
}

export { nextId };
