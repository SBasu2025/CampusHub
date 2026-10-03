import {
  motion,
} from "framer-motion";

import {
  CalendarDays,
} from "lucide-react";

import type {
  ClassSession,
} from "../../../lib/api/types";

import ClassSessionAgenda from "../../../components/timetable/ClassSessionAgenda";

import Card from "../../../components/ui/Card";

import EmptyState from "../../../components/ui/EmptyState";

import Skeleton from "../../../components/ui/Skeleton";

import {
  useAuthStore,
} from "../../../lib/auth/store";

import {
  useStudentTimetable,
} from "./useStudentTimetable";

// ============================================================
// WEEKDAY → ISO DATE
// ============================================================

/*
 * The live CampusHub database currently stores timetable days
 * as weekday names:
 *
 *   Monday
 *   Tuesday
 *   Wednesday
 *   ...
 *
 * The shared ClassSessionAgenda component expects an ISO date:
 *
 *   YYYY-MM-DD
 *
 * We convert the existing database value here, only for the
 * student timetable screen.
 *
 * The database is NOT modified.
 */

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function getNextOccurrenceOfWeekday(
  weekdayName: string,
): string | null {
  const normalized =
    weekdayName
      .trim()
      .toLowerCase();

  const weekdayIndex =
    WEEKDAYS.findIndex(
      (day) =>
        day.toLowerCase() ===
        normalized,
    );

  if (weekdayIndex === -1) {
    return null;
  }

  const today =
    new Date();

  const todayWeekday =
    today.getDay();

  let daysUntil =
    weekdayIndex -
    todayWeekday;

  /*
   * If the timetable day is today, keep it as today.
   *
   * Otherwise, find the next occurrence of that weekday.
   */
  if (daysUntil < 0) {
    daysUntil += 7;
  }

  const occurrence =
    new Date(
      today,
    );

  occurrence.setDate(
    today.getDate() +
      daysUntil,
  );

  const year =
    occurrence.getFullYear();

  const month =
    String(
      occurrence.getMonth() + 1,
    ).padStart(2, "0");

  const day =
    String(
      occurrence.getDate(),
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ============================================================
// NORMALIZE STUDENT TIMETABLE
// ============================================================

function normalizeStudentTimetable(
  sessions: ClassSession[],
): ClassSession[] {
  return sessions
    .map(
      (session) => {
        const isoDate =
          getNextOccurrenceOfWeekday(
            session.day,
          );

        /*
         * If the backend already provides an ISO date,
         * preserve it.
         *
         * This keeps the frontend compatible with future
         * database/API changes without breaking the current
         * weekday-based records.
         */
        if (
          isoDate === null &&
          /^\d{4}-\d{2}-\d{2}$/.test(
            session.day,
          )
        ) {
          return session;
        }

        /*
         * If the value is neither a known weekday nor an ISO
         * date, leave the session unchanged rather than
         * inventing a date.
         */
        if (
          isoDate === null
        ) {
          return session;
        }

        return {
          ...session,
          day: isoDate,
        };
      },
    );
}

// ============================================================
// COMPONENT
// ============================================================

export default function StudentTimetable() {
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
  // QUERY
  // ----------------------------------------------------------

  const query =
    useStudentTimetable(
      studentId,
    );

  // ----------------------------------------------------------
  // AUTH GUARD
  // ----------------------------------------------------------

  if (!user) {
    return null;
  }

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  if (
    query.isLoading
  ) {
    return (
      <div className="space-y-6">
        <div className="pl-6 sm:pl-8">
          <Skeleton className="h-4 w-24" />

          <Skeleton className="mt-2 h-9 w-48" />

          <Skeleton className="mt-2 h-4 w-80" />
        </div>

        <Card>
          <div className="space-y-3">
            {Array.from({
              length: 5,
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
    query.isError
  ) {
    return (
      <EmptyState
        title="Unable to load timetable"
        description="Your class sessions could not be retrieved from CampusHub."
        action={{
          label:
            "Try again",

          onClick: () => {
            void query.refetch();
          },
        }}
      />
    );
  }

  const sessions =
    query.data ?? [];

  /*
   * IMPORTANT:
   *
   * Do not modify the API response itself.
   *
   * We create a normalized copy specifically for the student
   * timetable UI.
   */
  const normalizedSessions =
    normalizeStudentTimetable(
      sessions,
    );

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ====================================================
          HEADER
          ==================================================== */}

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
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary-600" />

          <p className="text-body-sm font-medium text-primary-600">
            Schedule
          </p>
        </div>

        <h1 className="mt-1 font-heading text-h1 text-heading">
          Timetable
        </h1>

        <p className="mt-1 max-w-2xl text-body-sm text-muted">
          Your scheduled class occurrences, arranged chronologically from today through upcoming sessions.
        </p>
      </motion.div>

      {/* ====================================================
          AGENDA
          ==================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.35,
          delay: 0.05,
          ease: [
            0.16,
            1,
            0.3,
            1,
          ],
        }}
      >
        <Card>
          <ClassSessionAgenda
            sessions={
              normalizedSessions
            }
            emptyMessage="No class sessions are scheduled yet."
          />
        </Card>
      </motion.div>
    </div>
  );
}