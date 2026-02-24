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
  otherNames: string;
  surname: string;
  gender: string;
  dateOfBirth: string;
  fathersName: string;
  mothersName: string;
  sponsorNames: string;
  officiatingPriest: string;
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

// Data store: Supabase when configured, otherwise file-store
import { isSupabaseConfigured } from './supabase-server';
import * as fileStore from './file-store';
import * as supabaseStore from './supabase-store';

function storeUsesSupabase(): boolean {
  return isSupabaseConfigured();
}

export async function getDioceses() {
  return storeUsesSupabase() ? supabaseStore.getDioceses() : fileStore.getDioceses();
}
export async function addDiocese(name: string) {
  return storeUsesSupabase() ? supabaseStore.addDiocese(name) : fileStore.addDiocese(name);
}
export async function getParishes() {
  return storeUsesSupabase() ? supabaseStore.getParishes() : fileStore.getParishes();
}
export async function addParish(dioceseId: number, parishName: string) {
  return storeUsesSupabase() ? supabaseStore.addParish(dioceseId, parishName) : fileStore.addParish(dioceseId, parishName);
}
export async function getBaptisms() {
  return storeUsesSupabase() ? supabaseStore.getBaptisms() : fileStore.getBaptisms();
}
export async function getBaptismById(id: number) {
  return storeUsesSupabase() ? supabaseStore.getBaptismById(id) : fileStore.getBaptismById(id);
}
export async function getBaptismsByParishId(parishId: number) {
  return storeUsesSupabase() ? supabaseStore.getBaptismsByParishId(parishId) : fileStore.getBaptismsByParishId(parishId);
}
export async function addBaptism(record: Parameters<typeof fileStore.addBaptism>[0]) {
  return storeUsesSupabase() ? supabaseStore.addBaptism(record) : fileStore.addBaptism(record);
}
export async function getCommunions() {
  return storeUsesSupabase() ? supabaseStore.getCommunions() : fileStore.getCommunions();
}
export async function getCommunionById(id: number) {
  return storeUsesSupabase() ? supabaseStore.getCommunionById(id) : fileStore.getCommunionById(id);
}
export async function addCommunion(record: Parameters<typeof fileStore.addCommunion>[0]) {
  return storeUsesSupabase() ? supabaseStore.addCommunion(record) : fileStore.addCommunion(record);
}
export async function getConfirmations() {
  return storeUsesSupabase() ? supabaseStore.getConfirmations() : fileStore.getConfirmations();
}
export async function getConfirmationById(id: number) {
  return storeUsesSupabase() ? supabaseStore.getConfirmationById(id) : fileStore.getConfirmationById(id);
}
export async function addConfirmation(record: Parameters<typeof fileStore.addConfirmation>[0]) {
  return storeUsesSupabase() ? supabaseStore.addConfirmation(record) : fileStore.addConfirmation(record);
}
export async function getMarriages() {
  return storeUsesSupabase() ? supabaseStore.getMarriages() : fileStore.getMarriages();
}
export async function getMarriageById(id: number) {
  return storeUsesSupabase() ? supabaseStore.getMarriageById(id) : fileStore.getMarriageById(id);
}
export async function addMarriage(record: Parameters<typeof fileStore.addMarriage>[0]) {
  return storeUsesSupabase() ? supabaseStore.addMarriage(record) : fileStore.addMarriage(record);
}
export async function getHolyOrders() {
  return storeUsesSupabase() ? supabaseStore.getHolyOrders() : fileStore.getHolyOrders();
}
export async function getHolyOrderById(id: number) {
  return storeUsesSupabase() ? supabaseStore.getHolyOrderById(id) : fileStore.getHolyOrderById(id);
}
export async function addHolyOrder(record: Parameters<typeof fileStore.addHolyOrder>[0]) {
  return storeUsesSupabase() ? supabaseStore.addHolyOrder(record) : fileStore.addHolyOrder(record);
}
export function nextId<T extends { id: number }>(items: T[]) {
  return fileStore.nextId(items);
}
