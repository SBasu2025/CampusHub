import {
  useQuery,
} from "@tanstack/react-query";

import {
  getSemesterSGPA,
  getStudentSubjectMarks,
} from "../../../lib/api/endpoints/studentMarks";

import {
  getStudentById,
} from "../../../lib/api/endpoints/students";

import {
  getSubjects,
} from "../../../lib/api/endpoints/subjects";

// ============================================================
// STUDENT MARKS HOOK
// ============================================================
//
// Handles:
// - student identity
// - subject names
// - semester SGPA
// - selected subject examination breakdown
//
// Mutations happen on the professor side.
// This hook is intentionally read-only.
// ============================================================

export function useStudentMarks(
  studentId: string,

  semester: number,

  subjectId: string,
) {
  // ==========================================================
  // STUDENT
  // ==========================================================

  const student =
    useQuery({
      queryKey: [
        "student",
        studentId,
      ],

      queryFn: () =>
        getStudentById(
          studentId,
        ),

      enabled:
        Boolean(
          studentId,
        ),

      staleTime:
        60_000,

      refetchOnWindowFocus:
        true,
    });

  // ==========================================================
  // SUBJECTS
  // ==========================================================
  //
  // Subjects are loaded from the student's course.
  //
  // The selected historical semester does not change the
  // student's course, so this remains the appropriate source
  // for subject display names.
  // ==========================================================

  const courseId =
    student.data
      ?.course
      .courseId;

  const subjects =
    useQuery({
      queryKey: [
        "all-subjects-for-marks",
        courseId ?? "",
      ],

      queryFn: () => {
        if (!courseId) {
          throw new Error(
            "Student course is not available.",
          );
        }

        return getSubjects(
          courseId,
        );
      },

      enabled:
        Boolean(
          courseId,
        ),

      staleTime:
        60_000,

      refetchOnWindowFocus:
        true,
    });

  // ==========================================================
  // EFFECTIVE SEMESTER
  // ==========================================================
  //
  // semester = 0 means:
  // use the student's current semester.
  // ==========================================================

  const effectiveSemester =
    semester ||
    student.data
      ?.semester ||
    0;

  // ==========================================================
  // SEMESTER SGPA
  // ==========================================================

  const sgpa =
    useQuery({
      queryKey: [
        "student-sgpa",
        studentId,
        effectiveSemester,
      ],

      queryFn: () =>
        getSemesterSGPA(
          studentId,
          effectiveSemester,
        ),

      enabled:
        Boolean(
          studentId &&
            effectiveSemester >
              0,
        ),

      staleTime:
        30_000,

      refetchOnWindowFocus:
        true,

      /**
       * A missing/incomplete semester should not repeatedly
       * retry three times and make the marks page feel stuck.
       */
      retry: false,
    });

  // ==========================================================
  // SUBJECT MARKS
  // ==========================================================

  const subjectMarks =
    useQuery({
      queryKey: [
        "student-subject-marks",
        studentId,
        effectiveSemester,
        subjectId,
      ],

      queryFn: () => {
        if (!subjectId) {
          throw new Error(
            "Subject is required.",
          );
        }

        return getStudentSubjectMarks(
          studentId,
          effectiveSemester,
          subjectId,
        );
      },

      enabled:
        Boolean(
          studentId &&
            effectiveSemester >
              0 &&
            subjectId,
        ),

      staleTime:
        30_000,

      refetchOnWindowFocus:
        true,

      retry: false,
    });

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    student,

    subjects,

    sgpa,

    subjectMarks,

    effectiveSemester,
  };
}