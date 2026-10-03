import { useNavigate } from "react-router-dom";

import ClassSessionAgenda from "../../../components/timetable/ClassSessionAgenda";
import EmptyState from "../../../components/ui/EmptyState";
import Skeleton from "../../../components/ui/Skeleton";
import Card from "../../../components/ui/Card";
import { useAuthStore } from "../../../lib/auth/store";
import type { ClassSession } from "../../../lib/api/types";
import { useProfessorTimetable } from "./useProfessorTimetable";

// ============================================================
// WEEKDAY → ISO DATE
// ============================================================

/*
 * The live CampusHub database currently stores the timetable
 * day as a weekday name, for example:
 *
 *   Monday
 *   Wednesday
 *   Friday
 *
 * ClassSessionAgenda expects an ISO calendar date:
 *
 *   YYYY-MM-DD
 *
 * We convert the value only for this Professor Timetable page.
 *
 * The database and backend remain unchanged.
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
   * If the session is for today, keep today's date.
   * Otherwise move forward to the next occurrence.
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
// NORMALIZE PROFESSOR TIMETABLE
// ============================================================

function normalizeProfessorTimetable(
  sessions: ClassSession[],
): ClassSession[] {
  return sessions.map(
    (session) => {
      /*
       * If the API already gives us an ISO date, preserve it.
       */
      if (
        /^\d{4}-\d{2}-\d{2}$/.test(
          session.day,
        )
      ) {
        return session;
      }

      /*
       * Convert the current weekday-based database value.
       */
      const isoDate =
        getNextOccurrenceOfWeekday(
          session.day,
        );

      /*
       * If the value is unknown, leave the session unchanged
       * rather than inventing a date.
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

export default function ProfessorTimetable() {
  const user =
    useAuthStore(
      (state) => state.user,
    );

  const professorId =
    user?.role === "PROFESSOR"
      ? user.id
      : "";

  const query =
    useProfessorTimetable(
      professorId,
    );

  const navigate =
    useNavigate();

  // ----------------------------------------------------------
  // NORMALIZE API DATA
  // ----------------------------------------------------------

  const normalizedSessions =
    normalizeProfessorTimetable(
      query.data ?? [],
    );

  return (
    <div className="space-y-6">
      {/* ====================================================
          HEADER
          ==================================================== */}

      <div className="pl-6 sm:pl-8">
        <h1 className="font-heading text-h1 text-heading">
          Timetable
        </h1>

        <p className="mt-1 text-body-sm text-muted">
          Your scheduled class occurrences,
          arranged chronologically.
        </p>
      </div>

      {/* ====================================================
          LOADING
          ==================================================== */}

      {query.isLoading ? (
        <Card>
          <Skeleton className="h-96 w-full" />
        </Card>
      ) : query.isError ? (
        /* ==================================================
           ERROR
           ================================================== */

        <EmptyState
          title="Unable to load timetable"
          description="Please check the backend and try again."
          action={{
            label: "Try again",
            onClick: () =>
              void query.refetch(),
          }}
        />
      ) : (
        /* ==================================================
           TIMETABLE
           ================================================== */

        <ClassSessionAgenda
          sessions={
            normalizedSessions
          }
          onSessionClick={(
            session,
          ) =>
            navigate(
              `/professor/attendance/${session.sessionId}`,
            )
          }
          emptyMessage="No class sessions are scheduled yet."
        />
      )}
    </div>
  );
}