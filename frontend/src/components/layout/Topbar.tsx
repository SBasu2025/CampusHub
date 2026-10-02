import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  ChevronDown,
  LogOut,
  Menu,
  UserRound,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../lib/auth/useAuth";

import type {
  UserRole,
} from "../../lib/api/types";

// ============================================================
// TYPES
// ============================================================

export interface TopbarProps {
  /**
   * Opens the mobile navigation drawer.
   */
  onMobileMenuClick: () => void;
}

// ============================================================
// PAGE TITLES
// ============================================================

const pageTitles: Record<
  string,
  string
> = {
  // ADMIN
  "/admin":
    "Dashboard",
  "/admin/departments":
    "Departments",
  "/admin/courses":
    "Courses",
  "/admin/subjects":
    "Subjects",
  "/admin/professors":
    "Professors",
  "/admin/students":
    "Students",
  "/admin/teaching":
    "Teaching",
  "/admin/timetable":
    "Timetable",
  "/admin/attendance":
    "Attendance",
  "/admin/staff-attendance":
    "Staff Attendance",
  "/admin/exams":
    "Examinations",
  "/admin/accounts":
    "Admin Accounts",

  // PROFESSOR
  "/professor":
    "Dashboard",
  "/professor/profile":
    "My Profile",
  "/professor/subjects":
    "My Subjects",
  "/professor/timetable":
    "Timetable",
  "/professor/attendance":
    "Mark Attendance",
  "/professor/attendance-history":
    "Attendance History",
  "/professor/students":
    "My Students",
  "/professor/staff-attendance":
    "Staff Attendance",
  "/professor/exams":
    "Exams",

  // STUDENT
  "/student":
    "Dashboard",
  "/student/profile":
    "My Profile",
  "/student/timetable":
    "Timetable",
  "/student/attendance":
    "Attendance",
  "/student/subjects":
    "My Subjects",
  "/student/professors":
    "My Professors",
  "/student/marks":
    "Marks & SGPA",
};

// ============================================================
// ROLE HELPERS
// ============================================================

const getRoleLabel = (
  role: UserRole,
): string => {
  switch (role) {
    case "ADMIN":
      return "ADMIN";

    case "PROFESSOR":
      return "PROFESSOR";

    case "STUDENT":
      return "STUDENT";
  }
};

const getRoleBadgeClasses = (
  role: UserRole,
): string => {
  switch (role) {
    case "ADMIN":
      return "bg-primary-50 text-primary-700";

    case "PROFESSOR":
      return "bg-secondary-50 text-secondary-700";

    case "STUDENT":
      return "bg-accent-50 text-accent-800";
  }
};

// ============================================================
// AVATAR HELPERS
// ============================================================

const getInitials = (
  displayName: string,
): string => {
  const parts = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (
    parts.length === 0
  ) {
    return "C";
  }

  if (
    parts.length === 1
  ) {
    return parts[0]
      .slice(0, 1)
      .toUpperCase();
  }

  return (
    parts[0].slice(0, 1) +
    parts[
      parts.length - 1
    ].slice(0, 1)
  ).toUpperCase();
};

const getAvatarBackgroundClass = (
  id: string,
): string => {
  /**
   * Static Tailwind class strings are
   * used so Tailwind can detect them.
   */
  const backgrounds = [
    "bg-primary-600",
    "bg-primary-700",
    "bg-secondary-600",
    "bg-secondary-700",
    "bg-accent-600",
    "bg-accent-700",
  ];

  let hash = 0;

  for (
    let index = 0;
    index < id.length;
    index += 1
  ) {
    hash =
      (hash << 5) -
      hash +
      id.charCodeAt(index);

    hash |= 0;
  }

  const normalizedHash =
    Math.abs(hash) %
    backgrounds.length;

  return backgrounds[
    normalizedHash
  ];
};

// ============================================================
// PAGE TITLE HELPER
// ============================================================

const getPageTitle = (
  pathname: string,
): string => {
  const exactTitle =
    pageTitles[pathname];

  if (exactTitle) {
    return exactTitle;
  }

  // Admin professor detail
  if (
    pathname.startsWith(
      "/admin/professors/",
    )
  ) {
    return "Professor Details";
  }

  // Admin student detail
  if (
    pathname.startsWith(
      "/admin/students/",
    )
  ) {
    return "Student Details";
  }

  // Professor attendance session
  if (
    pathname.startsWith(
      "/professor/attendance/",
    )
  ) {
    return "Mark Attendance";
  }

  return "CampusHub";
};

// ============================================================
// DASHBOARD ROUTE HELPER
// ============================================================

const getDashboardPath = (
  role: UserRole,
): string => {
  switch (role) {
    case "ADMIN":
      return "/admin";

    case "PROFESSOR":
      return "/professor";

    case "STUDENT":
      return "/student";
  }
};

// ============================================================
// COMPONENT
// ============================================================

