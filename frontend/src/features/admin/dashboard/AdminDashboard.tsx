import {
  motion,
} from "framer-motion";

import {
  BookOpen,
  Building2,
  GraduationCap,
  Library,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import type {
  ComponentType,
} from "react";

import {
  Link,
} from "react-router-dom";

import AttendanceDonutChart from "../../../components/charts/AttendanceDonutChart";

import Card from "../../../components/ui/Card";

import EmptyState from "../../../components/ui/EmptyState";

import Skeleton from "../../../components/ui/Skeleton";

import {
  useCountUp,
} from "../../../lib/hooks/useCountUp";

import {
  useAdminDashboard,
} from "./useAdminDashboard";

// ============================================================
// MOTION
// ============================================================

const cardTransition = {
  duration: 0.35,

  ease: [
    0.16,
    1,
    0.3,
    1,
  ] as const,
};

const staggerContainer = {
  hidden: {},

  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const staggerItem = {
  hidden: {
    opacity: 0,
    y: 16,
  },

  show: {
    opacity: 1,
    y: 0,

    transition:
      cardTransition,
  },
};

// ============================================================
// ICON TYPES
// ============================================================

interface IconProps {
  size?: number;
  strokeWidth?: number;
}

// ============================================================
// KPI CARD
// ============================================================

interface KpiCardProps {
  label: string;

  value: number;

  subtitle?: string;

  icon: ComponentType<IconProps>;

  warm?: boolean;
}

function KpiCard({
  label,
  value,
  subtitle,
  icon: Icon,
  warm = false,
}: KpiCardProps) {
  const animatedValue =
    useCountUp(
      value,
      900,
    );

  return (
    <motion.div
      variants={
        staggerItem
      }
      className="h-full"
    >
      <Card
        className={[
          "h-full",
          warm
            ? "bg-gradient-warm"
            : "",
        ].join(" ")}
      >
        <div className="flex h-full items-start justify-between gap-4">
          {/* ==================================================
              VALUE AREA
              ================================================== */}

          <div className="min-w-0">
            <p className="text-body-sm font-medium text-muted">
              {label}
            </p>

            <p className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-heading tabular-nums">
              {Math.round(
                animatedValue,
              ).toLocaleString()}
            </p>

            {subtitle && (
              <p className="mt-1 text-caption text-muted">
                {subtitle}
              </p>
            )}
          </div>

          {/* ==================================================
              ICON
              ================================================== */}

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Icon
              size={21}
              strokeWidth={1.8}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ============================================================
// QUICK LINK
// ============================================================

interface QuickLinkProps {
  to: string;

  label: string;

  icon: ComponentType<IconProps>;

  description: string;
}

function QuickLink({
  to,
  label,
  icon: Icon,
  description,
}: QuickLinkProps) {
  return (
    <motion.div
      variants={
        staggerItem
      }
      whileHover={{
        y: -4,
      }}
      transition={{
        duration: 0.18,
      }}
      className="h-full"
    >
      <Link
        to={to}
        className="group block h-full"
      >
        <Card className="h-full transition-all duration-200 group-hover:shadow-md">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-colors duration-200 group-hover:bg-primary-100">
              <Icon
                size={21}
                strokeWidth={1.8}
              />
            </div>

            {/* Text */}
            <div className="min-w-0">
              <p className="font-heading text-body-sm font-semibold text-heading">
                {label}
              </p>

              <p className="mt-1 text-caption text-muted">
                {description}
              </p>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

// ============================================================
// DASHBOARD SKELETON
// ============================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI skeletons */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map(
          (_, index) => (
            <Card
              key={index}
              className="h-full"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-28" />

                  <Skeleton className="h-9 w-16" />

                  <Skeleton className="h-3 w-24" />
                </div>

                <Skeleton className="h-11 w-11 rounded-lg" />
              </div>
            </Card>
          ),
        )}
      </div>

      {/* Attendance + institution */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <Skeleton className="h-5 w-52" />

          <div className="mt-5 flex justify-center">
            <Skeleton className="h-56 w-56 rounded-full" />
          </div>
        </Card>

        <Card>
          <Skeleton className="h-5 w-36" />

          <div className="mt-6 space-y-5">
            {Array.from({
              length: 3,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between"
                >
                  <Skeleton className="h-4 w-28" />

                  <Skeleton className="h-5 w-14" />
                </div>
              ),
            )}
          </div>
        </Card>
      </div>

      {/* Quick links */}
      <Card>
        <Skeleton className="h-5 w-32" />

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({
            length: 4,
          }).map(
            (_, index) => (
              <Skeleton
                key={index}
                className="h-20 rounded-lg"
              />
            ),
          )}
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// PAGE HEADER
// ============================================================

function DashboardHeader() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={
        cardTransition
      }
    >
      <h1 className="font-heading text-h1 text-heading">
        Dashboard
      </h1>

      <p className="mt-1 text-body-sm text-muted">
        Institution overview and
        activity at a glance.
      </p>
    </motion.div>
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function AdminDashboard() {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useAdminDashboard();

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  if (isLoading) {
    return (
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <DashboardHeader />

        <DashboardSkeleton />
      </div>
    );
  }

  // ----------------------------------------------------------
  // ERROR
  // ----------------------------------------------------------

  if (
    isError ||
    !data
  ) {
    return (
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <DashboardHeader />

        <EmptyState
          title="Unable to load dashboard"
          description="We couldn't retrieve the latest institution analytics."
          action={{
            label: "Try again",
            onClick: () => {
              void refetch();
            },
          }}
        />
      </div>
    );
  }

  // ----------------------------------------------------------
  // ATTENDANCE DATA
  // ----------------------------------------------------------

  const attendanceData = [
    {
      name:
        "Present" as const,

      value:
        data.presentAttendanceRecords,
    },

    {
      name:
        "Absent" as const,

      value:
        data.absentAttendanceRecords,
    },
  ];

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <DashboardHeader />

      {/* ======================================================
          KPI CARDS
          ====================================================== */}

      <motion.div
        variants={
          staggerContainer
        }
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          label="Total Students"
          value={
            data.totalStudents
          }
          subtitle={`${data.activeStudents} active`}
          icon={
            GraduationCap
          }
          warm
        />

        <KpiCard
          label="Total Professors"
          value={
            data.totalProfessors
          }
          subtitle={`${data.activeProfessors} active`}
          icon={Users}
        />

        <KpiCard
          label="Courses"
          value={
            data.totalCourses
          }
          icon={BookOpen}
        />

        <KpiCard
          label="Subjects"
          value={
            data.totalSubjects
          }
          icon={Library}
        />
      </motion.div>

      {/* ======================================================
          ATTENDANCE + INSTITUTION
          ====================================================== */}

      <motion.div
        variants={
          staggerContainer
        }
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.6fr]"
      >
        {/* Attendance */}
        <motion.div
          variants={
            staggerItem
          }
        >
          <Card className="h-full">
            <div className="mb-2">
              <h2 className="font-heading text-h3 text-heading">
                Institution-wide Attendance
              </h2>

              <p className="mt-1 text-body-sm text-muted">
                Attendance recorded across
                the institution.
              </p>
            </div>

            <AttendanceDonutChart
              data={
                attendanceData
              }
              percentage={
                data.attendancePercentage
              }
              caption="Overall Attendance"
              size="lg"
            />
          </Card>
        </motion.div>

        {/* Institution */}
        <motion.div
          variants={
            staggerItem
          }
        >
          <Card className="h-full">
            <div>
              <h2 className="font-heading text-h3 text-heading">
                Institution
              </h2>

              <p className="mt-1 text-body-sm text-muted">
                Quick administrative
                breakdown.
              </p>
            </div>

            <div className="mt-6 divide-y divide-neutral-100">
              {/* Departments */}
              <div className="flex items-center justify-between py-4 first:pt-0">
                <div className="flex items-center gap-3">
                  <Building2
                    size={18}
                    strokeWidth={1.8}
                    className="text-primary-600"
                  />

                  <span className="text-body-sm text-muted">
                    Departments
                  </span>
                </div>

                <span className="font-heading text-body-sm font-bold text-heading tabular-nums">
                  {
                    data.totalDepartments
                  }
                </span>
              </div>

              {/* Total admins */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck
                    size={18}
                    strokeWidth={1.8}
                    className="text-primary-600"
                  />

                  <span className="text-body-sm text-muted">
                    Total Admins
                  </span>
                </div>

                <span className="font-heading text-body-sm font-bold text-heading tabular-nums">
                  {
                    data.totalAdmins
                  }
                </span>
              </div>

              {/* Active admins */}
              <div className="flex items-center justify-between py-4 last:pb-0">
                <div className="flex items-center gap-3">
                  <Users
                    size={18}
                    strokeWidth={1.8}
                    className="text-primary-600"
                  />

                  <span className="text-body-sm text-muted">
                    Active Admins
                  </span>
                </div>

                <span className="font-heading text-body-sm font-bold text-heading tabular-nums">
                  {
                    data.activeAdmins
                  }
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* ======================================================
          QUICK LINKS
          ====================================================== */}

      <motion.div
        variants={
          staggerContainer
        }
        initial="hidden"
        animate="show"
      >
        <div className="mb-3">
          <h2 className="font-heading text-h3 text-heading">
            Quick Links
          </h2>

          <p className="mt-1 text-body-sm text-muted">
            Jump directly into common
            administrative tasks.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <QuickLink
            to="/admin/departments"
            label="Manage Departments"
            description="Create and maintain departments."
            icon={Building2}
          />

          <QuickLink
            to="/admin/courses"
            label="Manage Courses"
            description="Configure courses and departments."
            icon={BookOpen}
          />

          <QuickLink
            to="/admin/students"
            label="Manage Students"
            description="View and manage student records."
            icon={
              GraduationCap
            }
          />

          <QuickLink
            to="/admin/exams"
            label="Configure Exams"
            description="Manage examinations and marks."
            icon={Settings}
          />
        </div>
      </motion.div>
    </div>
  );
}