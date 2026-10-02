import {
  type ReactNode,
  useState,
} from "react";

import {
  LazyMotion,
  MotionConfig,
  domAnimation,
} from "framer-motion";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { Toaster } from "react-hot-toast";

// ============================================================
// TYPES
// ============================================================

interface AppProvidersProps {
  children: ReactNode;
}

// ============================================================
// PROVIDERS
// ============================================================

export function AppProviders({
  children,
}: AppProvidersProps) {
  /**
   * Create QueryClient exactly once.
   *
   * useState with a lazy initializer guarantees that the same
   * QueryClient survives normal React re-renders.
   */
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            /**
             * CampusHub dashboard/list data generally does not
             * need a network request on every render.
             */
            staleTime: 60_000,

            /**
             * A single retry is enough for transient failures
             * without making the UI feel stuck.
             */
            retry: 1,

            /**
             * Refetch stale data when the browser window
             * receives focus again.
             */
            refetchOnWindowFocus: true,
          },

          /**
           * Mutations such as:
           *
           * - marking attendance
           * - correcting attendance
           * - creating exams
           * - entering marks
           * - promoting students
           *
           * should not automatically retry because repeating
           * a mutation can be unsafe.
           */
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider
      client={queryClient}
    >
      {/* ======================================================
          FRAMER MOTION
          ====================================================== */}

      <LazyMotion
        features={domAnimation}
      >
        <MotionConfig
          /**
           * Respect the operating system's
           * prefers-reduced-motion setting.
           */
          reducedMotion="user"
        >
          {children}
        </MotionConfig>
      </LazyMotion>

      {/* ======================================================
          GLOBAL TOASTS
          ====================================================== */}

      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={10}
        toastOptions={{
          /**
           * Spec:
           * default lifetime = 4000ms
           */
          duration: 4000,

          style: {
            background: "#FFFFFF",
            color: "#242E34",
            borderRadius: "12px",
            boxShadow:
              "0 12px 32px rgba(23,66,81,0.12)",
            padding: "14px 16px",
            fontFamily:
              "Inter, sans-serif",
            fontSize: "0.875rem",
            fontWeight: 500,
          },

          success: {
            iconTheme: {
              primary: "#218DAE",
              secondary: "#FFFFFF",
            },
          },

          error: {
            iconTheme: {
              primary: "#E14B4B",
              secondary: "#FFFFFF",
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default AppProviders;