import {
    useMutation,
    useQuery,
    useQueryClient,
  } from "@tanstack/react-query";

  import {
    createAdminStaffAttendance,
    createProfessorStaffAttendance,
    deleteStaffAttendance,
    getAdminStaffAttendanceByDate,
    getAdminStaffAttendanceReport,
    getDateStaffAttendanceReport,
    getProfessorStaffAttendanceByDate,
    getProfessorStaffAttendanceReport,
    getStaffAttendanceById,
    getStaffAttendances,
    getStaffAttendancesByAdmin,
    getStaffAttendancesByDay,
    getStaffAttendancesByProfessor,
    updateStaffAttendance,
    type AdminStaffAttendanceCreateRequest,
    type ProfessorStaffAttendanceCreateRequest,
    type StaffAttendanceStatus,
  } from "../../../lib/api/endpoints/staffAttendances";

  import type {
    StaffAttendance,
  } from "../../../lib/api/types";

  // ============================================================
  // ALL STAFF ATTENDANCE
  // ============================================================

  export function useStaffAttendances() {
    return useQuery({
      queryKey: ["staff-attendances"],
      queryFn: getStaffAttendances,
      staleTime: 30_000,
    });
  }

  // ============================================================
  // SINGLE STAFF ATTENDANCE RECORD
  // ============================================================

  export function useStaffAttendance(
    attendanceId: string,
  ) {
    return useQuery({
      queryKey: [
        "staff-attendance",
        attendanceId,
      ],

      queryFn: () =>
        getStaffAttendanceById(
          attendanceId,
        ),

      enabled:
        !!attendanceId,

      staleTime: 30_000,
    });
  }

  // ============================================================
  // PROFESSOR STAFF ATTENDANCE
  // ============================================================

  export function useProfessorStaffAttendance(
    profId: string,
  ) {
    return useQuery({
      queryKey: [
        "staff-attendance-professor",
        profId,
      ],

      queryFn: () =>
        getStaffAttendancesByProfessor(
          profId,
        ),

      enabled:
        !!profId,

      staleTime: 30_000,
    });
  }

  export function useProfessorStaffAttendanceReport(
    profId: string,
  ) {
    return useQuery({
      queryKey: [
        "staff-attendance-professor-report",
        profId,
      ],

      queryFn: () =>
        getProfessorStaffAttendanceReport(
          profId,
        ),

      enabled:
        !!profId,

      staleTime: 30_000,
    });
  }

  export function useProfessorStaffAttendanceByDate(
    profId: string,
    day: string,
  ) {
    return useQuery({
      queryKey: [
        "staff-attendance-professor-date",
        profId,
        day,
      ],

      queryFn: () =>
        getProfessorStaffAttendanceByDate(
          profId,
          day,
        ),

      enabled:
        !!profId &&
        !!day,

      staleTime: 30_000,
    });
  }

  // ============================================================
  // ADMIN STAFF ATTENDANCE
  // ============================================================

  export function useAdminStaffAttendance(
    adminId: string,
  ) {
    return useQuery({
      queryKey: [
        "staff-attendance-admin",
        adminId,
      ],

      queryFn: () =>
        getStaffAttendancesByAdmin(
          adminId,
        ),

      enabled:
        !!adminId,

      staleTime: 30_000,
    });
  }

  export function useAdminStaffAttendanceReport(
    adminId: string,
  ) {
    return useQuery({
      queryKey: [
        "staff-attendance-admin-report",
        adminId,
      ],

      queryFn: () =>
        getAdminStaffAttendanceReport(
          adminId,
        ),

      enabled:
        !!adminId,

      staleTime: 30_000,
    });
  }

  export function useAdminStaffAttendanceByDate(
    adminId: string,
    day: string,
  ) {
    return useQuery({
      queryKey: [
        "staff-attendance-admin-date",
        adminId,
        day,
      ],

      queryFn: () =>
        getAdminStaffAttendanceByDate(
          adminId,
          day,
        ),

      enabled:
        !!adminId &&
        !!day,

      staleTime: 30_000,
    });
  }

  // ============================================================
  // DATE-WISE STAFF ATTENDANCE
  // ============================================================

  export function useStaffAttendanceByDay(
    day: string,
  ) {
    return useQuery({
      queryKey: [
        "staff-attendance-day",
        day,
      ],

      queryFn: () =>
        getStaffAttendancesByDay(
          day,
        ),

      enabled:
        !!day,

      staleTime: 30_000,
    });
  }

  export function useDateStaffAttendanceReport(
    day: string,
  ) {
    return useQuery({
      queryKey: [
        "staff-attendance-day-report",
        day,
      ],

      queryFn: () =>
        getDateStaffAttendanceReport(
          day,
        ),

      enabled:
        !!day,

      staleTime: 30_000,
    });
  }

  // ============================================================
  // CREATE PROFESSOR STAFF ATTENDANCE
  // ============================================================

  export function useCreateProfessorStaffAttendance() {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn: (
        request: ProfessorStaffAttendanceCreateRequest,
      ) =>
        createProfessorStaffAttendance(
          request,
        ),

      onSuccess: (
        createdRecord: StaffAttendance,
      ) => {
        queryClient.setQueryData<
          StaffAttendance
        >(
          [
            "staff-attendance",
            createdRecord.attendanceId,
          ],
          createdRecord,
        );

        void queryClient.invalidateQueries({
          queryKey: [
            "staff-attendances",
          ],
        });

        if (
          createdRecord.professor
        ) {
          void queryClient.invalidateQueries({
            queryKey: [
              "staff-attendance-professor",
              createdRecord
                .professor
                .profId,
            ],
          });

          void queryClient.invalidateQueries({
            queryKey: [
              "staff-attendance-professor-report",
              createdRecord
                .professor
                .profId,
            ],
          });

          void queryClient.invalidateQueries({
            queryKey: [
              "staff-attendance-professor-date",
              createdRecord
                .professor
                .profId,
              createdRecord.day,
            ],
          });
        }

        void queryClient.invalidateQueries({
          queryKey: [
            "staff-attendance-day",
            createdRecord.day,
          ],
        });

        void queryClient.invalidateQueries({
          queryKey: [
            "staff-attendance-day-report",
            createdRecord.day,
          ],
        });
      },
    });
  }

  // ============================================================
  // CREATE ADMIN STAFF ATTENDANCE
  // ============================================================

  export function useCreateAdminStaffAttendance() {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn: (
        request: AdminStaffAttendanceCreateRequest,
      ) =>
        createAdminStaffAttendance(
          request,
        ),

      onSuccess: (
        createdRecord: StaffAttendance,
      ) => {
        queryClient.setQueryData<
          StaffAttendance
        >(
          [
            "staff-attendance",
            createdRecord.attendanceId,
          ],
          createdRecord,
        );

        void queryClient.invalidateQueries({
          queryKey: [
            "staff-attendances",
          ],
        });

        if (createdRecord.admin) {
          void queryClient.invalidateQueries({
            queryKey: [
              "staff-attendance-admin",
              createdRecord
                .admin
                .adminId,
            ],
          });

          void queryClient.invalidateQueries({
            queryKey: [
              "staff-attendance-admin-report",
              createdRecord
                .admin
                .adminId,
            ],
          });

          void queryClient.invalidateQueries({
            queryKey: [
              "staff-attendance-admin-date",
              createdRecord
                .admin
                .adminId,
              createdRecord.day,
            ],
          });
        }

        void queryClient.invalidateQueries({
          queryKey: [
            "staff-attendance-day",
            createdRecord.day,
          ],
        });

        void queryClient.invalidateQueries({
          queryKey: [
            "staff-attendance-day-report",
            createdRecord.day,
          ],
        });
      },
    });
  }

  // ============================================================
  // UPDATE
  // ============================================================

  export function useUpdateStaffAttendance() {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn: ({
        attendanceId,
        status,
      }: {
        attendanceId: string;
        status: StaffAttendanceStatus;
      }) =>
        updateStaffAttendance(
          attendanceId,
          status,
        ),

      onSuccess: (
        updatedRecord: StaffAttendance,
      ) => {
        queryClient.setQueryData<
          StaffAttendance
        >(
          [
            "staff-attendance",
            updatedRecord.attendanceId,
          ],
          updatedRecord,
        );

        void queryClient.invalidateQueries({
          queryKey: [
            "staff-attendances",
          ],
        });

        if (
          updatedRecord.professor
        ) {
          void queryClient.invalidateQueries({
            queryKey: [
              "staff-attendance-professor",
              updatedRecord
                .professor
                .profId,
            ],
          });

          void queryClient.invalidateQueries({
            queryKey: [
              "staff-attendance-professor-report",
              updatedRecord
                .professor
                .profId,
            ],
          });

          void queryClient.invalidateQueries({
            queryKey: [
              "staff-attendance-professor-date",
              updatedRecord
                .professor
                .profId,
              updatedRecord.day,
            ],
          });
        }

        if (updatedRecord.admin) {
          void queryClient.invalidateQueries({
            queryKey: [
              "staff-attendance-admin",
              updatedRecord
                .admin
                .adminId,
            ],
          });

          void queryClient.invalidateQueries({
            queryKey: [
              "staff-attendance-admin-report",
              updatedRecord
                .admin
                .adminId,
            ],
          });

          void queryClient.invalidateQueries({
            queryKey: [
              "staff-attendance-admin-date",
              updatedRecord
                .admin
                .adminId,
              updatedRecord.day,
            ],
          });
        }

        void queryClient.invalidateQueries({
          queryKey: [
            "staff-attendance-day",
            updatedRecord.day,
          ],
        });

        void queryClient.invalidateQueries({
          queryKey: [
            "staff-attendance-day-report",
            updatedRecord.day,
          ],
        });
      },
    });
  }

  // ============================================================
  // DELETE
  // ============================================================

  export function useDeleteStaffAttendance() {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn: (
        attendanceId: string,
      ) =>
        deleteStaffAttendance(
          attendanceId,
        ),

      onSuccess: (
        _data,
        attendanceId,
      ) => {
        queryClient.removeQueries({
          queryKey: [
            "staff-attendance",
            attendanceId,
          ],
        });

        void queryClient.invalidateQueries({
          queryKey: [
            "staff-attendances",
          ],
        });

        void queryClient.invalidateQueries({
          queryKey: [
            "staff-attendance-professor",
          ],
        });

        void queryClient.invalidateQueries({
          queryKey: [
            "staff-attendance-professor-report",
          ],
        });

        void queryClient.invalidateQueries({
          queryKey: [
            "staff-attendance-admin",
          ],
        });

        void queryClient.invalidateQueries({
          queryKey: [
            "staff-attendance-admin-report",
          ],
        });

        void queryClient.invalidateQueries({
          queryKey: [
            "staff-attendance-day",
          ],
        });

        void queryClient.invalidateQueries({
          queryKey: [
            "staff-attendance-day-report",
          ],
        });
      },
    });
  }