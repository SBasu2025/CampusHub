import { apiClient } from "../client";
import type { StaffAttendance } from "../types";

// ============================================================
// TYPES
// ============================================================

export type StaffAttendanceStatus = "Present" | "Absent";

/**
 * Create request for a PROFESSOR attendance record.
 *
 * IMPORTANT:
 * The backend requires exactly one owner:
 * - professor
 * OR
 * - admin
 *
 * Never send both.
 */
export interface ProfessorStaffAttendanceCreateRequest {
  professor: {
    profId: string;
  };
  day: string; // YYYY-MM-DD
  status: StaffAttendanceStatus;
}

/**
 * Create request for an ADMIN attendance record.
 *
 * IMPORTANT:
 * The backend requires exactly one owner:
 * - professor
 * OR
 * - admin
 *
 * Never send both.
 */
export interface AdminStaffAttendanceCreateRequest {
  admin: {
    adminId: string;
  };
  day: string; // YYYY-MM-DD
  status: StaffAttendanceStatus;
}

export type StaffAttendanceCreateRequest =
  | ProfessorStaffAttendanceCreateRequest
  | AdminStaffAttendanceCreateRequest;

export interface UpdateStaffAttendanceRequest {
  status: StaffAttendanceStatus;
}

// ============================================================
// BASIC RETRIEVAL
// ============================================================

/**
 * Get all staff attendance records.
 *
 * GET /api/staff-attendances
 *
 * ADMIN only.
 */
export const getStaffAttendances = async (): Promise<
  StaffAttendance[]
> => {
  const response = await apiClient.get<StaffAttendance[]>(
    "/api/staff-attendances",
  );

  return response.data;
};

/**
 * Get one staff attendance record by its attendance ID.
 *
 * IMPORTANT:
 * attendanceId contains '/'.
 *
 * Example:
 *   PROF001/KOL/260901
 *
 * Therefore it MUST be sent as a query parameter.
 *
 * GET /api/staff-attendances/by-id?attendanceId=...
 */
export const getStaffAttendanceById = async (
  attendanceId: string,
): Promise<StaffAttendance> => {
  const response = await apiClient.get<StaffAttendance>(
    "/api/staff-attendances/by-id",
    {
      params: {
        attendanceId,
      },
    },
  );

  return response.data;
};

// ============================================================
// PROFESSOR-WISE RETRIEVAL
// ============================================================

/**
 * Get all staff attendance records for one professor.
 *
 * GET /api/staff-attendances/professor/{profId}
 *
 * ADMIN + PROFESSOR
 */
export const getStaffAttendancesByProfessor = async (
  profId: string,
): Promise<StaffAttendance[]> => {
  const response = await apiClient.get<StaffAttendance[]>(
    `/api/staff-attendances/professor/${profId}`,
  );

  return response.data;
};

/**
 * Get the professor attendance report.
 *
 * The current backend returns StaffAttendance[].
 *
 * GET /api/staff-attendances/professor/{profId}/report
 *
 * ADMIN + PROFESSOR
 */
export const getProfessorStaffAttendanceReport = async (
  profId: string,
): Promise<StaffAttendance[]> => {
  const response = await apiClient.get<StaffAttendance[]>(
    `/api/staff-attendances/professor/${profId}/report`,
  );

  return response.data;
};

/**
 * Get one professor's attendance records for a
 * particular calendar date.
 *
 * day must be:
 *   YYYY-MM-DD
 *
 * GET /api/staff-attendances/professor/{profId}/date/{day}
 *
 * ADMIN + PROFESSOR
 */
export const getProfessorStaffAttendanceByDate = async (
  profId: string,
  day: string,
): Promise<StaffAttendance[]> => {
  const response = await apiClient.get<StaffAttendance[]>(
    `/api/staff-attendances/professor/${profId}/date/${day}`,
  );

  return response.data;
};

// ============================================================
// ADMIN-WISE RETRIEVAL
// ============================================================

/**
 * Get all staff attendance records for one admin.
 *
 * GET /api/staff-attendances/admin/{adminId}
 *
 * ADMIN only.
 */
export const getStaffAttendancesByAdmin = async (
  adminId: string,
): Promise<StaffAttendance[]> => {
  const response = await apiClient.get<StaffAttendance[]>(
    `/api/staff-attendances/admin/${adminId}`,
  );

  return response.data;
};

/**
 * Get the admin attendance report.
 *
 * GET /api/staff-attendances/admin/{adminId}/report
 *
 * ADMIN only.
 */
