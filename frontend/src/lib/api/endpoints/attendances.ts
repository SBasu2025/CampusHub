import { apiClient } from "../client";
import type { Attendance } from "../types";

// ============================================================
// REQUEST TYPES
// ============================================================

export interface CreateAttendanceRequest {
  classSession: {
    sessionId: string;
  };

  student: {
    studentId: string;
  };

  status: "Present" | "Absent";
}

export interface UpdateAttendanceRequest {
  status: "Present" | "Absent";
}

// ============================================================
// GET
// ============================================================

/**
 * Get attendance records.
 *
 * The backend accepts these optional filters:
 *
 *   studentId
 *   sessionId
 *   subjectId
 *   courseId
 *
 * IMPORTANT:
 * The backend checks them in this order:
 *
 *   studentId
 *   -> sessionId
 *   -> subjectId
 *   -> courseId
 *
 * Therefore, these filters are NOT combined server-side.
 * The frontend should normally provide only one filter here.
 *
 * GET /api/attendances
 * GET /api/attendances?studentId=...
 * GET /api/attendances?sessionId=...
 * GET /api/attendances?subjectId=...
 * GET /api/attendances?courseId=...
 */
export const getAttendances = async (filter?: {
  studentId?: string;
  sessionId?: string;
  subjectId?: string;
  courseId?: string;
}): Promise<Attendance[]> => {
  const response = await apiClient.get<Attendance[]>(
    "/api/attendances",
    {
      params: filter,
    },
  );

  return response.data;
};

/**
 * Get one attendance record using its composite key:
 *
 *   sessionId + studentId
 *
 * GET /api/attendances/{sessionId}/{studentId}
 */
export const getAttendanceById = async (
  sessionId: string,
  studentId: string,
): Promise<Attendance> => {
  const response = await apiClient.get<Attendance>(
    `/api/attendances/${sessionId}/${studentId}`,
  );

  return response.data;
};

// ============================================================
// CREATE
// ============================================================

/**
 * Create an attendance record.
 *
 * The backend requires:
 *
 *   classSession.sessionId
 *   student.studentId
 *   status
 *
 * The service then resolves the actual ClassSession and Student
 * from the database and constructs the composite AttendanceId.
 *
 * POST /api/attendances
 *
 * IMPORTANT:
 * status must be written exactly as:
 *
 *   "Present"
 *   "Absent"
 *
 * even though the backend comparison itself is
 * case-insensitive.
 */
export const createAttendance = async (
  attendance: CreateAttendanceRequest,
): Promise<Attendance> => {
  const response = await apiClient.post<Attendance>(
    "/api/attendances",
    attendance,
  );

  return response.data;
};

// ============================================================
// UPDATE
// ============================================================

/**
 * Update an existing attendance record.
 *
 * The backend accepts status as a request parameter,
 * NOT as a JSON request body.
 *
 * PUT /api/attendances/{sessionId}/{studentId}?status=
 */
export const updateAttendance = async (
  sessionId: string,
  studentId: string,
  status: "Present" | "Absent",
): Promise<Attendance> => {
  const response = await apiClient.put<Attendance>(
    `/api/attendances/${sessionId}/${studentId}`,
    undefined,
    {
      params: {
        status,
      },
    },
  );

  return response.data;
};

// ============================================================
// DELETE
// ============================================================

/**
 * Delete one attendance record.
 *
 * DELETE /api/attendances/{sessionId}/{studentId}
 *
 * Successful response:
 *   204 No Content
 */
export const deleteAttendance = async (
  sessionId: string,
  studentId: string,
): Promise<void> => {
  await apiClient.delete(
    `/api/attendances/${sessionId}/${studentId}`,
  );
};