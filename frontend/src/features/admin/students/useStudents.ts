import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createStudent,
  deleteStudent,
  getProfessorsForStudent,
  getStudentAttendance,
  getStudentById,
  getStudentSelectedSubjects,
  getStudentSubjectAttendance,
  getStudentTimetable,
  getStudents,
  promoteStudent,
  setStudentActive,
  updateStudent,
} from "../../../lib/api/endpoints/students";

import type {
  Course,
  Student,
} from "../../../lib/api/types";

// ============================================================
// INPUT TYPES
// ============================================================

export interface StudentFilters {
  courseId?: string;
  section?: string;
  semester?: number;
}

export interface StudentCreateInput {
  studentName: string;
  phoneNumber: string;
  section: string;
  semester: number;
  course: Course;
}

export interface StudentUpdateInput {
  studentName: string;
  phoneNumber: string;
  section: string;
  semester: number;
  course: Course;
}

// ============================================================
// STUDENT LIST
// ============================================================

export function useStudents(
  filters?: StudentFilters,
) {
  return useQuery({
    queryKey: [
      "students",
      filters ?? {},
    ],

    queryFn: () =>
      getStudents(filters),

    staleTime: 60_000,
  });
}

// ============================================================
// SINGLE STUDENT
// ============================================================

export function useStudent(
  studentId: string,
) {
  return useQuery({
    queryKey: [
      "student",
      studentId,
    ],

    queryFn: () =>
      getStudentById(studentId),

    enabled:
      !!studentId,

    staleTime: 60_000,
  });
}

// ============================================================
// STUDENT TIMETABLE
// ============================================================

export function useStudentTimetable(
  studentId: string,
) {
  return useQuery({
    queryKey: [
      "student-timetable",
      studentId,
    ],

    queryFn: () =>
      getStudentTimetable(
        studentId,
      ),

    enabled:
      !!studentId,

    staleTime: 60_000,
  });
}

// ============================================================
// STUDENT ATTENDANCE
// ============================================================

export function useStudentAttendance(
  studentId: string,
) {
  return useQuery({
    queryKey: [
      "student-attendance",
      studentId,
    ],

    queryFn: () =>
      getStudentAttendance(
        studentId,
      ),

    enabled:
      !!studentId,

    staleTime: 60_000,
  });
}

// ============================================================
// SUBJECT ATTENDANCE SUMMARY
// ============================================================

export function useStudentSubjectAttendance(
  studentId: string,
  subjectId: string,
) {
  return useQuery({
    queryKey: [
      "student-subject-attendance",
      studentId,
      subjectId,
    ],

    queryFn: () =>
      getStudentSubjectAttendance(
        studentId,
        subjectId,
      ),

    enabled:
      !!studentId &&
      !!subjectId,

    staleTime: 60_000,
  });
}

// ============================================================
// SELECTED SUBJECTS
// ============================================================

export function useStudentSelectedSubjects(
  studentId: string,
) {
  return useQuery({
    queryKey: [
      "student-selected-subjects",
      studentId,
    ],

    queryFn: () =>
      getStudentSelectedSubjects(
        studentId,
      ),

    enabled:
      !!studentId,

    staleTime: 60_000,
  });
}

// ============================================================
// PROFESSORS FOR STUDENT
// ============================================================

export function useProfessorsForStudent(
  studentId: string,
) {
  return useQuery({
    queryKey: [
      "student-professors",
      studentId,
    ],

    queryFn: () =>
      getProfessorsForStudent(
        studentId,
      ),

    enabled:
      !!studentId,

    staleTime: 60_000,
  });
}

// ============================================================
// CREATE STUDENT
// ============================================================

export function useCreateStudent() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      student: StudentCreateInput,
    ) =>
      createStudent({
        // Backend generates the real student ID.
        studentId: "",

        studentName:
          student.studentName,

        phoneNumber:
          student.phoneNumber,

        section:
          student.section,

        semester:
          student.semester,

        course:
          student.course,

        active: true,
      }),

    onSuccess: (
      createdStudent: Student,
    ) => {
      queryClient.setQueryData<
        Student
      >(
        [
          "student",
          createdStudent.studentId,
        ],
        createdStudent,
      );

      void queryClient.invalidateQueries({
        queryKey: ["students"],
      });
    },
  });
}

// ============================================================
// UPDATE STUDENT
// ============================================================

export function useUpdateStudent() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      student,
    }: {
      id: string;
      student: StudentUpdateInput;
    }) =>
      updateStudent(
        id,
        {
          studentId: id,

          studentName:
            student.studentName,

          phoneNumber:
            student.phoneNumber,

          section:
            student.section,

          semester:
            student.semester,

          course:
            student.course,

          active: true,
        },
      ),

    onSuccess: (
      updatedStudent: Student,
    ) => {
      queryClient.setQueryData<
        Student
      >(
        [
          "student",
          updatedStudent.studentId,
        ],
        updatedStudent,
      );

      void queryClient.invalidateQueries({
        queryKey: ["students"],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "student",
          updatedStudent.studentId,
        ],
      });
    },
  });
}

// ============================================================
// PROMOTE STUDENT
// ============================================================

export function usePromoteStudent() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      studentId: string,
    ) =>
      promoteStudent(
        studentId,
      ),

    onSuccess: (
      updatedStudent: Student,
    ) => {
      queryClient.setQueryData<
        Student
      >(
        [
          "student",
          updatedStudent.studentId,
        ],
        updatedStudent,
      );

      void queryClient.invalidateQueries({
        queryKey: ["students"],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "student",
          updatedStudent.studentId,
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "student-timetable",
          updatedStudent.studentId,
        ],
      });
    },
  });
}

// ============================================================
// ACTIVATE / DEACTIVATE STUDENT
// ============================================================

export function useSetStudentActive() {
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
      setStudentActive(
        id,
        active,
      ),

    onSuccess: (
      updatedStudent: Student,
    ) => {
      queryClient.setQueryData<
        Student
      >(
        [
          "student",
          updatedStudent.studentId,
        ],
        updatedStudent,
      );

      void queryClient.invalidateQueries({
        queryKey: ["students"],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "student",
          updatedStudent.studentId,
        ],
      });
    },
  });
}

// ============================================================
// DELETE STUDENT
// ============================================================

export function useDeleteStudent() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      studentId: string,
    ) =>
      deleteStudent(
        studentId,
      ),

    onSuccess: (
      _data,
      studentId,
    ) => {
      queryClient.removeQueries({
        queryKey: [
          "student",
          studentId,
        ],
      });

      queryClient.removeQueries({
        queryKey: [
          "student-timetable",
          studentId,
        ],
      });

      queryClient.removeQueries({
        queryKey: [
          "student-attendance",
          studentId,
        ],
      });

      queryClient.removeQueries({
        queryKey: [
          "student-selected-subjects",
          studentId,
        ],
      });

      queryClient.removeQueries({
        queryKey: [
          "student-professors",
          studentId,
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: ["students"],
      });
    },
  });
}