export const getAdminStaffAttendanceReport = async (
  adminId: string,
): Promise<StaffAttendance[]> => {
  const response = await apiClient.get<StaffAttendance[]>(
    `/api/staff-attendances/admin/${adminId}/report`,
  );

  return response.data;
};

/**
 * Get one admin's attendance records for a
 * particular calendar date.
 *
 * day must be:
 *   YYYY-MM-DD
 *
 * GET /api/staff-attendances/admin/{adminId}/date/{day}
 *
 * ADMIN only.
 */
export const getAdminStaffAttendanceByDate = async (
  adminId: string,
  day: string,
): Promise<StaffAttendance[]> => {
  const response = await apiClient.get<StaffAttendance[]>(
    `/api/staff-attendances/admin/${adminId}/date/${day}`,
  );

  return response.data;
};

// ============================================================
// DATE-WISE RETRIEVAL
// ============================================================

/**
 * Get all staff attendance records for a given date.
 *
 * day must be:
 *   YYYY-MM-DD
 *
 * GET /api/staff-attendances/date/{day}
 *
 * ADMIN only.
 */
export const getStaffAttendancesByDay = async (
  day: string,
): Promise<StaffAttendance[]> => {
  const response = await apiClient.get<StaffAttendance[]>(
    `/api/staff-attendances/date/${day}`,
  );

  return response.data;
};

/**
 * Get the staff attendance report for a given date.
 *
 * The current backend returns StaffAttendance[].
 *
 * GET /api/staff-attendances/date/{day}/report
 *
 * ADMIN only.
 */
export const getDateStaffAttendanceReport = async (
  day: string,
): Promise<StaffAttendance[]> => {
  const response = await apiClient.get<StaffAttendance[]>(
    `/api/staff-attendances/date/${day}/report`,
  );

  return response.data;
};

// ============================================================
// CREATE
// ============================================================

/**
 * Create a professor staff-attendance record.
 *
 * The frontend should use this form when the selected
 * staff member is a professor.
 *
 * The backend automatically generates:
 *
 *   <PROF_ID>/<CAMPUS>/<YYMMDD>
 *
 * as attendanceId.
 *
 * POST /api/staff-attendances
 */
export const createProfessorStaffAttendance = async (
  request: ProfessorStaffAttendanceCreateRequest,
): Promise<StaffAttendance> => {
  const response = await apiClient.post<StaffAttendance>(
    "/api/staff-attendances",
    request,
  );

  return response.data;
};

/**
 * Create an admin staff-attendance record.
 *
 * The backend automatically generates:
 *
 *   <ADMIN_ID>/<CAMPUS>/<YYMMDD>
 *
 * as attendanceId.
 *
 * POST /api/staff-attendances
 */
export const createAdminStaffAttendance = async (
  request: AdminStaffAttendanceCreateRequest,
): Promise<StaffAttendance> => {
  const response = await apiClient.post<StaffAttendance>(
    "/api/staff-attendances",
    request,
  );

  return response.data;
};

/**
 * Generic create helper.
 *
 * The discriminated union above ensures callers send
 * either professor OR admin, never both.
 */
export const createStaffAttendance = async (
  request: StaffAttendanceCreateRequest,
): Promise<StaffAttendance> => {
  const response = await apiClient.post<StaffAttendance>(
    "/api/staff-attendances",
    request,
  );

  return response.data;
};

// ============================================================
// UPDATE
// ============================================================

/**
 * Update the status of one staff-attendance record.
 *
 * IMPORTANT:
 * attendanceId contains '/'.
 *
 * Therefore:
 *
 * PUT /api/staff-attendances/by-id?attendanceId=...
 *
 * The backend expects JSON:
 *
 * {
 *   "status": "Present"
 * }
 *
 * and NOT a query parameter for status.
 */
export const updateStaffAttendance = async (
  attendanceId: string,
  status: StaffAttendanceStatus,
): Promise<StaffAttendance> => {
  const response = await apiClient.put<StaffAttendance>(
    "/api/staff-attendances/by-id",
    {
      status,
    },
    {
      params: {
        attendanceId,
      },
    },
  );

  return response.data;
};

// ============================================================
// DELETE
// ============================================================

/**
 * Delete one staff-attendance record.
 *
 * IMPORTANT:
 * attendanceId contains '/'.
 *
 * DELETE /api/staff-attendances/by-id?attendanceId=...
 *
 * Successful response:
 *   204 No Content
 */
export const deleteStaffAttendance = async (
  attendanceId: string,
): Promise<void> => {
  await apiClient.delete(
    "/api/staff-attendances/by-id",
    {
      params: {
        attendanceId,
      },
    },
  );
};