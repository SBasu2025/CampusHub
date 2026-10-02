import {
  useQueries,
  useQuery,
} from "@tanstack/react-query";

import {
  getStudentAttendance,
  getStudentSelectedSubjects,
  getStudentSubjectAttendance,
} from "../../../lib/api/endpoints/students";

// ============================================================
// STUDENT ATTENDANCE
// ============================================================

export function useStudentAttendance(
  studentId: string,
) {
  // ==========================================================
  // RAW ATTENDANCE
  // ==========================================================
  //
  // Used for:
  // - expandable session history
  // - session dates
  // - Present / Absent status
  //
  // The overall percentage itself is NOT calculated from this
  // list. It comes from the backend subject-summary endpoints.
  // ==========================================================

  const attendance =
    useQuery({
      queryKey: [
        "student-attendance",
        studentId,
      ],

      queryFn: () =>
        getStudentAttendance(
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
  // SUBJECT SUMMARY QUERIES
  // ==========================================================
  //
  // One query per selected subject.
  //
  // React Query runs these in parallel.
  // ==========================================================

  const subjectSummaries =
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
  // RETURN
  // ==========================================================

  return {
    attendance,

    selectedSubjects,

    subjectSummaries,
  };
}