import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import AttendanceDonutChart from "../../../components/charts/AttendanceDonutChart";
import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import KPIStatCard from "../../../components/ui/KPIStatCard";
import Skeleton from "../../../components/ui/Skeleton";
import { toAttendanceDonutData } from "../../../lib/utils/charts";
import {
  isToday,
  toIsoDate,
} from "../../../lib/utils/classSession";
import { useAuthStore } from "../../../lib/auth/store";
import { useProfessorDashboard } from "./useProfessorDashboard";

function PageHeader({ name }: { name: string }) {
  return (
    <div className="pl-6 sm:pl-8">
      <h1 className="font-heading text-h1 text-heading">
        Welcome, {name}
      </h1>

      <p className="mt-1 text-body-sm text-muted">
        Your teaching activity, schedule and attendance overview.
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <Skeleton className="h-28 w-full" />
          </Card>
        ))}
      </div>

      <Card>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-5 h-20 w-full" />
      </Card>
    </div>
  );
}

export default function ProfessorDashboard() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const professorId =
    user?.role === "PROFESSOR" ? user.id : "";

  const {
    profile,
    subjects,
    timetable,
    staffAttendance,
    isLoading,
    isError,
    refetchAll,
  } = useProfessorDashboard(professorId);

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader name={user.displayName} />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !profile.data) {
    return (
      <div className="space-y-6">
        <PageHeader name={user.displayName} />

        <EmptyState
          title="Unable to load professor dashboard"
          description="Please check the backend and try again."
          action={{
            label: "Try again",
            onClick: () => void refetchAll(),
          }}
        />
      </div>
    );
  }

  const sessions = timetable.data ?? [];

  const todaySessions = sessions.filter((session) =>
    isToday(session.day),
  );

  const todayIso = toIsoDate(new Date());

  const nextWeekIso = toIsoDate(
    new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ),
  );

  const upcomingThisWeek = sessions.filter(
    (session) =>
      session.day >= todayIso &&
      session.day <= nextWeekIso,
  ).length;

  const monthKey = todayIso.slice(0, 7);

  const staffThisMonth =
    (staffAttendance.data ?? []).filter((item) =>
      item.day.startsWith(monthKey),
    );

  const staffPresent = staffThisMonth.filter(
    (item) =>
      item.status.toLowerCase() === "present",
  ).length;

  const staffPercentage = staffThisMonth.length
    ? Math.round(
        (staffPresent / staffThisMonth.length) * 100,
      )
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader name={profile.data.professorName} />

      <motion.div
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.06,
            },
          },
        }}
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0 },
          }}
        >
          <KPIStatCard
            label="Subjects Teaching"
            value={(subjects.data ?? []).length}
            icon={
              <BookOpen className="h-5 w-5" />
            }
          />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0 },
          }}
        >
          <KPIStatCard
            label="Classes Today"
            value={todaySessions.length}
            icon={
              <CalendarDays className="h-5 w-5" />
            }
          />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0 },
          }}
        >
          <KPIStatCard
            label="Upcoming This Week"
            value={upcomingThisWeek}
            icon={
              <Users className="h-5 w-5" />
            }
          />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0 },
          }}
        >
          <Card className="h-full bg-gradient-warm">
            <p className="text-caption text-muted">
              Own Staff Attendance This Month
            </p>

            <div className="mt-2 flex items-end justify-between gap-4">
              <p className="font-heading text-3xl font-extrabold text-heading tabular-nums">
                {staffPercentage}%
              </p>

              <ClipboardCheck className="h-7 w-7 text-primary-700" />
            </div>

            <p className="mt-2 text-caption text-muted">
              {staffPresent} present of{" "}
              {staffThisMonth.length} records
            </p>
          </Card>
        </motion.div>
      </motion.div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-h2 text-heading">
              Today —{" "}
              {format(
                new Date(),
                "d MMM yyyy",
              )}
            </h2>

            <p className="mt-1 text-body-sm text-muted">
              Only today's dated sessions are
              actionable from the dashboard.
            </p>
          </div>

          <Link
            to="/professor/attendance-history"
            className="text-body-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            Open attendance history
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {todaySessions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center">
              <p className="font-heading text-body-sm font-semibold text-heading">
                No classes today
              </p>

              <p className="mt-1 text-body-sm text-muted">
                There are no dated class sessions
                scheduled for today.
              </p>
            </div>
          ) : (
            todaySessions
              .slice()
              .sort((a, b) =>
                a.startTime.localeCompare(
                  b.startTime,
                ),
              )
              .map((session) => (
                <div
                  key={session.sessionId}
                  className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-4 transition-all duration-150 hover:-translate-y-px hover:border-primary-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-heading text-body-sm font-semibold text-heading">
                      {
                        session.teaching.subject
                          .subjectName
                      }
                    </p>

                    <p className="mt-1 text-caption text-muted">
                      {
                        session.course
                          .courseName
                      }{" "}
                      · Section {session.section} ·
                      Semester {session.semester}
                    </p>

                    <p className="mt-1 font-mono text-[11px] text-neutral-400">
                      {session.startTime.slice(
                        0,
                        5,
                      )}
                      –
                      {session.endTime.slice(
                        0,
                        5,
                      )}{" "}
                      · {session.sessionId}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/professor/attendance/${encodeURIComponent(
                          session.sessionId,
                        )}`,
                      )
                    }
                    className="shrink-0 rounded-md bg-gradient-brand px-4 py-2.5 text-body-sm font-semibold text-white shadow-sm transition-all duration-150 hover:brightness-105 hover:shadow-brand-md active:scale-[0.97]"
                  >
                    Mark Attendance
                  </button>
                </div>
              ))
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-h3 text-heading">
              Staff Attendance
            </h2>

            <p className="mt-1 text-body-sm text-muted">
              Your administrator-marked attendance
              for the current month.
            </p>
          </div>

          <AttendanceDonutChart
            data={toAttendanceDonutData(
              staffPresent,
              Math.max(
                staffThisMonth.length -
                  staffPresent,
                0,
              ),
            )}
            percentage={staffPercentage}
            caption="This month"
            size="sm"
          />
        </div>
      </Card>
    </div>
  );
}