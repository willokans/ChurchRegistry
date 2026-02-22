/**
 * In-memory store for Next.js API routes. Resets on server restart.
 */

export interface User {
  username: string;
  displayName: string | null;
  role: string | null;
}

export interface Diocese {
  id: number;
  name: string;
}

export interface Parish {
  id: number;
  parishName: string;
  dioceseId: number;
  description?: string;
}

export interface Baptism {
  id: number;
  baptismName: string;
  surname: string;
  gender: string;
  dateOfBirth: string;
  fathersName: string;
  mothersName: string;
  sponsorNames: string;
  parishId: number;
  address?: string;
  parishAddress?: string;
  parentAddress?: string;
}

export interface FirstHolyCommunion {
  id: number;
  baptismId: number;
  communionDate: string;
  officiatingPriest: string;
  parish: string;
}

export interface Confirmation {
  id: number;
  baptismId: number;
  communionId: number;
  confirmationDate: string;
  officiatingBishop: string;
  parish?: string;
}

export interface Marriage {
  id: number;
  baptismId: number;
  communionId: number;
  confirmationId: number;
  partnersName: string;
  marriageDate: string;
  officiatingPriest: string;
  parish: string;
}

export interface HolyOrder {
  id: number;
  baptismId: number;
  communionId: number;
  confirmationId: number;
  ordinationDate: string;
  orderType: string;
  officiatingBishop: string;
  parishId?: number;
}

// Auth: token -> user (for mock, accept any login and issue a token)
const sessions = new Map<string, User>();

export function createSession(user: User): { token: string; refreshToken: string } {
  const token = `mock-jwt-${Buffer.from(JSON.stringify(user)).toString('base64url')}-${Date.now()}`;
  const refreshToken = `mock-refresh-${Date.now()}`;
  sessions.set(token, user);
  return { token, refreshToken };
}

export function getUserFromToken(authHeader: string | null): User | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  return sessions.get(token) ?? null;
}

// Seed data
let nextDioceseId = 1;
let nextParishId = 1;
let nextBaptismId = 1;
let nextCommunionId = 1;
let nextConfirmationId = 1;
let nextMarriageId = 1;
let nextHolyOrderId = 1;

export const dioceses: Diocese[] = [
  { id: nextDioceseId++, name: 'Default Diocese' },
];

export const parishes: Parish[] = [
  { id: nextParishId++, parishName: 'St Mary', dioceseId: 1 },
  { id: nextParishId++, parishName: 'St Joseph', dioceseId: 1 },
];

export const baptisms: Baptism[] = [];
export const communions: FirstHolyCommunion[] = [];
export const confirmations: Confirmation[] = [];
export const marriages: Marriage[] = [];
export const holyOrders: HolyOrder[] = [];

export function nextId(type: 'baptism' | 'communion' | 'confirmation' | 'marriage' | 'holyOrder'): number {
  switch (type) {
    case 'baptism': return nextBaptismId++;
    case 'communion': return nextCommunionId++;
    case 'confirmation': return nextConfirmationId++;
    case 'marriage': return nextMarriageId++;
    case 'holyOrder': return nextHolyOrderId++;
  }
}
