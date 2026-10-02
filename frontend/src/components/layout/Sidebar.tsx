import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  motion,
} from "framer-motion";

import {
  BarChart3,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Library,
  ListChecks,
  Menu,
  School,
  UserCog,
  UserRound,
  Users,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";

import type { UserRole } from "../../lib/api/types";

// ============================================================
// TYPES
// ============================================================

export interface SidebarProps {
  /**
   * Current authenticated CampusHub role.
   */
  role: UserRole;

  /**
   * Desktop sidebar state.
   *
   * false -> expanded 260px
   * true  -> collapsed 80px
   */
  collapsed: boolean;

  /**
   * Called when desktop collapse/expand is requested.
   */
  onToggleCollapse: () => void;

  /**
   * Mobile drawer state.
   */
  mobileOpen: boolean;

  /**
   * Called when the mobile drawer should close.
   */
  onMobileClose: () => void;
}

// ============================================================
// NAVIGATION TYPES
// ============================================================

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

// ============================================================
// ADMIN NAVIGATION
// ============================================================

const adminNavigation: NavItem[] = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Departments",
    path: "/admin/departments",
    icon: School,
  },
  {
    label: "Courses",
    path: "/admin/courses",
    icon: BookOpen,
  },
  {
    label: "Subjects",
    path: "/admin/subjects",
    icon: Library,
  },
  {
    label: "Professors",
    path: "/admin/professors",
    icon: UserRound,
  },
  {
    label: "Students",
    path: "/admin/students",
    icon: Users,
  },
  {
    label: "Teaching",
    path: "/admin/teaching",
    icon: UsersRound,
  },
  {
    label: "Timetable",
    path: "/admin/timetable",
    icon: CalendarDays,
  },
  {
    label: "Attendance",
    path: "/admin/attendance",
    icon: ClipboardCheck,
  },
  {
    label: "Staff Attendance",
    path: "/admin/staff-attendance",
    icon: ListChecks,
  },
  {
    label: "Examinations",
    path: "/admin/exams",
    icon: BookOpenCheck,
  },
  {
    label: "Admin Accounts",
    path: "/admin/accounts",
    icon: UserCog,
  },
];

// ============================================================
// PROFESSOR NAVIGATION
// ============================================================

const professorNavigation: NavItem[] = [
  {
    label: "Dashboard",
    path: "/professor",
    icon: LayoutDashboard,
  },
  {
    label: "My Profile",
    path: "/professor/profile",
    icon: UserRound,
  },
  {
    label: "My Subjects",
    path: "/professor/subjects",
    icon: Library,
  },
  {
    label: "Timetable",
    path: "/professor/timetable",
    icon: CalendarDays,
  },
  {
    label: "Mark Attendance",
    path: "/professor/attendance",
    icon: ClipboardCheck,
  },
  {
    label: "Attendance History",
    path: "/professor/attendance-history",
    icon: BarChart3,
  },
  {
    label: "My Students",
    path: "/professor/students",
    icon: Users,
  },
  {
    label: "Staff Attendance",
    path: "/professor/staff-attendance",
    icon: ListChecks,
  },
  {
    label: "Exams",
    path: "/professor/exams",
    icon: BookOpenCheck,
  },
];

// ============================================================
// STUDENT NAVIGATION
// ============================================================

const studentNavigation: NavItem[] = [
  {
    label: "Dashboard",
    path: "/student",
    icon: LayoutDashboard,
  },
  {
    label: "My Profile",
    path: "/student/profile",
    icon: UserRound,
  },
  {
    label: "Timetable",
    path: "/student/timetable",
    icon: CalendarDays,
  },
  {
    label: "Attendance",
    path: "/student/attendance",
    icon: ClipboardCheck,
  },
  {
    label: "My Subjects",
    path: "/student/subjects",
    icon: Library,
  },
  {
    label: "My Professors",
    path: "/student/professors",
    icon: GraduationCap,
  },
  {
    label: "Marks & SGPA",
    path: "/student/marks",
    icon: BarChart3,
  },
];

// ============================================================
// NAVIGATION HELPER
// ============================================================

const getNavigationForRole = (
  role: UserRole,
): NavItem[] => {
  switch (role) {
    case "ADMIN":
      return adminNavigation;

    case "PROFESSOR":
      return professorNavigation;

    case "STUDENT":
      return studentNavigation;

    default:
      return [];
  }
};

// ============================================================
// ACTIVE NAVIGATION HELPER
// ============================================================

const isNavigationItemActive = (
  path: string,
  pathname: string,
): boolean => {
  /**
   * Dashboard routes must be exact.
   *
   * Otherwise:
   * /admin
   * would incorrectly remain active on
   * /admin/students.
   */
  if (
    path === "/admin" ||
    path === "/professor" ||
    path === "/student"
  ) {
    return pathname === path;
  }

  /**
   * Detail pages keep their parent navigation active.
   *
   * Example:
   *
   * /admin/professors
   * /admin/professors/PROF_xxx
   *
   * Both activate "Professors".
   */
  return (
    pathname === path ||
    pathname.startsWith(`${path}/`)
  );
};

