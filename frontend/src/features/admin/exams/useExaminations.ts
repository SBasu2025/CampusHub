import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  configureExaminations,
  deleteExamination,
  getExaminations,
  updateExamination,
  type ConfigureExaminationsRequest,
  type UpdateExaminationRequest,
} from "../../../lib/api/endpoints/examinations";

import type {
  Examination,
} from "../../../lib/api/types";

// ============================================================
// CACHE INVALIDATION
// ============================================================
//
// Examination configuration affects:
//
// ADMIN
// - Examination configuration list
//
// PROFESSOR
// - Assigned examinations
// - Examination section
// - Students available for an examination
// - Examination marks
//
// STUDENT
// - Subject marks
// - SGPA
//
// Every examination mutation therefore invalidates all
// dependent query families.
// ============================================================

function invalidateExamDependents(
  queryClient: ReturnType<
    typeof useQueryClient
  >,
) {
  // ----------------------------------------------------------
  // EXAMINATION CONFIGURATION
  // ----------------------------------------------------------

  void queryClient.invalidateQueries({
    queryKey: [
      "examinations",
    ],
  });

  void queryClient.invalidateQueries({
    queryKey: [
      "examination",
    ],
  });

  // ----------------------------------------------------------
  // PROFESSOR EXAMINATION WORKFLOW
  // ----------------------------------------------------------

  void queryClient.invalidateQueries({
    queryKey: [
      "professor-exams",
    ],
  });

  void queryClient.invalidateQueries({
    queryKey: [
      "exam-sections",
    ],
  });

  void queryClient.invalidateQueries({
    queryKey: [
      "exam-section-students",
    ],
  });

  void queryClient.invalidateQueries({
    queryKey: [
      "exam-marks",
    ],
  });

  // ----------------------------------------------------------
  // STUDENT MARKS / SGPA
  // ----------------------------------------------------------

  void queryClient.invalidateQueries({
    queryKey: [
      "student-sgpa",
    ],
  });

  void queryClient.invalidateQueries({
    queryKey: [
      "student-subject-marks",
    ],
  });

  void queryClient.invalidateQueries({
    queryKey: [
      "all-student-marks",
    ],
  });

  void queryClient.invalidateQueries({
    queryKey: [
      "student-marks",
    ],
  });
}

// ============================================================
// ALL EXAMINATIONS
// ============================================================

export function useExaminations() {
  return useQuery({
    queryKey: [
      "examinations",
    ],

    queryFn:
      getExaminations,

    staleTime:
      60_000,

    refetchOnWindowFocus:
      true,
  });
}

// ============================================================
// BULK CONFIGURATION
// ============================================================
//
// Admin configures:
//
// Department
// Course
// Subject
// Semester
// Section
// Number of Internals
// Internal Max Marks
// Final Max Marks
// Internal Professors
// Final Professor
//
// The request type already contains `section`.
// ============================================================

export function useConfigureExaminations() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      request: ConfigureExaminationsRequest,
    ) =>
      configureExaminations(
        request,
      ),

    onSuccess: (
      createdExaminations: Examination[],
    ) => {
      // ------------------------------------------------------
      // IMMEDIATE CACHE UPDATE
      // ------------------------------------------------------

      queryClient.setQueryData<
        Examination[]
      >(
        [
          "examinations",
        ],
        (current) => {
          if (!current) {
            return createdExaminations;
          }

          const existingIds =
            new Set(
              current.map(
                (
                  examination,
                ) =>
                  examination.examId,
              ),
            );

          return [
            ...current,

            ...createdExaminations.filter(
              (
                examination,
              ) =>
                !existingIds.has(
                  examination.examId,
                ),
            ),
          ];
        },
      );

      // ------------------------------------------------------
      // DEPENDENT QUERIES
      // ------------------------------------------------------

      invalidateExamDependents(
        queryClient,
      );
    },
  });
}

// ============================================================
// UPDATE
// ============================================================
//
// Admin can update the configured examination while retaining
// its identity.
//
// The UpdateExaminationRequest now also contains `section`.
// AdminExams.tsx preserves the examination's existing section
// when saving an edit.
// ============================================================

export function useUpdateExamination() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      examId,
      request,
    }: {
      examId: string;

      request: UpdateExaminationRequest;
    }) =>
      updateExamination(
        examId,
        request,
      ),

    onSuccess: (
      updatedExam: Examination,
    ) => {
      // ------------------------------------------------------
      // INDIVIDUAL EXAMINATION CACHE
      // ------------------------------------------------------

      queryClient.setQueryData<
        Examination
      >(
        [
          "examination",
          updatedExam.examId,
        ],
        updatedExam,
      );

      // ------------------------------------------------------
      // DEPENDENT QUERIES
      // ------------------------------------------------------

      invalidateExamDependents(
        queryClient,
      );
    },
  });
}

// ============================================================
// DELETE
// ============================================================

export function useDeleteExamination() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      examId: string,
    ) =>
      deleteExamination(
        examId,
      ),

    onSuccess: (
      _data,
      examId,
    ) => {
      // ------------------------------------------------------
      // REMOVE INDIVIDUAL CACHE
      // ------------------------------------------------------

      queryClient.removeQueries({
        queryKey: [
          "examination",
          examId,
        ],
      });

      // ------------------------------------------------------
      // DEPENDENT QUERIES
      // ------------------------------------------------------

      invalidateExamDependents(
        queryClient,
      );
    },
  });
}