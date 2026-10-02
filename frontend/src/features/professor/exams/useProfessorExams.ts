import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getProfessorSubjects,
} from "../../../lib/api/endpoints/professors";

import {
  getExaminationsForProfessorAndSubject,
  getStudentsForExamination,
  createMarksForSection,
  createMarkForStudent,
  updateMarkForStudent,
  getMarksForExamination,
  type MarkEntry,
} from "../../../lib/api/endpoints/studentMarks";

// ============================================================
// HOOK
// ============================================================

export function useProfessorExams(
  professorId: string,
  subjectId: string,
  examId: string,
) {
  const queryClient =
    useQueryClient();

  // ==========================================================
  // SUBJECTS
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

      staleTime:
        60_000,

      refetchOnWindowFocus:
        true,
    });

  // ==========================================================
  // EXAMINATIONS
  // ==========================================================

  const examinations =
    useQuery({
      queryKey: [
        "professor-exams",
        professorId,
        subjectId,
      ],

      queryFn: () =>
        getExaminationsForProfessorAndSubject(
          professorId,
          subjectId,
        ),

      enabled:
        Boolean(
          professorId &&
            subjectId,
        ),

      staleTime:
        30_000,

      refetchOnWindowFocus:
        true,
    });

  // ==========================================================
  // SELECTED EXAMINATION
  // ==========================================================
  //
  // The section is NOT selected by the professor.
  //
  // The admin configures the section while creating the
  // examination.
  //
  // Therefore the selected examination itself is the
  // source of truth for the section.
  // ==========================================================

  const selectedExam =
    examinations.data?.find(
      (exam) =>
        exam.examId ===
        examId,
    );

  const section =
    selectedExam?.section ??
    "";

  // ==========================================================
  // STUDENTS
  // ==========================================================
  //
  // Students are loaded only for the section configured
  // on the selected examination.
  //
  // No professor name.
  // No identity confirmation.
  // No arbitrary section selection.
  //
  // The backend gets the authenticated professor from
  // Spring Security and verifies that the professor is
  // assigned to this examination.
  // ==========================================================

  const students =
    useQuery({
      queryKey: [
        "exam-section-students",
        examId,
        section,
      ],

      queryFn: () =>
        getStudentsForExamination(
          examId,
          section,
        ),

      enabled:
        Boolean(
          examId &&
            section,
        ),

      staleTime:
        30_000,

      refetchOnWindowFocus:
        true,
    });

  // ==========================================================
  // EXISTING MARKS
  // ==========================================================

  const marks =
    useQuery({
      queryKey: [
        "exam-marks",
        examId,
      ],

      queryFn: () =>
        getMarksForExamination(
          examId,
        ),

      enabled:
        Boolean(
          examId &&
            professorId,
        ),

      staleTime:
        30_000,

      refetchOnWindowFocus:
        true,
    });

  // ==========================================================
  // SHARED INVALIDATION
  // ==========================================================

  const invalidateAfterMarksChange =
    (
      affectedExamId: string,
    ) => {
      // ------------------------------------------------------
      // CURRENT EXAM MARKS
      // ------------------------------------------------------

      void queryClient.invalidateQueries({
        queryKey: [
          "exam-marks",
          affectedExamId,
        ],
      });

      // ------------------------------------------------------
      // STUDENT MARK DATA
      // ------------------------------------------------------

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
    };

  // ==========================================================
  // BATCH CREATE
  // ==========================================================
  //
  // The professor identity is NOT sent here.
  //
  // Backend obtains the authenticated professor from
  // Spring Security.
  // ==========================================================

  const createBatch =
    useMutation({
      mutationFn: ({
        entries,
      }: {
        entries: MarkEntry[];
      }) =>
        createMarksForSection(
          examId,
          section,
          entries,
        ),

      onSuccess: (
        createdMarks,
      ) => {
        // ----------------------------------------------------
        // IMMEDIATE EXAM-MARK CACHE
        // ----------------------------------------------------

        queryClient.setQueryData(
          [
            "exam-marks",
            examId,
          ],
          createdMarks,
        );

        // ----------------------------------------------------
        // INVALIDATE DEPENDENT CACHES
        // ----------------------------------------------------

        invalidateAfterMarksChange(
          examId,
        );
      },
    });

  // ==========================================================
  // SINGLE CREATE
  // ==========================================================

  const createSingle =
    useMutation({
      mutationFn: ({
        studentId,
        marksObtained,
      }: {
        studentId: string;
        marksObtained: number;
      }) =>
        createMarkForStudent(
          examId,
          section,
          studentId,
          {
            marksObtained,
          },
        ),

      onSuccess: () => {
        invalidateAfterMarksChange(
          examId,
        );
      },
    });

  // ==========================================================
  // SINGLE UPDATE
  // ==========================================================

  const updateSingle =
    useMutation({
      mutationFn: ({
        studentId,
        marksObtained,
      }: {
        studentId: string;
        marksObtained: number;
      }) =>
        updateMarkForStudent(
          examId,
          section,
          studentId,
          {
            marksObtained,
          },
        ),

      onSuccess: () => {
        invalidateAfterMarksChange(
          examId,
        );
      },
    });

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    subjects,

    examinations,

    students,

    marks,

    createBatch,

    createSingle,

    updateSingle,
  };
}