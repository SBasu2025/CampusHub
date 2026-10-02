import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createTeaching,
  deleteTeaching,
  getTeachingById,
  getTeachings,
  getTeachingsByProfessor,
  getTeachingsBySubject,
  reassignProfessor,
} from "../../../lib/api/endpoints/teachings";

import type {
  Teaching,
} from "../../../lib/api/types";

// ============================================================
// INPUT TYPES
// ============================================================

export interface CreateTeachingInput {
  professorId: string;
  subjectId: string;
}

export interface ReassignTeachingInput {
  oldProfId: string;
  subjectId: string;
  newProfId: string;
}

// ============================================================
// ALL TEACHINGS
// ============================================================

export function useTeachings() {
  return useQuery({
    queryKey: [
      "teachings",
    ],

    queryFn:
      getTeachings,

    staleTime: 60_000,
  });
}

// ============================================================
// TEACHINGS BY PROFESSOR
// ============================================================

export function useTeachingsByProfessor(
  profId: string,
) {
  return useQuery({
    queryKey: [
      "teachings-professor",
      profId,
    ],

    queryFn: () =>
      getTeachingsByProfessor(
        profId,
      ),

    enabled:
      Boolean(profId),

    staleTime: 60_000,
  });
}

// ============================================================
// TEACHINGS BY SUBJECT
// ============================================================

export function useTeachingsBySubject(
  subjectId: string,
) {
  return useQuery({
    queryKey: [
      "teachings-subject",
      subjectId,
    ],

    queryFn: () =>
      getTeachingsBySubject(
        subjectId,
      ),

    enabled:
      Boolean(subjectId),

    staleTime: 60_000,
  });
}

// ============================================================
// SINGLE TEACHING
// ============================================================

export function useTeaching(
  profId: string,

  subjectId: string,
) {
  return useQuery({
    queryKey: [
      "teaching",
      profId,
      subjectId,
    ],

    queryFn: () =>
      getTeachingById(
        profId,
        subjectId,
      ),

    enabled:
      Boolean(
        profId &&
          subjectId,
      ),

    staleTime: 60_000,
  });
}

// ============================================================
// CACHE REFRESH HELPER
// ============================================================

function invalidateTeachingDependents(
  queryClient: ReturnType<
    typeof useQueryClient
  >,

  professorIds: string[] = [],
) {
  // ----------------------------------------------------------
  // TEACHING
  // ----------------------------------------------------------

  void queryClient.invalidateQueries({
    queryKey: [
      "teachings",
    ],
  });

  void queryClient.invalidateQueries({
    queryKey: [
      "teachings-professor",
    ],
  });

  void queryClient.invalidateQueries({
    queryKey: [
      "teachings-subject",
    ],
  });

  // ----------------------------------------------------------
  // CLASS SESSIONS
  // ----------------------------------------------------------
  //
  // Teaching is part of the nested ClassSession response.
  //
  // Example:
  //
  // ClassSession
  //   -> Teaching
  //      -> Professor
  //      -> Subject
  //
  // Therefore any teaching change makes cached sessions
  // potentially stale.
  // ----------------------------------------------------------

  void queryClient.invalidateQueries({
    queryKey: [
      "class-sessions",
    ],
  });

  void queryClient.invalidateQueries({
    queryKey: [
      "professor-timetable",
    ],
  });

  void queryClient.invalidateQueries({
    queryKey: [
      "professor-dashboard",
    ],
  });

  // ----------------------------------------------------------
  // TARGET PROFESSOR CACHE
  // ----------------------------------------------------------

  for (
    const professorId of
      professorIds
  ) {
    if (!professorId) {
      continue;
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
  }
}

// ============================================================
// CREATE
// ============================================================

export function useCreateTeaching() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      professorId,
      subjectId,
    }: CreateTeachingInput) =>
      createTeaching({
        id: {
          profId:
            professorId,

          subjectId,
        },

        professor: {
          profId:
            professorId,
        } as Teaching["professor"],

        subject: {
          subjectId,
        } as Teaching["subject"],
      }),

    onSuccess: (
      createdTeaching: Teaching,
    ) => {
      queryClient.setQueryData<
        Teaching
      >(
        [
          "teaching",
          createdTeaching
            .id
            .profId,
          createdTeaching
            .id
            .subjectId,
        ],
        createdTeaching,
      );

      invalidateTeachingDependents(
        queryClient,

        [
          createdTeaching
            .id
            .profId,
        ],
      );
    },
  });
}

// ============================================================
// REASSIGN
// ============================================================

export function useReassignTeaching() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      oldProfId,
      subjectId,
      newProfId,
    }: ReassignTeachingInput) =>
      reassignProfessor(
        oldProfId,
        subjectId,
        newProfId,
      ),

    onSuccess: (
      updatedTeaching: Teaching,

      variables,
    ) => {
      // ------------------------------------------------------
      // REMOVE OLD COMPOSITE CACHE
      // ------------------------------------------------------

      queryClient.removeQueries({
        queryKey: [
          "teaching",
          variables.oldProfId,
          variables.subjectId,
        ],
      });

      // ------------------------------------------------------
      // CACHE NEW ASSIGNMENT
      // ------------------------------------------------------

      queryClient.setQueryData<
        Teaching
      >(
        [
          "teaching",
          updatedTeaching
            .id
            .profId,
          updatedTeaching
            .id
            .subjectId,
        ],
        updatedTeaching,
      );

      // ------------------------------------------------------
      // REFRESH OLD + NEW PROFESSORS
      // ------------------------------------------------------

      invalidateTeachingDependents(
        queryClient,

        [
          variables.oldProfId,
          variables.newProfId,
        ],
      );
    },
  });
}

// ============================================================
// DELETE
// ============================================================

export function useDeleteTeaching() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      profId,
      subjectId,
    }: {
      profId: string;
      subjectId: string;
    }) =>
      deleteTeaching(
        profId,
        subjectId,
      ),

    onSuccess: (
      _data,
      variables,
    ) => {
      // ------------------------------------------------------
      // REMOVE EXACT CACHE
      // ------------------------------------------------------

      queryClient.removeQueries({
        queryKey: [
          "teaching",
          variables.profId,
          variables.subjectId,
        ],
      });

      // ------------------------------------------------------
      // REFRESH DEPENDENTS
      // ------------------------------------------------------

      invalidateTeachingDependents(
        queryClient,

        [
          variables.profId,
        ],
      );
    },
  });
}