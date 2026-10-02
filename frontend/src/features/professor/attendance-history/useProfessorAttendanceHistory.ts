import {
  useQueries,
  useQuery,
} from "@tanstack/react-query";

import {
  getAttendances,
} from "../../../lib/api/endpoints/attendances";

import {
  getClassSessions,
} from "../../../lib/api/endpoints/classSessions";

import {
  getProfessorSubjects,
} from "../../../lib/api/endpoints/professors";

import {
  isPast,
} from "../../../lib/utils/classSession";

// ============================================================
// PROFESSOR ATTENDANCE HISTORY
// ============================================================

export function useProfessorAttendanceHistory(
  professorId: string,

  subjectId: string,
) {
  // ==========================================================
  // PROFESSOR SUBJECTS
  // ==========================================================

  const subjects =
    useQuery({
      queryKey: [
        "professor-subjects",
        professorId,
      ],

      queryFn: () =>
        getProfessorSubjects(
          professorId,
        ),

      enabled:
        Boolean(
          professorId,
        ),

      staleTime: 60_000,
    });

  // ==========================================================
  // PROFESSOR SESSIONS
  // ==========================================================

  const sessions =
    useQuery({
      queryKey: [
        "professor-sessions-history",
        professorId,
      ],

      queryFn: () =>
        getClassSessions({
          profId:
            professorId,
        }),

      enabled:
        Boolean(
          professorId,
        ),

      staleTime: 30_000,

      refetchOnWindowFocus:
        true,
    });

  // ==========================================================
  // FILTER PAST SESSIONS
  // ==========================================================

  const filtered = (
    sessions.data ??
    []
  )
    .filter(
      (session) =>
        (
          !subjectId ||
          session.teaching.subject
            .subjectId ===
            subjectId
        ) &&
        isPast(
          session.day,
        ),
    )
    .sort(
      (
        first,
        second,
      ) =>
        `${second.day}${second.startTime}`.localeCompare(
          `${first.day}${first.startTime}`,
        ),
    );

  // ==========================================================
  // ATTENDANCE STATUS
  // ==========================================================
  //
  // One attendance query per past session.
  //
  // This deliberately uses the same cache key as the
  // Professor Attendance editor:
  //
  // ["attendance-session", sessionId]
  //
  // So edits made in the attendance screen can update the
  // history view through normal React Query invalidation.
  // ==========================================================

  const attendance =
    useQueries({
      queries:
        filtered.map(
          (
            session,
          ) => ({
            queryKey: [
              "attendance-session",
              session.sessionId,
            ],

            queryFn: () =>
              getAttendances({
                sessionId:
                  session.sessionId,
              }),

            staleTime: 60_000,

            refetchOnWindowFocus:
              true,
          }),
        ),
    });

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    subjects,

    sessions,

    filtered,

    attendance,
  };
}