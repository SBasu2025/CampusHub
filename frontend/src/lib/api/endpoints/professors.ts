import { apiClient } from "../client";
import type {
  Attendance,
  AttendanceSummary,
  ClassSession,
  Professor,
  StaffAttendance,
  Student,
  Teaching,
} from "../types";

/**
 * Encode a dynamic value before placing it inside
 * a URL path.
 *
 * This is important because CampusHub IDs can contain
 * URL-reserved characters such as #, ?, %, &, etc.
 */
const encodePathSegment = (
  value: string,
): string => encodeURIComponent(value);

// ============================================================
// GET ALL PROFESSORS
// ============================================================

/**
 * Get all professors.
 *
 * Optional departmentId filters professors by department.
 *
 * GET /api/professors
 * GET /api/professors?departmentId={departmentId}
 */
export const getProfessors = async (
  departmentId?: string,
): Promise<Professor[]> => {
  const response =
    await apiClient.get<Professor[]>(
      "/api/professors",
      {
        params: departmentId
          ? { departmentId }
          : undefined,
      },
    );

  return response.data;
};

// ============================================================
// GET PROFESSOR BY ID
// ============================================================

/**
 * Get a professor by ID.
 *
 * GET /api/professors/{id}
 */
export const getProfessorById =
  async (
    professorId: string,
  ): Promise<Professor> => {
    const response =
      await apiClient.get<Professor>(
        `/api/professors/${encodePathSegment(
          professorId,
        )}`,
      );

    return response.data;
  };

// ============================================================
// GET PROFESSOR SUBJECTS
// ============================================================

/**
 * Get teaching assignments for a professor.
 *
 * GET /api/professors/{id}/subjects
 */
export const getProfessorSubjects =
  async (
    professorId: string,
  ): Promise<Teaching[]> => {
    const response =
      await apiClient.get<Teaching[]>(
        `/api/professors/${encodePathSegment(
          professorId,
        )}/subjects`,
      );

    return response.data;
  };

// ============================================================
// GET PROFESSOR TIMETABLE
// ============================================================

/**
 * Get a professor's timetable.
 *
 * GET /api/professors/{id}/timetable
 */
export const getProfessorTimetable =
  async (
    professorId: string,
  ): Promise<ClassSession[]> => {
    const response =
      await apiClient.get<ClassSession[]>(
        `/api/professors/${encodePathSegment(
          professorId,
        )}/timetable`,
      );

    return response.data;
  };

// ============================================================
// GET PROFESSOR STAFF ATTENDANCE
// ============================================================

/**
 * Get a professor's own staff-attendance records.
 *
 * GET /api/professors/{id}/staff-attendance
 */
export const getProfessorStaffAttendance =
  async (
    professorId: string,
  ): Promise<StaffAttendance[]> => {
    const response =
      await apiClient.get<StaffAttendance[]>(
        `/api/professors/${encodePathSegment(
          professorId,
        )}/staff-attendance`,
      );

    return response.data;
  };

// ============================================================
// GET STUDENTS FOR CLASS SESSION
// ============================================================

/**
 * Get students belonging to a professor's class session.
 *
 * GET /api/professors/{id}/sessions/{sessionId}/students
 */
export const getStudentsForClassSession =
  async (
    professorId: string,
    sessionId: string,
  ): Promise<Student[]> => {
    const response =
      await apiClient.get<Student[]>(
        `/api/professors/${encodePathSegment(
          professorId,
        )}/sessions/${encodePathSegment(
          sessionId,
        )}/students`,
      );

    return response.data;
  };

// ============================================================
// GET SESSION COUNT
// ============================================================

/**
 * Get the number of sessions conducted for one subject
 * by the professor.
 *
 * GET /api/professors/{id}/subjects/{subjectId}/session-count
 */
export const getSessionCountForSubject =
  async (
    professorId: string,
    subjectId: string,
  ): Promise<number> => {
    const response =
      await apiClient.get<number>(
        `/api/professors/${encodePathSegment(
          professorId,
        )}/subjects/${encodePathSegment(
          subjectId,
        )}/session-count`,
      );

    return response.data;
  };

// ============================================================
// GET SUBJECT ATTENDANCE
// ============================================================

/**
 * Get attendance summary for one subject taught by
 * the professor.
 *
 * GET /api/professors/{id}/subjects/{subjectId}/attendance
 */
export const getProfessorSubjectAttendance =
  async (
    professorId: string,
    subjectId: string,
  ): Promise<AttendanceSummary[]> => {
    const response =
      await apiClient.get<AttendanceSummary[]>(
        `/api/professors/${encodePathSegment(
          professorId,
        )}/subjects/${encodePathSegment(
          subjectId,
        )}/attendance`,
      );

    return response.data;
  };

// ============================================================
// CREATE PROFESSOR
// ============================================================

/**
 * Create a professor.
 *
 * POST /api/professors
 *
 * The backend generates the professor ID.
 *
 * Any duplicate phone-number error from the backend
 * is allowed to propagate through Axios unchanged so
 * the UI can display the actual message.
 */
export const createProfessor =
  async (
    professor: Professor,
  ): Promise<Professor> => {
    const response =
      await apiClient.post<Professor>(
        "/api/professors",
        professor,
      );

    return response.data;
  };

// ============================================================
// UPDATE PROFESSOR
// ============================================================

/**
 * Update a professor.
 *
 * PUT /api/professors/{id}
 */
export const updateProfessor =
  async (
    professorId: string,
    professor: Professor,
  ): Promise<Professor> => {
    const response =
      await apiClient.put<Professor>(
        `/api/professors/${encodePathSegment(
          professorId,
        )}`,
        professor,
      );

    return response.data;
  };

// ============================================================
// ACTIVATE / DEACTIVATE PROFESSOR
// ============================================================

/**
 * Activate or deactivate a professor.
 *
 * PATCH /api/professors/{id}/status?active={true|false}
 */
export const setProfessorActive =
  async (
    professorId: string,
    active: boolean,
  ): Promise<Professor> => {
    const response =
      await apiClient.patch<Professor>(
        `/api/professors/${encodePathSegment(
          professorId,
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
// DELETE PROFESSOR
// ============================================================

/**
 * Delete a professor.
 *
 * IMPORTANT:
 *
 * Professor IDs may contain URL-reserved characters such as
 * '%' or '#'.
 *
 * Therefore deletion uses the safe query-parameter endpoint:
 *
 * DELETE /api/professors/delete?id={professorId}
 *
 * Example:
 *
 * PROF_ngyCYO772%
 *
 * becomes a query parameter and is encoded by Axios.
 */
export const deleteProfessor =
  async (
    professorId: string,
  ): Promise<void> => {
    await apiClient.delete(
      "/api/professors/delete",
      {
        params: {
          id: professorId,
        },
      },
    );
  };

// ============================================================
// MARK ATTENDANCE
// ============================================================

/**
 * Mark attendance for one student in one class session.
 *
 * POST /api/professors/{profId}/sessions/{sessionId}/attendance
 *      ?studentId={studentId}&status={status}
 *
 * The backend expects studentId and status as request parameters,
 * NOT as a JSON request body.
 */
export const markAttendance =
  async (
    professorId: string,
    sessionId: string,
    studentId: string,
    status:
      | "Present"
      | "Absent",
  ): Promise<Attendance> => {
    const response =
      await apiClient.post<Attendance>(
        `/api/professors/${encodePathSegment(
          professorId,
        )}/sessions/${encodePathSegment(
          sessionId,
        )}/attendance`,
        undefined,
        {
          params: {
            studentId,
            status,
          },
        },
      );

    return response.data;
  };