export function Topbar({
  onMobileMenuClick,
}: TopbarProps) {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  // ----------------------------------------------------------
  // CLOSE USER MENU ON ROUTE CHANGE
  // ----------------------------------------------------------

  useEffect(() => {
    setMenuOpen(false);
  }, [
    location.pathname,
  ]);

  // ----------------------------------------------------------
  // DERIVED VALUES
  // ----------------------------------------------------------

  const pageTitle =
    useMemo(
      () =>
        getPageTitle(
          location.pathname,
        ),
      [
        location.pathname,
      ],
    );

  const initials =
    useMemo(
      () =>
        user
          ? getInitials(
              user.displayName,
            )
          : "C",
      [user],
    );

  const avatarBackground =
    useMemo(
      () =>
        user
          ? getAvatarBackgroundClass(
              user.id,
            )
          : "bg-primary-600",
      [user],
    );

  // ----------------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------------

  const handleLogout =
    async () => {
      try {
        await logout();
      } finally {
        navigate(
          "/login",
          {
            replace: true,
          },
        );
      }
    };

  // ----------------------------------------------------------
  // AUTH SAFETY
  // ----------------------------------------------------------

  if (!user) {
    return null;
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <header className="sticky top-0 z-20 flex h-20 shrink-0 items-center justify-between border-b border-neutral-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      {/* ====================================================
          LEFT
          ==================================================== */}

      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile navigation */}
        <motion.button
          type="button"
          onClick={
            onMobileMenuClick
          }
          whileTap={{
            scale: 0.97,
          }}
          aria-label="Open navigation"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-neutral-600 transition-colors duration-150 hover:bg-neutral-100 hover:text-primary-600 lg:hidden"
        >
          <Menu
            size={21}
            strokeWidth={2}
          />
        </motion.button>

        {/* Page title */}
        <AnimatePresence
          mode="wait"
          initial={false}
        >
          <motion.h1
            key={
              location.pathname
            }
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -8,
            }}
            transition={{
              duration: 0.35,
              ease: [
                0.16,
                1,
                0.3,
                1,
              ] as const,
            }}
            className="truncate font-heading text-h1 text-neutral-800"
          >
            {pageTitle}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* ====================================================
          RIGHT
          ==================================================== */}

      <div className="relative flex items-center">
        {/* User trigger */}
        <button
          type="button"
          onClick={() => {
            setMenuOpen(
              (current) =>
                !current,
            );
          }}
          aria-expanded={
            menuOpen
          }
          aria-haspopup="menu"
          className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors duration-150 hover:bg-neutral-50"
        >
          {/* Avatar */}
          <motion.div
            whileTap={{
              scale: 0.97,
            }}
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm",
              avatarBackground,
            ].join(" ")}
          >
            <span className="font-heading">
              {initials}
            </span>
          </motion.div>

          {/* User info */}
          <div className="hidden min-w-0 text-left sm:block">
            <p className="max-w-[180px] truncate text-sm font-semibold text-neutral-800">
              {user.displayName}
            </p>

            <span
              className={[
                "mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                getRoleBadgeClasses(
                  user.role,
                ),
              ].join(" ")}
            >
              {getRoleLabel(
                user.role,
              )}
            </span>
          </div>

          {/* Chevron */}
          <motion.span
            animate={{
              rotate: menuOpen
                ? 180
                : 0,
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
            className="hidden text-neutral-400 sm:block"
          >
            <ChevronDown
              size={17}
              strokeWidth={2}
            />
          </motion.span>
        </button>

        {/* ==================================================
            USER MENU
            ================================================== */}

        <AnimatePresence>
          {menuOpen && (
            <>
              {/* Click-away layer */}
              <button
                type="button"
                aria-label="Close user menu"
                onClick={() => {
                  setMenuOpen(false);
                }}
                className="fixed inset-0 z-30 cursor-default"
              />

              {/* Dropdown */}
              <motion.div
                role="menu"
                initial={{
                  opacity: 0,
                  scaleY: 0.95,
                  y: -4,
                }}
                animate={{
                  opacity: 1,
                  scaleY: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scaleY: 0.95,
                  y: -4,
                }}
                transition={{
                  duration: 0.16,
                  ease: [
                    0.16,
                    1,
                    0.3,
                    1,
                  ] as const,
                }}
                style={{
                  transformOrigin:
                    "top right",
                }}
                className="absolute right-0 top-[calc(100%+8px)] z-40 w-64 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg"
              >
                {/* User summary */}
                <div className="border-b border-neutral-200 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={[
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
                        avatarBackground,
                      ].join(" ")}
                    >
                      <span className="font-heading">
                        {initials}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-800">
                        {user.displayName}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-neutral-500">
                        {user.id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-2">
                  {/* Dashboard */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(
                        false,
                      );

                      navigate(
                        getDashboardPath(
                          user.role,
                        ),
                      );
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-neutral-600 transition-colors duration-150 hover:bg-neutral-50 hover:text-primary-600"
                  >
                    <UserRound
                      size={17}
                      strokeWidth={1.9}
                    />

                    <span>
                      My Dashboard
                    </span>
                  </button>

                  {/* Logout */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={
                      handleLogout
                    }
                    className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-danger-text transition-colors duration-150 hover:bg-danger-bg"
                  >
                    <LogOut
                      size={17}
                      strokeWidth={1.9}
                    />

                    <span>
                      Logout
                    </span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

export default Topbar;