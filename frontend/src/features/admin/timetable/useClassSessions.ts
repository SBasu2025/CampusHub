import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createClassSession,
  deleteClassSession,
  getClassSessionById,
  getClassSessions,
  updateClassSession,
  type ClassSessionCreateRequest,
  type ClassSessionUpdateRequest,
} from "../../../lib/api/endpoints/classSessions";

import type {
  ClassSession,
} from "../../../lib/api/types";

// ============================================================
// QUERY KEYS
// ============================================================

export const classSessionQueryKeys = {
  all: ["class-sessions"] as const,

  list: (
    filters?: ClassSessionFilters,
  ) =>
    [
      "class-sessions",
      filters ?? {},
    ] as const,

  detail: (
    sessionId: string,
  ) =>
    [
      "class-session",
      sessionId,
    ] as const,
};

// ============================================================
// FILTER TYPES
// ============================================================

export interface ClassSessionFilters {
  courseId?: string;
  section?: string;
  semester?: number;
  profId?: string;
}

// ============================================================
// GET ALL CLASS SESSIONS
// ============================================================

export function useClassSessions(
  filters?: ClassSessionFilters,
) {
  return useQuery({
    queryKey:
      classSessionQueryKeys.list(
        filters,
      ),

    queryFn: () =>
      getClassSessions(
        filters,
      ),

    staleTime: 30_000,

    refetchOnWindowFocus: true,
  });
}

// ============================================================
// GET SINGLE CLASS SESSION
// ============================================================

export function useClassSession(
  sessionId: string,
) {
  return useQuery({
    queryKey:
      classSessionQueryKeys.detail(
        sessionId,
      ),

    queryFn: () =>
      getClassSessionById(
        sessionId,
      ),

    enabled:
      Boolean(sessionId),

    staleTime: 30_000,
  });
}

// ============================================================
// CREATE CLASS SESSION
// ============================================================

export function useCreateClassSession() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      request: ClassSessionCreateRequest,
    ) =>
      createClassSession(
        request,
      ),

    onSuccess: (
      createdSession: ClassSession,
    ) => {
      // ------------------------------------------------------
      // DETAIL CACHE
      // ------------------------------------------------------

      queryClient.setQueryData(
        classSessionQueryKeys.detail(
          createdSession.sessionId,
        ),
        createdSession,
      );

      // ------------------------------------------------------
      // ADMIN TIMETABLE
      // ------------------------------------------------------

      void queryClient.invalidateQueries({
        queryKey:
          classSessionQueryKeys.all,
      });

      // ------------------------------------------------------
      // PROFESSOR TIMETABLE
      // ------------------------------------------------------

      void queryClient.invalidateQueries({
        queryKey: [
          "professor-timetable",
          createdSession
            .teaching
            .professor
            .profId,
        ],
      });

      // ------------------------------------------------------
      // PROFESSOR DASHBOARD
      // ------------------------------------------------------

      void queryClient.invalidateQueries({
        queryKey: [
          "professor-dashboard",
        ],
      });

      // ------------------------------------------------------
      // STUDENT TIMETABLE
      // ------------------------------------------------------
      //
      // This is intentionally a partial key.
      //
      // Actual student timetable keys are:
      //
      // ["student-timetable", studentId]
      //
      // So every relevant student timetable cache is
      // invalidated after an admin changes the timetable.
      // ------------------------------------------------------

      void queryClient.invalidateQueries({
        queryKey: [
          "student-timetable",
        ],
      });

      // ------------------------------------------------------
      // STUDENT DASHBOARD
      // ------------------------------------------------------

      void queryClient.invalidateQueries({
        queryKey: [
          "student-dashboard",
        ],
      });
    },
  });
}

// ============================================================
// UPDATE CLASS SESSION
// ============================================================

export function useUpdateClassSession() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      changes,
    }: {
      sessionId: string;

      changes: ClassSessionUpdateRequest;
    }) =>
      updateClassSession(
        sessionId,
        changes,
      ),

    onSuccess: (
      updatedSession: ClassSession,
    ) => {
      // ------------------------------------------------------
      // DETAIL CACHE
      // ------------------------------------------------------

      queryClient.setQueryData(
        classSessionQueryKeys.detail(
          updatedSession.sessionId,
        ),
        updatedSession,
      );

      // ------------------------------------------------------
      // CLASS SESSION LISTS
      // ------------------------------------------------------

      void queryClient.invalidateQueries({
        queryKey:
          classSessionQueryKeys.all,
      });

      // ------------------------------------------------------
      // PROFESSOR TIMETABLE
      // ------------------------------------------------------

      void queryClient.invalidateQueries({
        queryKey: [
          "professor-timetable",
          updatedSession
            .teaching
            .professor
            .profId,
        ],
      });

      // ------------------------------------------------------
      // PROFESSOR DASHBOARD
      // ------------------------------------------------------

      void queryClient.invalidateQueries({
        queryKey: [
          "professor-dashboard",
        ],
      });

      // ------------------------------------------------------
      // STUDENT TIMETABLE
      // ------------------------------------------------------

      void queryClient.invalidateQueries({
        queryKey: [
          "student-timetable",
        ],
      });

      // ------------------------------------------------------
      // STUDENT DASHBOARD
      // ------------------------------------------------------

      void queryClient.invalidateQueries({
        queryKey: [
          "student-dashboard",
        ],
      });
    },
  });
}

// ============================================================
// DELETE CLASS SESSION
// ============================================================

export function useDeleteClassSession() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      sessionId: string,
    ) =>
      deleteClassSession(
        sessionId,
      ),

    onSuccess: (
      _data,
      sessionId,
    ) => {
      // ------------------------------------------------------
      // REMOVE DETAIL CACHE
      // ------------------------------------------------------

      queryClient.removeQueries({
        queryKey:
          classSessionQueryKeys.detail(
            sessionId,
        ),
      });

      // ------------------------------------------------------
      // ADMIN TIMETABLE
      // ------------------------------------------------------

      void queryClient.invalidateQueries({
        queryKey:
          classSessionQueryKeys.all,
      });

      // ------------------------------------------------------
      // ALL PROFESSOR TIMETABLES
      // ------------------------------------------------------

      void queryClient.invalidateQueries({
        queryKey: [
          "professor-timetable",
        ],
      });

      // ------------------------------------------------------
      // PROFESSOR DASHBOARDS
      // ------------------------------------------------------

      void queryClient.invalidateQueries({
        queryKey: [
          "professor-dashboard",
        ],
      });

      // ------------------------------------------------------
      // ALL STUDENT TIMETABLES
      // ------------------------------------------------------

      void queryClient.invalidateQueries({
        queryKey: [
          "student-timetable",
        ],
      });

      // ------------------------------------------------------
      // STUDENT DASHBOARDS
      // ------------------------------------------------------

      void queryClient.invalidateQueries({
        queryKey: [
          "student-dashboard",
        ],
      });
    },
  });
}