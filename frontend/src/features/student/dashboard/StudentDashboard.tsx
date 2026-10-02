import {
  format,
} from "date-fns";

import {
  motion,
} from "framer-motion";

import {
  useState,
} from "react";

import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Users,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import AttendanceDonutChart from "../../../components/charts/AttendanceDonutChart";

import ClassSessionAgenda from "../../../components/timetable/ClassSessionAgenda";

import Card from "../../../components/ui/Card";

import EmptyState from "../../../components/ui/EmptyState";

import KPIStatCard from "../../../components/ui/KPIStatCard";

import {
  Select,
} from "../../../components/ui/Select";

import Skeleton from "../../../components/ui/Skeleton";

import {
  useAuthStore,
} from "../../../lib/auth/store";

import {
  useCountUp,
} from "../../../lib/hooks/useCountUp";

import {
  isToday,
} from "../../../lib/utils/classSession";

import {
  toAttendanceDonutData,
} from "../../../lib/utils/charts";

import {
  useStudentDashboard,
} from "./useStudentDashboard";

// ============================================================
// MOTION
// ============================================================

const containerVariants = {
  hidden: {},

  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 14,
  },

  show: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.3,
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
// LOADING STATE
// ============================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-4 w-28" />

        <Skeleton className="mt-2 h-9 w-72" />

        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map(
          (_, index) => (
            <Card
              key={index}
              className="h-full"
            >
              <Skeleton className="h-28 w-full" />
            </Card>
          ),
        )}
      </div>

      <Card>
        <Skeleton className="h-6 w-48" />

        <Skeleton className="mt-5 h-20 w-full" />
      </Card>
    </div>
  );
}

// ============================================================
// HEADER
// ============================================================

