import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  correctAttendance,
  getAdminAttendanceByCourse,
  getAdminAttendanceById,
  getAdminAttendanceBySession,
  getAdminAttendanceByStudent,
  getAdminAttendanceBySubject,
} from "../../../lib/api/endpoints/admins";

import type { Attendance } from "../../../lib/api/types";

// ============================================================
// FILTER TYPES
// ============================================================

export type AdminAttendanceFilter =
  | {
      type: "session";
      id: string;
    }
  | {
      type: "subject";
      id: string;
    }
  | {
      type: "course";
      id: string;
    }
  | {
      type: "student";
      id: string;
    }
  | null;

// ============================================================
// ATTENDANCE QUERY
// ============================================================

export function useAdminAttendance(
  filter: AdminAttendanceFilter,
) {
  return useQuery({
    queryKey: [
      "admin-attendance",
      filter?.type ?? "all",
      filter?.id ?? "",
    ],

    queryFn: async (): Promise<Attendance[]> => {
      if (!filter) {
        return [];
      }

      switch (filter.type) {
        case "session":
          return getAdminAttendanceBySession(
            filter.id,
          );

        case "subject":
          return getAdminAttendanceBySubject(
            filter.id,
          );

        case "course":
          return getAdminAttendanceByCourse(
            filter.id,
          );

        case "student":
          return getAdminAttendanceByStudent(
            filter.id,
          );
      }
    },

    enabled: !!filter?.id,

    staleTime: 30_000,
  });
}

// ============================================================
// SINGLE ATTENDANCE RECORD
// ============================================================

export function useAdminAttendanceRecord(
  sessionId: string,
  studentId: string,
) {
  return useQuery({
    queryKey: [
      "admin-attendance-record",
      sessionId,
      studentId,
    ],

    queryFn: () =>
      getAdminAttendanceById(
        sessionId,
        studentId,
      ),

    enabled: !!sessionId && !!studentId,

    staleTime: 30_000,
  });
}

// ============================================================
// CORRECT ATTENDANCE
// ============================================================

export function useCorrectAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      studentId,
      status,
    }: {
      sessionId: string;
      studentId: string;
      status: "Present" | "Absent";
    }) =>
      correctAttendance(
        sessionId,
        studentId,
        status,
      ),

    onSuccess: (
      updatedAttendance: Attendance,
    ) => {
      const {
        sessionId,
        studentId,
      } = updatedAttendance.id;

      // --------------------------------------------------------
      // Update the individual attendance-record cache
      // --------------------------------------------------------

      queryClient.setQueryData<Attendance>(
        [
          "admin-attendance-record",
          sessionId,
          studentId,
        ],
        updatedAttendance,
      );

      // --------------------------------------------------------
      // Refresh attendance overview queries
      // --------------------------------------------------------

      void queryClient.invalidateQueries({
        queryKey: [
          "admin-attendance",
        ],
      });

      // --------------------------------------------------------
      // Refresh the individual attendance record
      // --------------------------------------------------------

      void queryClient.invalidateQueries({
        queryKey: [
          "admin-attendance-record",
          sessionId,
          studentId,
        ],
      });

      // --------------------------------------------------------
      // Refresh Admin Dashboard analytics
      //
      // IMPORTANT:
      // Must match useAdminDashboard.ts exactly.
      // --------------------------------------------------------

      void queryClient.invalidateQueries({
        queryKey: [
          "admin-dashboard-analytics",
        ],
      });
    },
  });
}