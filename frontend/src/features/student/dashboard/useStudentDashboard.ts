import {
  useQueries,
  useQuery,
} from "@tanstack/react-query";

import {
  getStudentById,
  getStudentSelectedSubjects,
  getStudentSubjectAttendance,
  getStudentTimetable,
} from "../../../lib/api/endpoints/students";

import {
  getSemesterSGPA,
} from "../../../lib/api/endpoints/studentMarks";

// ============================================================
// STUDENT DASHBOARD
// ============================================================

export function useStudentDashboard(
  studentId: string,
) {
  // ==========================================================
  // STUDENT PROFILE
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
  // SELECTED SUBJECTS
  // ==========================================================

  const selectedSubjects =
    useQuery({
      queryKey: [
        "student-selected-subjects",
        studentId,
      ],

      queryFn: () =>
        getStudentSelectedSubjects(
          studentId,
        ),

      enabled:
        Boolean(
          studentId,
        ),

      staleTime:
        30_000,

      refetchOnWindowFocus:
        true,
    });

  // ==========================================================
  // SUBJECT ATTENDANCE SUMMARIES
  // ==========================================================
  //
  // One query for every selected subject.
  //
  // These are parallel requests through useQueries.
  //
  // This is also the source used to calculate the overall
  // attendance displayed on the dashboard.
  // ==========================================================

  const subjectAttendance =
    useQueries({
      queries: (
        selectedSubjects.data ??
        []
      ).map(
        (selection) => {
          const subjectId =
            selection.subject
              .subjectId;

          return {
            queryKey: [
              "student-subject-attendance-summary",
              studentId,
              subjectId,
            ],

            queryFn: () =>
              getStudentSubjectAttendance(
                studentId,
                subjectId,
              ),

            enabled:
              Boolean(
                studentId &&
                  subjectId,
              ),

            staleTime:
              30_000,

            refetchOnWindowFocus:
              true,
          };
        },
      ),
    });

  // ==========================================================
  // TIMETABLE
  // ==========================================================

  const timetable =
    useQuery({
      queryKey: [
        "student-timetable",
        studentId,
      ],

      queryFn: () =>
        getStudentTimetable(
          studentId,
        ),

      enabled:
        Boolean(
          studentId,
        ),

      staleTime:
        30_000,

      refetchOnWindowFocus:
        true,
    });

  // ==========================================================
  // CURRENT SEMESTER
  // ==========================================================

  const currentSemester =
    student.data
      ?.semester ?? 0;

  // ==========================================================
  // CURRENT SGPA
  // ==========================================================

  const sgpa =
    useQuery({
      queryKey: [
        "student-sgpa",
        studentId,
        currentSemester,
      ],

      queryFn: () =>
        getSemesterSGPA(
          studentId,
          currentSemester,
        ),

      enabled:
        Boolean(
          studentId &&
            currentSemester >
              0,
        ),

      staleTime:
        30_000,

      retry: false,

      refetchOnWindowFocus:
        true,
    });

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    student,

    selectedSubjects,

    subjectAttendance,

    timetable,

    sgpa,
  };
}