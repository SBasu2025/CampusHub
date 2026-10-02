import { create } from "zustand";

import type { AuthUser } from "../api/types";

// ============================================================
// AUTH STORE STATE
// ============================================================

interface AuthState {
  /**
   * Currently authenticated CampusHub user.
   *
   * null means no authenticated user is currently stored.
   */
  user: AuthUser | null;

  /**
   * True after the initial GET /api/auth/me request
   * has completed.
   *
   * AuthGate uses this to prevent protected routes from
   * rendering before the authentication state is known.
   */
  isHydrated: boolean;

  /**
   * Store the authenticated user.
   */
  setUser: (user: AuthUser) => void;

  /**
   * Clear client-side authentication state.
   *
   * Server-side logout is handled separately through
   * POST /api/auth/logout.
   */
  clearUser: () => void;

  /**
   * Mark initial authentication hydration as completed.
   */
  setHydrated: (hydrated: boolean) => void;
}

// ============================================================
// ZUSTAND STORE
// ============================================================

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  isHydrated: false,

  setUser: (user) => {
    set({
      user,
    });
  },

  clearUser: () => {
    set({
      user: null,
    });
  },

  setHydrated: (hydrated) => {
    set({
      isHydrated: hydrated,
    });
  },
}));

// ============================================================
// SELECTORS
// ============================================================

/**
 * Return the authenticated user.
 */
export const selectAuthUser = (
  state: AuthState,
): AuthUser | null => state.user;

/**
 * Return whether a user is authenticated.
 */
export const selectIsAuthenticated = (
  state: AuthState,
): boolean => state.user !== null;

/**
 * Return the current user's role.
 */
export const selectUserRole = (
  state: AuthState,
): AuthUser["role"] | null =>
  state.user?.role ?? null;