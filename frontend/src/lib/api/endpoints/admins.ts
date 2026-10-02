import { apiClient } from "../client";
import type {
  Admin,
  Attendance,
  DashboardAnalytics,
  StaffAttendance,
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
 * In particular, "#" starts a URL fragment when it is not encoded.
 *
 * Example:
 *
 * ADMIN_yuaIZQ830#
 *        ↓
 * ADMIN_yuaIZQ830%23
 *
 * The backend then receives the complete ID:
 *
 * ADMIN_yuaIZQ830#
 */
const encodePathSegment = (
  value: string,
): string =>
  encodeURIComponent(value);

// ============================================================
// REQUEST TYPES
// ============================================================

/**
 * Create Admin request.
 *
 * IMPORTANT:
 * adminId is intentionally NOT included.
 *
 * AdminService.saveAdmin() generates the ID automatically
 * for a new admin.
 *
 * phoneNumber is stored on the account and is used for
 * OTP-based login.
 */
export interface CreateAdminRequest {
  adminName: string;
  phoneNumber: string;
}

/**
 * Update Admin request.
 *
 * The backend updates:
 * - adminName
 * - phoneNumber
 *
 * The existing active/inactive state is preserved.
 */
export interface UpdateAdminRequest {
  adminName: string;
  phoneNumber: string;
}

export type AdminStaffAttendanceStatus =
  | "Present"
  | "Absent";

/**
 * Create staff-attendance request for a PROFESSOR.
 *
 * Exactly one of professor/admin must be supplied.
 */
export interface ProfessorStaffAttendanceRequest {
  professor: {
    profId: string;
  };
  day: string; // YYYY-MM-DD
  status: AdminStaffAttendanceStatus;
}

/**
 * Create staff-attendance request for an ADMIN.
 *
 * Exactly one of professor/admin must be supplied.
 */
export interface AdminStaffAttendanceRequest {
  admin: {
    adminId: string;
  };
  day: string; // YYYY-MM-DD
  status: AdminStaffAttendanceStatus;
}

export type CreateStaffAttendanceRequest =
  | ProfessorStaffAttendanceRequest
  | AdminStaffAttendanceRequest;

// ============================================================
// ADMIN ACCOUNT RETRIEVAL
// ============================================================

/**
 * Get all Admin accounts.
 *
 * GET /api/admins
 */
export const getAdmins = async (): Promise<Admin[]> => {
  const response =
    await apiClient.get<Admin[]>(
      "/api/admins",
    );

  return response.data;
};

/**
 * Get one Admin account by ID.
 *
 * GET /api/admins/{id}
 */
export const getAdminById = async (
  adminId: string,
): Promise<Admin> => {
  const response =
    await apiClient.get<Admin>(
      `/api/admins/${encodePathSegment(
        adminId,
      )}`,
    );

  return response.data;
};

// ============================================================
// ADMIN ACCOUNT CREATE / UPDATE
// ============================================================

/**
 * Create a new Admin account.
 *
 * POST /api/admins
 *
 * Expected body:
 * {
 *   "adminName": "...",
 *   "phoneNumber": "..."
 * }
 *
 * The backend generates adminId automatically
 * and makes the new account active.
 */
export const createAdmin = async (
  request: CreateAdminRequest,
): Promise<Admin> => {
  const response =
    await apiClient.post<Admin>(
      "/api/admins",
      request,
    );

  return response.data;
};

/**
 * Update an Admin account.
 *
 * PUT /api/admins/{id}
 *
 * The backend:
 * - uses the ID from the URL
 * - updates adminName
 * - updates phoneNumber
 * - preserves active/inactive state
 */
export const updateAdmin = async (
  adminId: string,
  request: UpdateAdminRequest,
): Promise<Admin> => {
  const response =
    await apiClient.put<Admin>(
      `/api/admins/${encodePathSegment(
        adminId,
      )}`,
      request,
    );

  return response.data;
};

/**
 * Activate or deactivate an Admin account.
 *
 * PATCH /api/admins/{id}/status?active={true|false}
 */
export const setAdminActive = async (
  adminId: string,
  active: boolean,
): Promise<Admin> => {
  const response =
    await apiClient.patch<Admin>(
      `/api/admins/${encodePathSegment(
        adminId,
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

/**
 * Delete an Admin account.
 *
 * DELETE /api/admins/{id}
 *
 * Successful response:
 * 204 No Content
 */
export const deleteAdmin = async (
  adminId: string,
): Promise<void> => {
  await apiClient.delete(
    `/api/admins/${encodePathSegment(
      adminId,
    )}`,
  );
};

// ============================================================
// ADMIN DASHBOARD ANALYTICS
// ============================================================

/**
 * Get institution-wide dashboard analytics.
 *
 * GET /api/admins/dashboard/analytics
 *
 * Used by the Admin Dashboard KPI cards and the
 * institution-wide attendance donut.
 */
export const getDashboardAnalytics =
  async (): Promise<DashboardAnalytics> => {
    const response =
      await apiClient.get<DashboardAnalytics>(
        "/api/admins/dashboard/analytics",
      );

    return response.data;
  };

// ============================================================
// ATTENDANCE OVERSIGHT
// ============================================================

/**
 * Get all attendance records for one class session.
 *
 * GET /api/admins/attendance/session/{sessionId}
 */
export const getAdminAttendanceBySession =
  async (
    sessionId: string,
  ): Promise<Attendance[]> => {
    const response =
      await apiClient.get<Attendance[]>(
        `/api/admins/attendance/session/${encodePathSegment(
          sessionId,
        )}`,
      );

    return response.data;
  };

/**
 * Get all attendance records for one subject.
 *
 * GET /api/admins/attendance/subject/{subjectId}
 */
export const getAdminAttendanceBySubject =
  async (
    subjectId: string,
  ): Promise<Attendance[]> => {
    const response =
      await apiClient.get<Attendance[]>(
        `/api/admins/attendance/subject/${encodePathSegment(
          subjectId,
        )}`,
      );

    return response.data;
  };

/**
 * Get all attendance records for one course.
 *
 * GET /api/admins/attendance/course/{courseId}
 */
export const getAdminAttendanceByCourse =
  async (
    courseId: string,
  ): Promise<Attendance[]> => {
    const response =
      await apiClient.get<Attendance[]>(
        `/api/admins/attendance/course/${encodePathSegment(
          courseId,
        )}`,
      );

    return response.data;
  };

/**
 * Get all attendance records for one student.
 *
 * GET /api/admins/attendance/student/{studentId}
 */
export const getAdminAttendanceByStudent =
  async (
    studentId: string,
  ): Promise<Attendance[]> => {
    const response =
      await apiClient.get<Attendance[]>(
        `/api/admins/attendance/student/${encodePathSegment(
          studentId,
        )}`,
      );

    return response.data;
  };

/**
 * Get one attendance record by its composite key:
 *
 *   sessionId + studentId
 *
 * GET /api/admins/attendance/{sessionId}/{studentId}
 */
export const getAdminAttendanceById =
  async (
    sessionId: string,
    studentId: string,
  ): Promise<Attendance> => {
    const response =
      await apiClient.get<Attendance>(
        `/api/admins/attendance/${encodePathSegment(
          sessionId,
        )}/${encodePathSegment(
          studentId,
        )}`,
      );

    return response.data;
  };

/**
 * Correct an existing attendance record.
 *
 * IMPORTANT:
 * The backend receives status as a REQUEST PARAMETER,
 * not as a JSON body.
 *
 * PUT /api/admins/attendance/{sessionId}/{studentId}?status=
 */
export const correctAttendance = async (
  sessionId: string,
  studentId: string,
  status: "Present" | "Absent",
): Promise<Attendance> => {
  const response =
    await apiClient.put<Attendance>(
      `/api/admins/attendance/${encodePathSegment(
        sessionId,
      )}/${encodePathSegment(
        studentId,
      )}`,
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
// ADMIN-SIDE STAFF ATTENDANCE
// ============================================================

/**
 * Get staff attendance records.
 *
 * The backend supports ONE effective filter at a time:
 *
 *   profId
 *   adminId
 *   day
 *
 * The controller checks them in this order:
 *
 *   profId -> adminId -> day -> all
 *
 * Therefore, the frontend should normally provide only
 * one filter at a time.
 *
 * GET /api/admins/staff-attendance
 * GET /api/admins/staff-attendance?profId=...
 * GET /api/admins/staff-attendance?adminId=...
 * GET /api/admins/staff-attendance?day=...
 */
export const getAdminStaffAttendance = async (
  filter?: {
    profId?: string;
    adminId?: string;
    day?: string;
  },
): Promise<StaffAttendance[]> => {
  const response =
    await apiClient.get<StaffAttendance[]>(
      "/api/admins/staff-attendance",
      {
        params: filter,
      },
    );

  return response.data;
};

/**
 * Mark one staff member's attendance.
 *
 * POST /api/admins/staff-attendance
 *
 * The request must contain:
 *
 *   professor OR admin
 *
 * never both.
 *
 * day:
 *   YYYY-MM-DD
 *
 * status:
 *   "Present" | "Absent"
 *
 * The backend generates attendanceId automatically.
 */
export const markStaffAttendance = async (
  request: CreateStaffAttendanceRequest,
): Promise<StaffAttendance> => {
  const response =
    await apiClient.post<StaffAttendance>(
      "/api/admins/staff-attendance",
      request,
    );

  return response.data;
};