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
const defaultDioceses: Diocese[] = [{ id: 1, name: 'Default Diocese' }];

export async function getDioceses(): Promise<Diocese[]> {
  const list = await readJson<Diocese[]>(FILES.dioceses, defaultDioceses);
  if (list.length === 0) {
    await writeJson(FILES.dioceses, defaultDioceses);
    return defaultDioceses;
  }
  return list;
}

// Parishes
const defaultParishes: Parish[] = [
  { id: 1, parishName: 'St Mary', dioceseId: 1 },
  { id: 2, parishName: 'St Joseph', dioceseId: 1 },
];

export async function getParishes(): Promise<Parish[]> {
  const list = await readJson<Parish[]>(FILES.parishes, []);
  if (list.length === 0) {
    await writeJson(FILES.parishes, defaultParishes);
    return defaultParishes;
  }
  return list;
}

// Baptisms
export async function getBaptisms(): Promise<Baptism[]> {
  return readJson<Baptism[]>(FILES.baptisms, []);
}

export async function getBaptismById(id: number): Promise<Baptism | null> {
  const list = await getBaptisms();
  return list.find((b) => b.id === id) ?? null;
}

export async function getBaptismsByParishId(parishId: number): Promise<Baptism[]> {
  const list = await getBaptisms();
  return list.filter((b) => b.parishId === parishId);
}

export async function addBaptism(record: Baptism): Promise<void> {
  const list = await getBaptisms();
  list.push(record);
  await writeJson(FILES.baptisms, list);
}

// Communions
export async function getCommunions(): Promise<FirstHolyCommunion[]> {
  return readJson<FirstHolyCommunion[]>(FILES.communions, []);
}

export async function getCommunionById(id: number): Promise<FirstHolyCommunion | null> {
  const list = await getCommunions();
  return list.find((c) => c.id === id) ?? null;
}

export async function addCommunion(record: FirstHolyCommunion): Promise<void> {
  const list = await getCommunions();
  list.push(record);
  await writeJson(FILES.communions, list);
}

// Confirmations
export async function getConfirmations(): Promise<Confirmation[]> {
  return readJson<Confirmation[]>(FILES.confirmations, []);
}

export async function getConfirmationById(id: number): Promise<Confirmation | null> {
  const list = await getConfirmations();
  return list.find((c) => c.id === id) ?? null;
}

export async function addConfirmation(record: Confirmation): Promise<void> {
  const list = await getConfirmations();
  list.push(record);
  await writeJson(FILES.confirmations, list);
}

// Marriages
export async function getMarriages(): Promise<Marriage[]> {
  return readJson<Marriage[]>(FILES.marriages, []);
}

export async function getMarriageById(id: number): Promise<Marriage | null> {
  const list = await getMarriages();
  return list.find((m) => m.id === id) ?? null;
}

export async function addMarriage(record: Marriage): Promise<void> {
  const list = await getMarriages();
  list.push(record);
  await writeJson(FILES.marriages, list);
}

// Holy orders
export async function getHolyOrders(): Promise<HolyOrder[]> {
  return readJson<HolyOrder[]>(FILES.holyOrders, []);
}

export async function getHolyOrderById(id: number): Promise<HolyOrder | null> {
  const list = await getHolyOrders();
  return list.find((h) => h.id === id) ?? null;
}

export async function addHolyOrder(record: HolyOrder): Promise<void> {
  const list = await getHolyOrders();
  list.push(record);
  await writeJson(FILES.holyOrders, list);
}

export { nextId };
