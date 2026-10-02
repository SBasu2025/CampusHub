import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AnimatePresence,
} from "framer-motion";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import type { UserRole } from "../../lib/api/types";

import RequireRole from "../../app/RequireRole";

import PageTransition from "./PageTransition";

import Sidebar from "./Sidebar";

import Topbar from "./Topbar";

// ============================================================
// TYPES
// ============================================================

export interface RoleShellProps {
  /**
   * Role associated with this application shell.
   *
   * ADMIN
   * PROFESSOR
   * STUDENT
   */
  role: UserRole;
}

// ============================================================
// ROLE SHELL
// ============================================================

export function RoleShell({
  role,
}: RoleShellProps) {
  const location = useLocation();

  // The RoleShell is mounted when a user first enters the
  // protected application after login. Keep that first render
  // slower, while normal section-to-section navigation keeps
  // the existing shorter transition.
  const isInitialEntryRef = useRef(true);

  useEffect(() => {
    isInitialEntryRef.current = false;
  }, []);

  // ----------------------------------------------------------
  // DESKTOP SIDEBAR STATE
  // ----------------------------------------------------------

  /**
   * false -> expanded sidebar
   * true  -> collapsed icon-only sidebar
   */
  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false);

  // ----------------------------------------------------------
  // MOBILE SIDEBAR STATE
  // ----------------------------------------------------------

  /**
   * false -> drawer closed
   * true  -> drawer open
   */
  const [
    mobileSidebarOpen,
    setMobileSidebarOpen,
  ] = useState(false);

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <RequireRole
      roles={[role]}
    >
      <div className="flex min-h-screen bg-surface-page">
        {/* ====================================================
            SIDEBAR
            ==================================================== */}

        <Sidebar
          role={role}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => {
            setSidebarCollapsed(
              (current) => !current,
            );
          }}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => {
            setMobileSidebarOpen(false);
          }}
        />

        {/* ====================================================
            MAIN APPLICATION AREA
            ==================================================== */}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          {/* ==================================================
              TOPBAR
              ================================================== */}

          <Topbar
            onMobileMenuClick={() => {
              setMobileSidebarOpen(true);
            }}
          />

          {/* ==================================================
              PAGE CONTENT
              ================================================== */}

          <main className="min-w-0 flex-1">
            <AnimatePresence
              mode="wait"
              initial={isInitialEntryRef.current}
            >
              <PageTransition
                key={location.pathname}
                isInitialEntry={
                  isInitialEntryRef.current
                }
              >
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </RequireRole>
  );
}

export default RoleShell;