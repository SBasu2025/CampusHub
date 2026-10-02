import {
  useQuery,
} from "@tanstack/react-query";

import {
  getAttendances,
} from "../../../lib/api/endpoints/attendances";

import {
  getClassSessionById,
} from "../../../lib/api/endpoints/classSessions";

import {
  getStudentsForClassSession,
} from "../../../lib/api/endpoints/professors";

// ============================================================
// PROFESSOR ATTENDANCE QUERY
// ============================================================
//
// This hook loads the three pieces needed by the attendance
// screen:
//
// 1. ClassSession
// 2. Student roster for the session
// 3. Existing attendance records
//
// The backend remains responsible for authorization and
// validating that the professor owns the session.
// ============================================================

export function useProfessorAttendance(
  professorId: string,
  sessionId: string,
) {
  // ==========================================================
  // CLASS SESSION
  // ==========================================================

  const session =
    useQuery({
      queryKey: [
        "class-session",
        sessionId,
      ],

      queryFn: () =>
        getClassSessionById(
          sessionId,
        ),

      enabled:
        Boolean(
          sessionId,
        ),

      staleTime: 30_000,
    });

  // ==========================================================
  // STUDENT ROSTER
  // ==========================================================

  const students =
    useQuery({
      queryKey: [
        "professor-session-students",
        professorId,
        sessionId,
      ],

      queryFn: () =>
        getStudentsForClassSession(
          professorId,
          sessionId,
        ),

      enabled:
        Boolean(
          professorId &&
            sessionId,
        ),

      staleTime: 30_000,
    });

  // ==========================================================
  // EXISTING ATTENDANCE
  // ==========================================================

  const attendance =
    useQuery({
      queryKey: [
        "attendance-session",
        sessionId,
      ],

      queryFn: () =>
        getAttendances({
          sessionId,
        }),

      enabled:
        Boolean(
          sessionId,
        ),

      staleTime: 30_000,

      refetchOnWindowFocus: true,
    });

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    session,

    students,

    attendance,
  };
}