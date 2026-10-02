import { apiClient } from "../client";

import type {
  Attendance,
  AttendanceSummary,
  ClassSession,
  Professor,
  SelectsSubject,
  Student,
} from "../types";

// ============================================================
// PATH-SAFE ID HELPER
// ============================================================

/*
 * CampusHub IDs may contain URL-sensitive characters such as:
 *
 * #
 * %
 * ?
 * &
 * @
 * !
 * $
 *
 * In particular, "#" MUST be encoded because an unencoded "#"
 * starts the URL fragment and never reaches the backend as part
 * of the path.
 *
 * Example:
 *
 * STU_twkUUL079#
 *        ↓
 * STU_twkUUL079%23
 */
const encodePathSegment = (
  value: string,
): string =>
  encodeURIComponent(value);

// ============================================================
// GET STUDENTS
// ============================================================

/**
 * Get students.
 *
 * Any combination of the following filters may be supplied:
 * - courseId
 * - section
 * - semester
 *
 * GET /api/students
 * GET /api/students?courseId=...
 * GET /api/students?section=...
 * GET /api/students?semester=...
 * GET /api/students?courseId=...&section=...&semester=...
 */
export const getStudents = async (
  filters?: {
    courseId?: string;
    section?: string;
    semester?: number;
  },
): Promise<Student[]> => {

  const response =
    await apiClient.get<Student[]>(
      "/api/students",
      {
        params: filters,
      },
    );

  return response.data;
};

// ============================================================
// GET ONE STUDENT
// ============================================================

/**
 * Get one student by ID.
 *
 * GET /api/students/{id}
 */
export const getStudentById = async (
  studentId: string,
): Promise<Student> => {

  const response =
    await apiClient.get<Student>(
      `/api/students/${encodePathSegment(
        studentId,
      )}`,
    );

  return response.data;
};

// ============================================================
// GET STUDENT TIMETABLE
// ============================================================

/**
 * Get the student's timetable.
 *
 * Backend resolves this from:
 * Course + Section + Semester
 *
 * GET /api/students/{id}/timetable
 */
export const getStudentTimetable = async (
  studentId: string,
): Promise<ClassSession[]> => {

  const response =
    await apiClient.get<ClassSession[]>(
      `/api/students/${encodePathSegment(
        studentId,
      )}/timetable`,
    );

  return response.data;
};

// ============================================================
// GET STUDENT ATTENDANCE
// ============================================================

/**
 * Get all attendance records for a student.
 *
 * GET /api/students/{id}/attendance
 */
export const getStudentAttendance = async (
  studentId: string,
): Promise<Attendance[]> => {

  const response =
    await apiClient.get<Attendance[]>(
      `/api/students/${encodePathSegment(
        studentId,
      )}/attendance`,
    );

  return response.data;
};

// ============================================================
// GET STUDENT SUBJECT ATTENDANCE
// ============================================================

/**
 * Get attendance summary for one student
 * in one subject.
 *
 * GET /api/students/{id}/attendance/subject/{subjectId}
 */
export const getStudentSubjectAttendance =
  async (
    studentId: string,
    subjectId: string,
  ): Promise<AttendanceSummary> => {

    const response =
      await apiClient.get<AttendanceSummary>(
        `/api/students/${encodePathSegment(
          studentId,
        )}/attendance/subject/${encodePathSegment(
          subjectId,
        )}`,
      );

    return response.data;
  };

// ============================================================
// GET SELECTED SUBJECTS
// ============================================================

/**
 * Get subjects selected by a student.
 *
 * GET /api/students/{id}/selected-subjects
 */
export const getStudentSelectedSubjects =
  async (
    studentId: string,
  ): Promise<SelectsSubject[]> => {

    const response =
      await apiClient.get<SelectsSubject[]>(
        `/api/students/${encodePathSegment(
          studentId,
        )}/selected-subjects`,
      );

    return response.data;
  };

// ============================================================
// GET PROFESSORS FOR STUDENT
// ============================================================

/**
 * Get professors associated with the student's
 * selected subjects.
 *
 * GET /api/students/{id}/professors
 */
export const getProfessorsForStudent =
  async (
    studentId: string,
  ): Promise<Professor[]> => {

    const response =
      await apiClient.get<Professor[]>(
        `/api/students/${encodePathSegment(
          studentId,
        )}/professors`,
      );

    return response.data;
  };

// ============================================================
// CREATE STUDENT
// ============================================================

/**
 * Create a new student.
 *
 * IMPORTANT:
 * The backend automatically generates the student ID
 * for a new student. The frontend must NOT require the
 * admin to manually enter studentId.
 *
 * POST /api/students
 */
export const createStudent = async (
  student: Student,
): Promise<Student> => {

  const response =
    await apiClient.post<Student>(
      "/api/students",
      student,
    );

  return response.data;
};

// ============================================================
// UPDATE STUDENT
// ============================================================

/**
 * Update an existing student.
 *
 * PUT /api/students/{id}
 *
 * The backend forces the URL ID onto the entity.
 */
export const updateStudent = async (
  studentId: string,
  student: Student,
): Promise<Student> => {

  const response =
    await apiClient.put<Student>(
      `/api/students/${encodePathSegment(
        studentId,
      )}`,
      student,
    );

  return response.data;
};

// ============================================================
// PROMOTE STUDENT
// ============================================================

/**
 * Promote a student by one semester.
 *
 * PUT /api/students/{id}/promote
 */
export const promoteStudent = async (
  studentId: string,
): Promise<Student> => {

  const response =
    await apiClient.put<Student>(
      `/api/students/${encodePathSegment(
        studentId,
      )}/promote`,
    );

  return response.data;
};

// ============================================================
// ACTIVATE / DEACTIVATE STUDENT
// ============================================================

/**
 * Activate or deactivate a student.
 *
 * PATCH /api/students/{id}/status?active={true|false}
 */
export const setStudentActive = async (
  studentId: string,
  active: boolean,
): Promise<Student> => {

  const response =
    await apiClient.patch<Student>(
      `/api/students/${encodePathSegment(
        studentId,
      )}/status`,
      undefined,
      {
        params: {
          active,
        },
      },
    );

  return response.data;
};

// ============================================================
// DELETE STUDENT
// ============================================================

/**
 * Delete a student.
 *
 * DELETE /api/students/{id}
 *
 * Successful response:
 * 204 No Content
 */
export const deleteStudent = async (
  studentId: string,
): Promise<void> => {

  await apiClient.delete(
    `/api/students/${encodePathSegment(
      studentId,
    )}`,
  );
};