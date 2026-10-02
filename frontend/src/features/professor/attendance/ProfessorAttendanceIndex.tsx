import {
  useMemo,
} from "react";

import {
  ArrowRight,
  CalendarCheck2,
  History,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  format,
} from "date-fns";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import Button from "../../../components/ui/Button";

import Card from "../../../components/ui/Card";

import EmptyState from "../../../components/ui/EmptyState";

import Skeleton from "../../../components/ui/Skeleton";

import ClassSessionAgenda from "../../../components/timetable/ClassSessionAgenda";

import {
  useAuth,
} from "../../../lib/auth/useAuth";

import {
  isToday,
} from "../../../lib/utils/classSession";

import {
  useProfessorTimetable,
} from "../timetable/useProfessorTimetable";

// ============================================================
// COMPONENT
// ============================================================

export default function ProfessorAttendanceIndex() {
  const navigate =
    useNavigate();

  const {
    user,
  } = useAuth();

  // ----------------------------------------------------------
  // PROFESSOR ID
  // ----------------------------------------------------------

  const professorId =
    user?.role ===
    "PROFESSOR"
      ? user.id
      : "";

  // ----------------------------------------------------------
  // TIMETABLE
  // ----------------------------------------------------------

  const timetableQuery =
    useProfessorTimetable(
      professorId,
    );

  // ----------------------------------------------------------
  // TODAY'S SESSIONS
  // ----------------------------------------------------------

  const todaySessions =
    useMemo(
      () =>
        (
          timetableQuery.data ??
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
              `${first.day}${first.startTime}`.localeCompare(
                `${second.day}${second.startTime}`,
              ),
          ),
      [
        timetableQuery.data,
      ],
    );

  // ----------------------------------------------------------
  // TODAY LABEL
  // ----------------------------------------------------------

  const todayLabel =
    format(
      new Date(),
      "d MMM yyyy",
    );

  // ----------------------------------------------------------
  // AUTHENTICATION
  // ----------------------------------------------------------

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    user.role !==
    "PROFESSOR"
  ) {
    return (
      <Navigate
        to={`/${user.role.toLowerCase()}`}
        replace
      />
    );
  }

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  if (
    timetableQuery.isLoading
  ) {
    return (
      <div className="space-y-6">
        <div className="pl-6 sm:pl-8">
          <p className="text-body-sm font-medium text-primary-600">
            Attendance
          </p>

          <h1 className="mt-1 font-heading text-h1 text-heading">
            Mark Attendance
          </h1>

          <p className="mt-1 text-body-sm text-muted">
            Choose one of today's dated class sessions to record attendance.
          </p>
        </div>

        <Card>
          <div className="space-y-3">
            {Array.from({
              length: 4,
            }).map(
              (_, index) => (
                <Skeleton
                  key={index}
                  className="h-20 w-full"
                />
              ),
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ----------------------------------------------------------
  // ERROR
  // ----------------------------------------------------------

  if (
    timetableQuery.isError
  ) {
    return (
      <div className="space-y-6">
        <div className="pl-6 sm:pl-8">
          <p className="text-body-sm font-medium text-primary-600">
            Attendance
          </p>

          <h1 className="mt-1 font-heading text-h1 text-heading">
            Mark Attendance
          </h1>

          <p className="mt-1 text-body-sm text-muted">
            Choose one of today's dated class sessions to record attendance.
          </p>
        </div>

        <EmptyState
          title="Unable to load your timetable"
          description="We couldn't retrieve your class sessions. Please try again."
          action={{
            label: "Try again",
            onClick: () => {
              void timetableQuery.refetch();
            },
          }}
        />
      </div>
    );
  }

  // ----------------------------------------------------------
  // PAGE
  // ----------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ======================================================
          HEADER
          ====================================================== */}

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
          duration: 0.3,
          ease: [
            0.16,
            1,
            0.3,
            1,
          ],
        }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="pl-6 sm:pl-8">
          <p className="text-body-sm font-medium text-primary-600">
            Attendance
          </p>

          <h1 className="mt-1 font-heading text-h1 text-heading">
            Mark Attendance
          </h1>

          <p className="mt-1 text-body-sm text-muted">
            Choose one of today's dated class sessions to record attendance.
          </p>
        </div>

        <Button
          variant="secondary"
          type="button"
          onClick={() => {
            navigate(
              "/professor/attendance-history",
            );
          }}
        >
          <History className="h-4 w-4" />

          Attendance History
        </Button>
      </motion.div>

      {/* ======================================================
          TODAY
          ====================================================== */}

      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <CalendarCheck2 className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-heading text-h2 text-heading">
              Today — {todayLabel}
            </h2>

            <p className="mt-1 text-body-sm text-muted">
              Only today's sessions are presented as actionable attendance tasks.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <ClassSessionAgenda
            sessions={
              todaySessions
            }
            hideDateHeadings
            emptyMessage="No classes or attendance tasks scheduled for today."
            renderAction={(
              session,
            ) => (
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={() => {
                  navigate(
                    `/professor/attendance/${encodeURIComponent(
                      session.sessionId,
                    )}`,
                  );
                }}
              >
                Mark Attendance

                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          />
        </div>
      </Card>

      {/* ======================================================
          HISTORY
          ====================================================== */}

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
          duration: 0.3,
          delay: 0.08,
          ease: [
            0.16,
            1,
            0.3,
            1,
          ],
        }}
      >
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-h3 text-heading">
                Reviewing a previous class?
              </h2>

              <p className="mt-1 text-body-sm text-muted">
                Past sessions are intentionally removed from today's action list. Use Attendance History to review or correct them.
              </p>
            </div>

            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                navigate(
                  "/professor/attendance-history",
                );
              }}
            >
              Open History

              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}