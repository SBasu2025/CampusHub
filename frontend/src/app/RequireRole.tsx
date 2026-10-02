import type { ReactNode } from "react";

import {
  Navigate,
  useLocation,
} from "react-router-dom";

import type { UserRole } from "../lib/api/types";
import { useAuthStore } from "../lib/auth/store";

// ============================================================
// TYPES
// ============================================================

interface RequireRoleProps {
  /**
   * Roles allowed to access the protected content.
   */
  roles: UserRole[];

  /**
   * Protected page/content.
   */
  children: ReactNode;
}

// ============================================================
// ACCESS DENIED
// ============================================================

function AccessDenied() {
  const location = useLocation();

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-surface-page px-6"
      aria-labelledby="access-denied-title"
    >
      <div className="w-full max-w-lg rounded-xl bg-surface-card p-8 text-center shadow-brand-lg">
        {/* 403 indicator */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger-bg">
          <span className="font-heading text-2xl font-extrabold text-danger-text">
            403
          </span>
        </div>

        {/* Brand */}
        <p className="mt-6 font-heading text-caption uppercase text-primary-600">
          CampusHub
        </p>

        {/* Heading */}
        <h1
          id="access-denied-title"
          className="mt-2 font-heading text-h1 text-heading"
        >
          Access denied
        </h1>

        {/* Description */}
        <p className="mt-3 text-body text-muted">
          You don't have permission to access this page.
        </p>

        {/* Current route */}
        <p className="mt-2 break-all text-body-sm text-neutral-400">
          {location.pathname}
        </p>

        {/* Navigation */}
        <button
          type="button"
          onClick={() => {
            window.history.back();
          }}
          className="mt-6 rounded-md gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-brand-sm transition-all duration-150 hover:brightness-105 hover:shadow-glow-primary active:scale-[0.97]"
        >
          Go back
        </button>
      </div>
    </main>
  );
}

// ============================================================
// ROLE GUARD
// ============================================================

export function RequireRole({
  roles,
  children,
}: RequireRoleProps) {
  const user = useAuthStore(
    (state) => state.user,
  );

  // ----------------------------------------------------------
  // NO AUTHENTICATED USER
  // ----------------------------------------------------------

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // ----------------------------------------------------------
  // ROLE NOT ALLOWED
  // ----------------------------------------------------------

  if (!roles.includes(user.role)) {
    return <AccessDenied />;
  }

  // ----------------------------------------------------------
  // AUTHORIZED
  // ----------------------------------------------------------

  return <>{children}</>;
}

export default RequireRole;