import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createSelectsSubject,
  deleteSelectsSubject,
  getSelectsSubjectsByStudent,
} from "../../../lib/api/endpoints/selectsSubjects";

import {
  getStudentById,
} from "../../../lib/api/endpoints/students";

import {
  getSubjects,
} from "../../../lib/api/endpoints/subjects";

// ============================================================
// STUDENT SUBJECT SELECTION HOOK
// ============================================================

export function useStudentSubjects(
  studentId: string,
) {
  const queryClient =
    useQueryClient();

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
        Boolean(studentId),

      staleTime: 60_000,
    });

  // ==========================================================
  // CURRENTLY SELECTED SUBJECTS
  // ==========================================================

  const selected =
    useQuery({
      queryKey: [
        "student-selected-subjects",
        studentId,
      ],

      queryFn: () =>
        getSelectsSubjectsByStudent(
          studentId,
        ),

      enabled:
        Boolean(studentId),

      staleTime: 30_000,
    });

  // ==========================================================
  // AVAILABLE SUBJECTS
  // ==========================================================
  //
  // Subjects are loaded using BOTH:
  //
  // Student -> Course
  // Student -> Semester
  //
  // Therefore a student only receives subjects belonging to
  // their enrolled course AND current semester.
  //
  // Example:
  //
  // Student:
  //   Course   = CSE01
  //   Semester = 2
  //
  // Request:
  //   getSubjects("CSE01", 2)
  //
  // A Semester 7 subject will not be returned.
  // ==========================================================

  const available =
    useQuery({
      queryKey: [
        "student-available-subjects",
        student.data?.course
          .courseId,
        student.data?.semester,
      ],

      queryFn: () => {
        if (
          !student.data
        ) {
          throw new Error(
            "Student data is not available.",
          );
        }

        return getSubjects(
          student.data.course
            .courseId,
          student.data.semester,
        );
      },

      enabled:
        Boolean(
          student.data
            ?.course
            .courseId,
        ) &&
        student.data?.semester != null,

      staleTime:
        60_000,
    });

  // ==========================================================
  // SELECT SUBJECT
  // ==========================================================

  const selectMutation =
    useMutation({
      mutationFn: (
        subjectId: string,
      ) => {
        // ----------------------------------------------------
        // CHECK STUDENT DATA
        // ----------------------------------------------------

        const studentData =
          student.data;

        if (!studentData) {
          throw new Error(
            "Student data is not available.",
          );
        }

        // ----------------------------------------------------
        // FIND SUBJECT
        // ----------------------------------------------------

        const subject =
          available.data?.find(
            (item) =>
              item.subjectId ===
              subjectId,
          );

        if (!subject) {
          throw new Error(
            "Selected subject could not be found.",
          );
        }

        // ----------------------------------------------------
        // CREATE SELECTION
        // ----------------------------------------------------
        //
        // IMPORTANT:
        //
        // The backend expects:
        //
        // {
        //   "student": {
        //     "studentId": "..."
        //   },
        //   "subject": {
        //     "subjectId": "..."
        //   }
        // }
        //
        // NOT:
        //
        // {
        //   "id": {
        //     "studentId": "...",
        //     "subjectId": "..."
        //   }
        // }
        // ----------------------------------------------------

        return createSelectsSubject({
          student: {
            studentId:
              studentData.studentId,
          },

          subject: {
            subjectId:
              subject.subjectId,
          },
        });
      },

      // ======================================================
      // SUCCESS
      // ======================================================

      onSuccess:
        async () => {
          await queryClient.invalidateQueries(
            {
              queryKey: [
                "student-selected-subjects",
                studentId,
              ],
            },
          );

          // The available-subject list can also be
          // refreshed because one of its items is now
          // selected.

          await queryClient.invalidateQueries(
            {
              queryKey: [
                "student-available-subjects",
              ],
            },
          );
        },
    });

  // ==========================================================
  // REMOVE SUBJECT
  // ==========================================================

  const removeMutation =
    useMutation({
      mutationFn: (
        subjectId: string,
      ) =>
        deleteSelectsSubject(
          studentId,
          subjectId,
        ),

      // ======================================================
      // SUCCESS
      // ======================================================

      onSuccess:
        async () => {
          await queryClient.invalidateQueries(
            {
              queryKey: [
                "student-selected-subjects",
                studentId,
              ],
            },
          );

          await queryClient.invalidateQueries(
            {
              queryKey: [
                "student-available-subjects",
              ],
            },
          );
        },
    });

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    student,

    selected,

    available,

    selectMutation,

    removeMutation,
  };
}