function PageHeader({
  name,
}: {
  name: string;
}) {
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
      transition={{
        duration: 0.35,
        ease: [
          0.16,
          1,
          0.3,
          1,
        ],
      }}
      className="pl-6 sm:pl-8"
    >
      <p className="text-body-sm font-medium text-primary-600">
        Student Portal
      </p>

      <h1 className="mt-1 font-heading text-h1 text-heading">
        Welcome, {name}
      </h1>

      <p className="mt-1 text-body-sm text-muted">
        Your attendance, semester progress and today's classes.
      </p>
    </motion.div>
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function StudentDashboard() {
  // ----------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------

  const user =
    useAuthStore(
      (state) =>
        state.user,
    );

  const studentId =
    user?.role ===
    "STUDENT"
      ? user.id
      : "";

  // ----------------------------------------------------------
  // ATTENDANCE SUBJECT
  // ----------------------------------------------------------

  const [
    selectedAttendanceSubjectId,
    setSelectedAttendanceSubjectId,
  ] = useState("");

  // ----------------------------------------------------------
  // DATA
  // ----------------------------------------------------------

  const {
    student,
    selectedSubjects,
    subjectAttendance,
    timetable,
    sgpa,
  } =
    useStudentDashboard(
      studentId,
    );

  // ----------------------------------------------------------
  // QUERY STATES
  // ----------------------------------------------------------

  const subjectAttendanceLoading =
    subjectAttendance.some(
      (
        query,
      ) =>
        query.isLoading,
    );

  const subjectAttendanceError =
    subjectAttendance.some(
      (
        query,
      ) =>
        query.isError,
    );

  const dashboardLoading =
    student.isLoading ||
    selectedSubjects.isLoading ||
    timetable.isLoading ||
    sgpa.isLoading ||
    subjectAttendanceLoading;

  // ----------------------------------------------------------
  // SGPA
  //
  // This hook must run before conditional returns.
  // ----------------------------------------------------------

  const sgpaValue =
    sgpa.data &&
    Number.isFinite(
      sgpa.data.sgpa,
    )
      ? sgpa.data.sgpa
      : null;

  const animatedSgpa =
    useCountUp(
      sgpaValue ??
        0,
      900,
    );

  // ----------------------------------------------------------
  // GUARD
  // ----------------------------------------------------------

  if (!user) {
    return null;
  }

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  if (dashboardLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          name={
            user.displayName
          }
        />

        <DashboardSkeleton />
      </div>
    );
  }

  // ----------------------------------------------------------
  // ERROR
  // ----------------------------------------------------------

  if (
    student.isError ||
    selectedSubjects.isError ||
    timetable.isError ||
    subjectAttendanceError ||
    !student.data
  ) {
    return (
      <div className="space-y-6">
        <PageHeader
          name={
            user.displayName
          }
        />

        <EmptyState
          title="Unable to load dashboard"
          description="Some student dashboard information could not be retrieved from CampusHub."
          action={{
            label:
              "Try again",

            onClick: () => {
              void student.refetch();

              void selectedSubjects.refetch();

              void timetable.refetch();

              void Promise.all(
                subjectAttendance.map(
                  (
                    query,
                  ) =>
                    query.refetch(),
                ),
              );
            },
          }}
        />
      </div>
    );
  }

  // ----------------------------------------------------------
  // OVERALL ATTENDANCE
  // ----------------------------------------------------------

  const overallPresent =
    subjectAttendance.reduce(
      (
        total,
        query,
      ) =>
        total +
        (
          query.data
            ?.presentSessions ??
          0
        ),
      0,
    );

  const overallAbsent =
    subjectAttendance.reduce(
      (
        total,
        query,
      ) =>
        total +
        (
          query.data
            ?.absentSessions ??
          0
        ),
      0,
    );

  const overallTotalAttendance =
    overallPresent +
    overallAbsent;

  const overallAttendancePercentage =
    overallTotalAttendance >
    0
      ? Math.round(
          (overallPresent /
            overallTotalAttendance) *
            100,
        )
      : 0;

  // ----------------------------------------------------------
  // ATTENDANCE SUBJECT OPTIONS
  // ----------------------------------------------------------

  const attendanceSubjectOptions = (
    selectedSubjects.data ??
    []
  ).map(
    (selection) => ({
      value:
        selection.subject
          .subjectId,

      label:
        `${selection.subject.subjectName} (${selection.subject.subjectId})`,
    }),
  );

  const activeAttendanceSubjectId =
    selectedAttendanceSubjectId ||
    attendanceSubjectOptions[0]
      ?.value ||
    "";

  // ----------------------------------------------------------
  // ACTIVE SUBJECT ATTENDANCE
  // ----------------------------------------------------------

  const activeAttendanceIndex =
    (
      selectedSubjects.data ??
      []
    ).findIndex(
      (selection) =>
        selection.subject
          .subjectId ===
        activeAttendanceSubjectId,
    );

  const activeAttendanceQuery =
    activeAttendanceIndex >=
      0
      ? subjectAttendance[
          activeAttendanceIndex
        ]
      : undefined;

  const activeAttendance =
    activeAttendanceQuery?.data;

  const subjectPresent =
    activeAttendance
      ?.presentSessions ??
    0;

  const subjectAbsent =
    activeAttendance
      ?.absentSessions ??
    0;

  const subjectTotal =
    subjectPresent +
    subjectAbsent;

  const subjectAttendancePercentage =
    activeAttendance &&
    Number.isFinite(
      activeAttendance.attendancePercentage,
    )
      ? activeAttendance.attendancePercentage
      : subjectTotal > 0
        ? Math.round(
            (subjectPresent /
              subjectTotal) *
              100,
          )
        : 0;

  // ----------------------------------------------------------
  // ACTIVE SUBJECT NAME
  // ----------------------------------------------------------

  const activeSubjectName =
    activeAttendance
      ?.subjectName ??
    attendanceSubjectOptions.find(
      (option) =>
        option.value ===
        activeAttendanceSubjectId,
    )?.label ??
    "No subject selected";

  // ----------------------------------------------------------
  // TODAY'S SESSIONS
  // ----------------------------------------------------------

  const todaySessions =
    (
      timetable.data ??
      []
    )
      .filter(
        (session) =>
          isToday(
            session.day,
          ),
      )
      .sort(
        (
          first,
          second,
        ) =>
          first.startTime.localeCompare(
            second.startTime,
          ),
      );

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        name={
          student.data
            .studentName
        }
      />

      {/* ====================================================
          KPI ROW
          ==================================================== */}

      <motion.div
        variants={
          containerVariants
        }
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {/* ==================================================
            ATTENDANCE
            ================================================== */}

        <motion.div
          variants={
            itemVariants
          }
        >
          <Card className="h-full">
            <div className="flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-caption font-medium text-muted">
                    Attendance
                  </p>

                  <h2 className="mt-1 truncate font-heading text-h3 text-heading">
                    {activeSubjectName}
                  </h2>

                  <p className="mt-1 text-caption text-muted">
                    Subject-wise attendance
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-caption text-muted">
                    Subject
                  </p>

                  <p className="mt-1 font-heading text-body-sm font-bold text-heading tabular-nums">
                    {
                      subjectAttendancePercentage
                    }
                    %
                  </p>
                </div>
              </div>

              {/* Subject selector */}
              <div className="mt-4">
                <Select
                  label="Select subject"
                  options={
                    attendanceSubjectOptions
                  }
                  value={
                    activeAttendanceSubjectId
                  }
                  onChange={(event) =>
                    setSelectedAttendanceSubjectId(
                      event.target.value,
                    )
                  }
                  disabled={
                    attendanceSubjectOptions.length ===
                    0
                  }
                />
              </div>

              {/* Donut */}
              <div className="mt-2">
                <AttendanceDonutChart
                  data={
                    toAttendanceDonutData(
                      subjectPresent,
                      subjectAbsent,
                    )
                  }

                  /*
                   * Ring:
                   * subject-wise attendance
                   *
                   * Center:
                   * overall attendance
                   */
                  percentage={
                    overallAttendancePercentage
                  }

                  caption="Overall Attendance"

                  size="sm"

                  showLegend={false}

                  showCenterCaption={true}

                  loading={
                    activeAttendanceQuery?.isLoading ??
                    false
                  }
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ==================================================
            CURRENT SEMESTER
            ================================================== */}

        <motion.div
          variants={
            itemVariants
          }
        >
          <KPIStatCard
            label="Current Semester"
            value={
              student.data
                .semester
            }
            icon={
              <GraduationCap className="h-5 w-5" />
            }
          />
        </motion.div>

        {/* ==================================================
            SELECTED SUBJECTS
            ================================================== */}

        <motion.div
          variants={
            itemVariants
          }
        >
          <KPIStatCard
            label="Subjects Selected"
            value={
              (
                selectedSubjects.data ??
                []
              ).length
            }
            icon={
              <BookOpen className="h-5 w-5" />
            }
          />
        </motion.div>

        {/* ==================================================
            SGPA
            ================================================== */}

        <motion.div
          variants={
            itemVariants
          }
        >
          <Card className="h-full bg-gradient-warm">
            <p className="text-caption text-muted">
              Current SGPA
            </p>

            <p className="mt-3 font-heading text-4xl font-extrabold text-heading tabular-nums">
              {sgpa.isError
                ? "Not yet available"
                : sgpaValue ===
                    null
                  ? "—"
                  : animatedSgpa.toFixed(
                      2,
                    )}
            </p>

            <p className="mt-2 text-caption text-muted">
              {sgpa.isError
                ? "Marks are incomplete or not yet entered."
                : "Current semester performance"}
            </p>

            <Link
              to="/student/marks"
              className="mt-4 inline-flex text-body-sm font-semibold text-primary-700 hover:text-primary-800"
            >
              View marks & SGPA
            </Link>
          </Card>
        </motion.div>
      </motion.div>

      {/* ====================================================
          TODAY
          ==================================================== */}

      <motion.div
        variants={
          itemVariants
        }
        initial="hidden"
        animate="show"
      >
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary-600" />

                <h2 className="font-heading text-h2 text-heading">
                  Today —{" "}
                  {format(
                    new Date(),
                    "d MMM yyyy",
                  )}
                </h2>
              </div>

              <p className="mt-1 text-body-sm text-muted">
                Your class sessions for the current calendar date.
              </p>
            </div>

            <Link
              to="/student/timetable"
              className="text-body-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              Full timetable
            </Link>
          </div>

          <div className="mt-5">
            <ClassSessionAgenda
              sessions={
                todaySessions
              }
              hideDateHeadings
              emptyMessage="No classes scheduled for today."
            />
          </div>
        </Card>
      </motion.div>

      {/* ====================================================
          QUICK ACCESS
          ==================================================== */}

      <motion.div
        variants={
          containerVariants
        }
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <QuickLink
          to="/student/attendance"
          icon={
            <ClipboardAttendanceIcon />
          }
          title="Attendance"
          description="View overall and subject-wise attendance."
        />

        <QuickLink
          to="/student/subjects"
          icon={
            <BookOpen className="h-5 w-5" />
          }
          title="My Subjects"
          description="Manage your current subject selections."
        />

        <QuickLink
          to="/student/professors"
          icon={
            <Users className="h-5 w-5" />
          }
          title="My Professors"
          description="View professors associated with your subjects."
        />
      </motion.div>
    </div>
  );
}

// ============================================================
// QUICK LINK
// ============================================================

function QuickLink({
  to,
  icon,
  title,
  description,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      variants={
        itemVariants
      }
    >
      <Link
        to={to}
        className="group block h-full"
      >
        <Card className="h-full transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-colors duration-200 group-hover:bg-primary-100">
              {icon}
            </div>

            <div>
              <h3 className="font-heading text-h3 text-heading">
                {title}
              </h3>

              <p className="mt-1 text-body-sm text-muted">
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
// ICON
// ============================================================

function ClipboardAttendanceIcon() {
  return (
    <CalendarDays className="h-5 w-5" />
  );
}