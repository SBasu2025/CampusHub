import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createProfessor,
  deleteProfessor,
  getProfessorById,
  getProfessorSubjects,
  getProfessorTimetable,
  getProfessors,
  setProfessorActive,
  updateProfessor,
} from "../../../lib/api/endpoints/professors";

import type {
  Department,
  Professor,
} from "../../../lib/api/types";

// ============================================================
// INPUT TYPES
// ============================================================

export interface ProfessorCreateInput {
  professorName: string;
  phoneNumber: string;
  department: Department;
}

export interface ProfessorUpdateInput {
  professorName: string;
  phoneNumber: string;
  department: Department;
}

// ============================================================
// PROFESSOR LIST
// ============================================================

export function useProfessors(
  departmentId?: string,
) {
  return useQuery({
    queryKey: [
      "professors",
      departmentId ?? "",
    ],

    queryFn: () =>
      getProfessors(
        departmentId ||
          undefined,
      ),

    staleTime: 60_000,
  });
}

// ============================================================
// SINGLE PROFESSOR
// ============================================================

export function useProfessor(
  professorId: string,
) {
  return useQuery({
    queryKey: [
      "professor",
      professorId,
    ],

    queryFn: () =>
      getProfessorById(
        professorId,
      ),

    enabled:
      Boolean(
        professorId,
      ),

    staleTime: 60_000,
  });
}

// ============================================================
// PROFESSOR SUBJECTS
// ============================================================

export function useProfessorSubjects(
  professorId: string,
) {
  return useQuery({
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
}

// ============================================================
// PROFESSOR TIMETABLE
// ============================================================

export function useProfessorTimetable(
  professorId: string,
) {
  return useQuery({
    queryKey: [
      "professor-timetable",
      professorId,
    ],

    queryFn: () =>
      getProfessorTimetable(
        professorId,
      ),

    enabled:
      Boolean(
        professorId,
      ),

    staleTime: 60_000,
  });
}

// ============================================================
// INVALIDATE PROFESSOR DEPENDENTS
// ============================================================

function invalidateProfessorDependents(
  queryClient: ReturnType<
    typeof useQueryClient
  >,

  professorId?: string,
) {
  // ----------------------------------------------------------
  // PROFESSORS
  // ----------------------------------------------------------

  void queryClient.invalidateQueries({
    queryKey: [
      "professors",
    ],
  });

  // ----------------------------------------------------------
  // NESTED CLASS SESSION RESPONSES
  // ----------------------------------------------------------

  void queryClient.invalidateQueries({
    queryKey: [
      "class-sessions",
    ],
  });

  // ----------------------------------------------------------
  // PROFESSOR-SPECIFIC DATA
  // ----------------------------------------------------------

  if (!professorId) {
    return;
  }

  void queryClient.invalidateQueries({
    queryKey: [
      "professor",
      professorId,
    ],
  });

  void queryClient.invalidateQueries({
    queryKey: [
      "professor-subjects",
      professorId,
    ],
  });

  void queryClient.invalidateQueries({
    queryKey: [
      "professor-timetable",
      professorId,
    ],
  });

  void queryClient.invalidateQueries({
    queryKey: [
      "professor-dashboard",
    ],
  });
}

// ============================================================
// CREATE PROFESSOR
// ============================================================

export function useCreateProfessor() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      professor: ProfessorCreateInput,
    ) =>
      createProfessor({
        profId: "",

        professorName:
          professor.professorName,

        phoneNumber:
          professor.phoneNumber,

        department:
          professor.department,

        active: true,
      }),

    onSuccess: (
      createdProfessor: Professor,
    ) => {
      invalidateProfessorDependents(
        queryClient,
        createdProfessor.profId,
      );
    },
  });
}

// ============================================================
// UPDATE PROFESSOR
// ============================================================

export function useUpdateProfessor() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      professor,
    }: {
      id: string;

      professor: ProfessorUpdateInput;
    }) =>
      updateProfessor(
        id,
        {
          profId: id,

          professorName:
            professor.professorName,

          phoneNumber:
            professor.phoneNumber,

          department:
            professor.department,

          active: true,
        },
      ),

    onSuccess: (
      updatedProfessor: Professor,
    ) => {
      queryClient.setQueryData<
        Professor[]
      >(
        [
          "professors",
          "",
        ],
        (current) => {
          if (!current) {
            return current;
          }

          return current.map(
            (professor) =>
              professor.profId ===
              updatedProfessor.profId
                ? updatedProfessor
                : professor,
          );
        },
      );

      queryClient.setQueryData<
        Professor
      >(
        [
          "professor",
          updatedProfessor.profId,
        ],
        updatedProfessor,
      );

      invalidateProfessorDependents(
        queryClient,
        updatedProfessor.profId,
      );
    },
  });
}

// ============================================================
// ACTIVATE / DEACTIVATE
// ============================================================

export function useSetProfessorActive() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      active,
    }: {
      id: string;

      active: boolean;
    }) =>
      setProfessorActive(
        id,
        active,
      ),

    onSuccess: (
      updatedProfessor: Professor,
    ) => {
      queryClient.setQueryData<
        Professor[]
      >(
        [
          "professors",
          "",
        ],
        (current) => {
          if (!current) {
            return current;
          }

          return current.map(
            (professor) =>
              professor.profId ===
              updatedProfessor.profId
                ? updatedProfessor
                : professor,
          );
        },
      );

      queryClient.setQueryData<
        Professor
      >(
        [
          "professor",
          updatedProfessor.profId,
        ],
        updatedProfessor,
      );

      invalidateProfessorDependents(
        queryClient,
        updatedProfessor.profId,
      );
    },
  });
}

// ============================================================
// DELETE
// ============================================================

export function useDeleteProfessor() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      professorId: string,
    ) =>
      deleteProfessor(
        professorId,
      ),

    onSuccess: (
      _data,
      professorId,
    ) => {
      queryClient.removeQueries({
        queryKey: [
          "professor",
          professorId,
        ],
      });

      queryClient.removeQueries({
        queryKey: [
          "professor-subjects",
          professorId,
        ],
      });

      queryClient.removeQueries({
        queryKey: [
          "professor-timetable",
          professorId,
        ],
      });

      invalidateProfessorDependents(
        queryClient,
        professorId,
      );
    },
  });
}