// ============================================================
// COMPONENT
// ============================================================

export function Sidebar({
  role,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const navigation =
    getNavigationForRole(role);

  const handleNavigate = (
    path: string,
  ) => {
    navigate(path);

    // Selecting an item always closes
    // the mobile drawer.
    onMobileClose();
  };

  const roleLabel =
    role === "ADMIN"
      ? "Administrator"
      : role === "PROFESSOR"
        ? "Professor"
        : "Student";

  const dashboardPath =
    role === "ADMIN"
      ? "/admin"
      : role === "PROFESSOR"
        ? "/professor"
        : "/student";

  return (
    <>
      {/* ======================================================
          MOBILE BACKDROP
          ====================================================== */}

      <motion.button
        type="button"
        aria-label="Close navigation"
        onClick={onMobileClose}
        initial={false}
        animate={{
          opacity: mobileOpen ? 0.4 : 0,
        }}
        transition={{
          duration: 0.28,
          ease: [
            0.16,
            1,
            0.3,
            1,
          ] as const,
        }}
        className={[
          "fixed inset-0 z-40 bg-neutral-950 lg:hidden",
          mobileOpen
            ? "pointer-events-auto"
            : "pointer-events-none",
        ].join(" ")}
      />

      {/* ======================================================
          MOBILE DRAWER
          ====================================================== */}

      <motion.aside
        aria-label={`${roleLabel} navigation`}
        initial={false}
        animate={{
          x: mobileOpen ? 0 : -280,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-neutral-900 text-white shadow-lg lg:hidden"
      >
        {/* Mobile brand/header */}
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <button
            type="button"
            aria-label="Go to dashboard"
            onClick={() => {
              navigate(
                dashboardPath,
              );

              onMobileClose();
            }}
            className="flex min-w-0 items-center gap-3 rounded-md px-2 py-1.5 transition-all duration-150 hover:bg-white/10 active:scale-[0.97]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-brand shadow-glow-primary">
              <span className="font-heading text-lg font-extrabold text-white">
                C
              </span>
            </span>

            <span className="min-w-0 text-left">
              <span className="block truncate font-heading text-base font-bold text-white">
                CampusHub
              </span>

              <span className="block truncate text-xs text-white/60">
                {roleLabel}
              </span>
            </span>
          </button>

          <motion.button
            type="button"
            aria-label="Close navigation"
            onClick={onMobileClose}
            whileTap={{
              scale: 0.97,
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white"
          >
            <X
              size={20}
              strokeWidth={2}
            />
          </motion.button>
        </div>

        {/* Mobile navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <SidebarNavigation
            navigation={navigation}
            pathname={
              location.pathname
            }
            collapsed={false}
            onNavigate={
              handleNavigate
            }
          />
        </nav>
      </motion.aside>

      {/* ======================================================
          DESKTOP SIDEBAR
          ====================================================== */}

      <motion.aside
        aria-label={`${roleLabel} navigation`}
        initial={false}
        animate={{
          width: collapsed
            ? 80
            : 260,
        }}
        transition={{
          duration: 0.3,
          ease: [
            0.16,
            1,
            0.3,
            1,
          ] as const,
        }}
        className="relative z-30 hidden h-screen shrink-0 flex-col overflow-hidden bg-neutral-900 text-white lg:flex"
      >
        {/* ====================================================
            DESKTOP BRAND
            ==================================================== */}

        <div
          className={[
            "flex h-20 shrink-0 items-center border-b border-white/10",
            collapsed
              ? "justify-center px-3"
              : "justify-between px-5",
          ].join(" ")}
        >
          <button
            type="button"
            aria-label="Go to dashboard"
            onClick={() => {
              navigate(
                dashboardPath,
              );
            }}
            className={[
              "flex min-w-0 items-center rounded-md py-1.5 transition-all duration-150 hover:bg-white/10 active:scale-[0.97]",
              collapsed
                ? "justify-center px-1.5"
                : "gap-3 px-2",
            ].join(" ")}
          >
            {/* Logo */}
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-brand shadow-glow-primary">
              <span className="font-heading text-lg font-extrabold text-white">
                C
              </span>
            </span>

            {/* Brand text */}
            <motion.span
              initial={false}
              animate={{
                opacity: collapsed
                  ? 0
                  : 1,
              }}
              transition={{
                duration: 0.12,
              }}
              className={[
                "min-w-0 text-left",
                collapsed
                  ? "pointer-events-none absolute"
                  : "relative",
              ].join(" ")}
            >
              <span className="block truncate font-heading text-base font-bold text-white">
                CampusHub
              </span>

              <span className="block truncate text-xs text-white/60">
                {roleLabel}
              </span>
            </motion.span>
          </button>

          {/* Header collapse button */}
          {!collapsed && (
            <motion.button
              type="button"
              aria-label="Collapse navigation"
              onClick={
                onToggleCollapse
              }
              whileTap={{
                scale: 0.97,
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white/60 transition-colors duration-150 hover:bg-white/10 hover:text-white"
            >
              <Menu
                size={19}
                strokeWidth={2}
              />
            </motion.button>
          )}
        </div>

        {/* ====================================================
            DESKTOP NAVIGATION
            ==================================================== */}

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <SidebarNavigation
            navigation={navigation}
            pathname={
              location.pathname
            }
            collapsed={collapsed}
            onNavigate={
              handleNavigate
            }
          />
        </nav>

        {/* ====================================================
            DESKTOP COLLAPSE/EXPAND
            ==================================================== */}

        <div className="shrink-0 border-t border-white/10 p-3">
          <motion.button
            type="button"
            onClick={
              onToggleCollapse
            }
            whileTap={{
              scale: 0.97,
            }}
            aria-label={
              collapsed
                ? "Expand navigation"
                : "Collapse navigation"
            }
            className={[
              "flex w-full items-center rounded-md text-white/60 transition-colors duration-150 hover:bg-white/10 hover:text-white",
              collapsed
                ? "justify-center px-3 py-3"
                : "gap-3 px-3 py-2.5",
            ].join(" ")}
          >
            <motion.span
              animate={{
                rotate: collapsed
                  ? 180
                  : 0,
              }}
              transition={{
                duration: 0.2,
                ease: "easeInOut",
              }}
              className="shrink-0"
            >
              <Menu
                size={19}
                strokeWidth={2}
              />
            </motion.span>

            <motion.span
              initial={false}
              animate={{
                opacity: collapsed
                  ? 0
                  : 1,
              }}
              transition={{
                duration: 0.12,
              }}
              className={[
                "whitespace-nowrap text-sm font-medium",
                collapsed
                  ? "pointer-events-none absolute"
                  : "relative",
              ].join(" ")}
            >
              Collapse
            </motion.span>
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
}

// ============================================================
// NAVIGATION LIST
// ============================================================

interface SidebarNavigationProps {
  navigation: NavItem[];
  pathname: string;
  collapsed: boolean;
  onNavigate: (
    path: string,
  ) => void;
}

function SidebarNavigation({
  navigation,
  pathname,
  collapsed,
  onNavigate,
}: SidebarNavigationProps) {
  return (
    <div className="space-y-1">
      {navigation.map((item) => {
        const Icon = item.icon;

        const active =
          isNavigationItemActive(
            item.path,
            pathname,
          );

        return (
          <motion.button
            key={item.path}
            type="button"
            onClick={() => {
              onNavigate(
                item.path,
              );
            }}
            whileTap={{
              scale: 0.97,
            }}
            aria-current={
              active
                ? "page"
                : undefined
            }
            title={
              collapsed
                ? item.label
                : undefined
            }
            className={[
              "group relative flex w-full items-center overflow-hidden rounded-md text-left transition-colors duration-150",
              collapsed
                ? "justify-center px-3 py-3"
                : "gap-3 px-3 py-2.5",
              active
                ? "text-white"
                : "text-white/65 hover:bg-white/[0.06] hover:text-white",
            ].join(" ")}
          >
            {/* Active background */}
            {active && (
              <motion.div
                layoutId="nav-active-pill"
                className="absolute inset-0 rounded-md bg-primary-700/80"
                transition={{
                  duration: 0.25,
                  ease: [
                    0.16,
                    1,
                    0.3,
                    1,
                  ] as const,
                }}
              />
            )}

            {/* Active accent */}
            {active && (
              <motion.div
                layoutId="nav-active-accent"
                className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-secondary-400"
                transition={{
                  duration: 0.25,
                  ease: [
                    0.16,
                    1,
                    0.3,
                    1,
                  ] as const,
                }}
              />
            )}

            {/* Icon */}
            <span className="relative z-10 flex shrink-0 items-center justify-center">
              <Icon
                size={19}
                strokeWidth={
                  active
                    ? 2.2
                    : 1.9
                }
              />
            </span>

            {/* Label */}
            <motion.span
              initial={false}
              animate={{
                opacity: collapsed
                  ? 0
                  : 1,
              }}
              transition={{
                duration: 0.12,
              }}
              className={[
                "relative z-10 min-w-0 truncate whitespace-nowrap text-sm font-medium",
                collapsed
                  ? "pointer-events-none absolute"
                  : "relative",
              ].join(" ")}
            >
              {item.label}
            </motion.span>
          </motion.button>
        );
      })}
    </div>
  );
}

export default Sidebar;