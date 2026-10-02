import {
  apiClient,
} from "../client";

import type {
  ClassSession,
} from "../types";

// ============================================================
// REQUEST TYPES
// ============================================================
//
// The backend returns a fully nested ClassSession.
//
// Requests do NOT need to contain the full nested Course,
// Teaching, Professor, Subject, etc.
//
// Only the identifying relationship data is sent.
// ============================================================

export interface ClassSessionCreateRequest {
  /**
   * Frontend-generated ID.
   *
   * Format:
   * CS + YYMMDD + NN
   */
  sessionId: string;

  course: {
    courseId: string;
  };

  teaching: {
    id: {
      profId: string;
      subjectId: string;
    };
  };

  semester: number;

  section: string;

  /**
   * Actual calendar date.
   *
   * MUST be:
   * YYYY-MM-DD
   */
  day: string;

  /**
   * LocalTime serialized by Jackson.
   *
   * MUST be:
   * HH:mm:ss
   */
  startTime: string;

  /**
   * LocalTime serialized by Jackson.
   *
   * MUST be:
   * HH:mm:ss
   */
  endTime: string;
}

// ============================================================
// UPDATE REQUEST
// ============================================================
//
// ClassSessionController's update endpoint only permits:
//
// day
// startTime
// endTime
//
// Course, professor, subject, semester and section are not
// editable through this endpoint.
// ============================================================

export interface ClassSessionUpdateRequest {
  day?: string;

  startTime?: string;

  endTime?: string;
}

// ============================================================
// GET ALL
// ============================================================

export const getClassSessions =
  async (
    filter?: {
      courseId?: string;

      section?: string;

      semester?: number;

      profId?: string;
    },
  ): Promise<ClassSession[]> => {
    const response =
      await apiClient.get<
        ClassSession[]
      >(
        "/api/class-sessions",
        {
          params: filter,
        },
      );

    return response.data;
  };

// ============================================================
// GET ONE
// ============================================================

export const getClassSessionById =
  async (
    sessionId: string,
  ): Promise<ClassSession> => {
    const response =
      await apiClient.get<ClassSession>(
        `/api/class-sessions/${sessionId}`,
      );

    return response.data;
  };

// ============================================================
// CREATE
// ============================================================
//
// POST /api/class-sessions
//
// The frontend generates sessionId.
//
// Example:
//
// {
//   "sessionId": "CS26091901",
//   "course": {
//     "courseId": "CSE001"
//   },
//   "teaching": {
//     "id": {
//       "profId": "PROF_abcXYZ123@",
//       "subjectId": "DBMS001"
//     }
//   },
//   "semester": 7,
//   "section": "A",
//   "day": "2026-09-19",
//   "startTime": "09:15:00",
//   "endTime": "10:15:00"
// }
// ============================================================

export const createClassSession =
  async (
    classSession: ClassSessionCreateRequest,
  ): Promise<ClassSession> => {
    const response =
      await apiClient.post<ClassSession>(
        "/api/class-sessions",
        classSession,
      );

    return response.data;
  };

// ============================================================
// UPDATE
// ============================================================
//
// PUT /api/class-sessions/{id}
//
// IMPORTANT:
// The backend expects the editable fields as request
// parameters, not as a JSON replacement object.
// ============================================================

export const updateClassSession =
  async (
    sessionId: string,

    changes: ClassSessionUpdateRequest,
  ): Promise<ClassSession> => {
    const response =
      await apiClient.put<ClassSession>(
        `/api/class-sessions/${sessionId}`,

        undefined,

        {
          params: changes,
        },
      );

    return response.data;
  };

// ============================================================
// DELETE
// ============================================================
//
// DELETE /api/class-sessions/{id}
//
// The backend removes the session's attendance records first.
// ============================================================

export const deleteClassSession =
  async (
    sessionId: string,
  ): Promise<void> => {
    await apiClient.delete(
      `/api/class-sessions/${sessionId}`,
    );
  };