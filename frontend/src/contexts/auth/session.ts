import type { AuthUser, UserProfile } from './types';

export const STORAGE_KEY = 'bazar_user';

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getTokenExpiry(token: string | undefined): number {
  if (!token) return 0;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (payload.exp ?? 0) * 1000;
  } catch {
    return 0;
  }
}

export function readUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as AuthUser;
    // Auto-clear expired token so user is shown as logged out on next visit
    if (getTokenExpiry(u.token) < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return u;
  } catch {
    return null;
  }
}

export function shapeUser(apiUser: {
  id: string; name: string; email: string | null; phone?: string | null;
  profile: {
    ageGroup: string; budgetLevel: string;
    preferredBrands: string[]; preferredCategories: string[];
  };
}, token: string): AuthUser {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email ?? '',
    phone: apiUser.phone ?? '',
    token,
    profile: {
      name: apiUser.name,
      email: apiUser.email ?? '',
      ageGroup: apiUser.profile.ageGroup as UserProfile['ageGroup'],
      budgetLevel: apiUser.profile.budgetLevel as UserProfile['budgetLevel'],
      preferredBrands: apiUser.profile.preferredBrands,
      preferredCategories: apiUser.profile.preferredCategories,
    },
  };
}
