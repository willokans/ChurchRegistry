/**
 * Store for Next.js API routes: types, auth (in-memory), and file-based data.
 * Data (dioceses, parishes, sacraments) is persisted in data/*.json and survives restarts.
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

// Auth: token -> user. In-memory map for current sessions; mock tokens are also
// decoded from the token payload so stored tokens survive server restarts.
const sessions = new Map<string, User>();

export function createSession(user: User): { token: string; refreshToken: string } {
  const token = `mock-jwt-${Buffer.from(JSON.stringify(user)).toString('base64url')}-${Date.now()}`;
  const refreshToken = `mock-refresh-${Date.now()}`;
  sessions.set(token, user);
  return { token, refreshToken };
}

function decodeMockToken(token: string): User | null {
  if (!token.startsWith('mock-jwt-')) return null;
  const rest = token.slice(9); // after "mock-jwt-"
  const lastDash = rest.lastIndexOf('-');
  if (lastDash === -1) return null;
  const base64Part = rest.slice(0, lastDash);
  try {
    const json = Buffer.from(base64Part, 'base64url').toString('utf-8');
    const user = JSON.parse(json) as User;
    if (typeof user.username !== 'string') return null;
    return {
      username: user.username,
      displayName: user.displayName ?? null,
      role: user.role ?? null,
    };
  } catch {
    return null;
  }
}

export function getUserFromToken(authHeader: string | null): User | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  return sessions.get(token) ?? decodeMockToken(token);
}

// File-based data (re-export from file-store)
export {
  getDioceses,
  addDiocese,
  getParishes,
  addParish,
  getBaptisms,
  getBaptismById,
  getBaptismsByParishId,
  addBaptism,
  getCommunions,
  getCommunionById,
  addCommunion,
  getConfirmations,
  getConfirmationById,
  addConfirmation,
  getMarriages,
  getMarriageById,
  addMarriage,
  getHolyOrders,
  getHolyOrderById,
  addHolyOrder,
  nextId,
} from './file-store';
