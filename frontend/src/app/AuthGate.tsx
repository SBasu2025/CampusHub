import {
  type ReactNode,
  useEffect,
  useState,
} from "react";

import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";

import { useAuth } from "../lib/auth/useAuth";

// ============================================================
// TYPES
// ============================================================

interface AuthGateProps {
  children: ReactNode;

  /**
   * Optional content shown when there is no authenticated user.
   *
   * Normally this will be the Login screen.
   */
  unauthenticated?: ReactNode;
}

// ============================================================
// MOTION
// ============================================================

const loadingContainerVariants = {
  initial: {
    opacity: 0,
  },

  animate: {
    opacity: 1,
    transition: {
      duration: 0.35,
      ease: [
        0.16,
        1,
        0.3,
        1,
      ] as const,
    },
  },
};

const loadingContentVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },

  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [
        0.16,
        1,
        0.3,
        1,
      ] as const,
    },
  },
};

// ============================================================
// COMPONENT
// ============================================================

export function AuthGate({
  children,
  unauthenticated,
}: AuthGateProps) {
  const {
    user,
    isHydrated,
    hydrate,
  } = useAuth();

  const [isHydrating, setIsHydrating] =
    useState(true);

  const [hydrationError, setHydrationError] =
    useState<string | null>(null);

  // ----------------------------------------------------------
  // INITIAL SESSION CHECK
  // ----------------------------------------------------------

  useEffect(() => {
    let mounted = true;

    const hydrateSession = async () => {
      setIsHydrating(true);
      setHydrationError(null);

      try {
        await hydrate();
      } catch {
        if (!mounted) {
          return;
        }

        setHydrationError(
          "Unable to verify your CampusHub session.",
        );
      } finally {
        if (mounted) {
          setIsHydrating(false);
        }
      }
    };

    void hydrateSession();

    return () => {
      mounted = false;
    };
  }, [hydrate]);

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  if (
    isHydrating ||
    !isHydrated
  ) {
    return (
      <motion.div
        className="flex min-h-screen items-center justify-center bg-surface-page px-6"
        variants={
          loadingContainerVariants
        }
        initial="initial"
        animate="animate"
        aria-live="polite"
        aria-busy="true"
      >
        <motion.div
          className="w-full max-w-md"
          variants={
            loadingContentVariants
          }
        >
          <div className="overflow-hidden rounded-xl bg-surface-card shadow-brand-lg">
            {/* Brand header */}
            <div className="gradient-brand px-8 py-7">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <span className="font-heading text-xl font-bold text-white">
                    C
                  </span>
                </div>

                <div>
                  <p className="font-heading text-xl font-bold text-white">
                    CampusHub
                  </p>

                  <p className="mt-1 text-sm text-white/80">
                    Checking your session
                  </p>
                </div>
              </div>
            </div>

            {/* Loading content */}
            <div className="px-8 py-7">
              <div className="space-y-4">
                <div className="h-3 w-3/4 animate-shimmer rounded-full bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]" />

                <div className="h-3 w-1/2 animate-shimmer rounded-full bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]" />

                <div className="flex items-center gap-3 pt-2">
                  <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-secondary-500" />

                  <p className="text-sm text-muted">
                    Connecting securely to CampusHub...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ----------------------------------------------------------
  // HYDRATION FAILURE
  // ----------------------------------------------------------

  if (hydrationError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-page px-6">
        <div className="w-full max-w-md rounded-xl bg-surface-card p-8 text-center shadow-brand-lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-bg">
            <span className="font-heading text-lg font-bold text-danger-text">
              !
            </span>
          </div>

          <h1 className="mt-5 font-heading text-h3 text-heading">
            Session check failed
          </h1>

          <p className="mt-2 text-sm text-muted">
            {hydrationError}
          </p>

          <button
            type="button"
            onClick={() => {
              window.location.reload();
            }}
            className="mt-6 rounded-md gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-brand-sm transition-all duration-150 hover:brightness-105 hover:shadow-glow-primary active:scale-[0.97]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // NOT AUTHENTICATED
  // ----------------------------------------------------------

  if (!user) {
    if (unauthenticated) {
      return (
        <>
          {unauthenticated}
        </>
      );
    }

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // ----------------------------------------------------------
  // AUTHENTICATED
  // ----------------------------------------------------------

  return <>{children}</>;
}

export default AuthGate;