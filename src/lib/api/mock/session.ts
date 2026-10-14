import { useAuthStore } from '@/lib/auth/store';
import type { AuthSession, AuthUser } from '@/lib/auth/types';

import {
  clearStoredDb,
  db,
  loadDbFromStorage,
  MockApiError,
  nowIso,
  persistDb,
  replaceDb,
  uid,
  type MockBrand,
  type MockCreator,
  type MockUser,
} from './db';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, seedDb } from './seed';

/** Who the mock server thinks is signed in — the equivalent of the bearer token. */
export const session: { userId: string | null } = { userId: null };

/** Seeds synchronously on first use, so a handler never sees an empty database. */
export function ensureDb() {
  if (db.users.length === 0) replaceDb(seedDb());
}

/** App start: reuse the saved demo state if there is one, otherwise seed fresh. */
export async function initMockDb() {
  const stored = await loadDbFromStorage();
  replaceDb(stored ?? seedDb());
  if (!stored) persistDb();
}

/** Throws away every change made while demoing and starts again from the seed. */
export async function resetMockDb() {
  await clearStoredDb();
  replaceDb(seedDb());
  persistDb();
}

/** The mock account behind a stored login: same id, or failing that the same email. */
function matchStoredUser(stored: AuthUser | null | undefined): MockUser | undefined {
  if (!stored) return undefined;
  return (
    db.users.find((u) => u.id === stored.id) ??
    db.users.find((u) => u.email.toLowerCase() === stored.email.trim().toLowerCase())
  );
}

export function currentUser(): MockUser {
  ensureDb();
  let user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    // The in-memory session is lost on a dev reload, and a login saved by an older build of the
    // mock data can carry an id that no longer exists: recover the account from the stored login.
    user = matchStoredUser(useAuthStore.getState().user);
    if (user) {
      session.userId = user.id;
      if (useAuthStore.getState().user?.id !== user.id) useAuthStore.getState().setUser(toAuthUser(user));
    }
  }
  if (!user) {
    // Like the real client after a failed refresh: drop the login so the app returns to Login.
    if (useAuthStore.getState().tokens) setTimeout(() => useAuthStore.getState().clear(), 0);
    throw new MockApiError('Session expired, please log in again', 401);
  }
  return user;
}

export function currentCreator(): MockCreator {
  const user = currentUser();
  const creator = db.creators.find((c) => c.userId === user.id);
  if (!creator) throw new MockApiError('Creator profile not found', 404);
  return creator;
}

export function currentBrand(): MockBrand {
  const user = currentUser();
  const brand = db.brands.find((b) => b.userId === user.id);
  if (!brand) throw new MockApiError('Brand profile not found', 404);
  return brand;
}

export function toAuthUser(u: MockUser): AuthUser {
  return {
    id: u.id,
    email: u.email,
    accountType: u.accountType,
    displayName: u.displayName,
    hasBankAccount: u.hasBankAccount,
    phoneVerified: u.phoneVerified,
  };
}

function sessionFor(u: MockUser): AuthSession {
  session.userId = u.id;
  return {
    user: toAuthUser(u),
    tokens: { accessToken: `mock-access-${u.id}`, refreshToken: `mock-refresh-${u.id}` },
  };
}

export function isDemoEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  return e === DEMO_ACCOUNTS.creator.email || e === DEMO_ACCOUNTS.brand.email;
}

/**
 * `POST /auth/login` (the backend signs up an unknown email on first login). Demo accounts need
 * the demo password; any other email gets a brand-new account that goes through onboarding.
 */
export function mockLogin(email: string, password: string): AuthSession {
  ensureDb();
  const normalized = email.trim().toLowerCase();
  let user = db.users.find((u) => u.email.toLowerCase() === normalized);
  if (user?.password && user.password !== password) {
    throw new MockApiError(
      isDemoEmail(normalized) ? `Wrong password. Demo accounts use ${DEMO_PASSWORD}.` : 'Incorrect email or password',
      401,
    );
  }
  if (!user) {
    user = {
      id: uid(),
      email: normalized,
      password,
      accountType: null,
      displayName: null,
      profilePhotoUrl: null,
      hasBankAccount: false,
      phoneVerified: false,
      createdAt: nowIso(),
    };
    db.users.push(user);
    persistDb();
  }
  return sessionFor(user);
}

/** A cold start with a stored session: point the mock server back at that user. */
export function restoreMockSession(user: AuthUser) {
  ensureDb();
  const match = matchStoredUser(user);
  session.userId = match?.id ?? null;
  if (match && match.id !== user.id) useAuthStore.getState().setUser(toAuthUser(match));
}

export function mockLogout() {
  session.userId = null;
}

export function sessionOf(u: MockUser): AuthSession {
  return sessionFor(u);
}
