import { apiClient } from "../client";
import type { SelectsSubject } from "../types";

export interface CreateSelectsSubjectRequest {
  student: {
    studentId: string;
  };
  subject: {
    subjectId: string;
  };
}

/**
 * Get all student-subject selections.
 *
 * GET /api/selects-subjects
 */
export const getSelectsSubjects =
  async (): Promise<
    SelectsSubject[]
  > => {
    const response =
      await apiClient.get<
        SelectsSubject[]
      >("/api/selects-subjects");

    return response.data;
  };

/**
 * Get all subjects selected by one student.
 *
 * GET /api/selects-subjects/student/{studentId}
 */
export const getSelectsSubjectsByStudent =
  async (
    studentId: string,
  ): Promise<SelectsSubject[]> => {
    const response =
      await apiClient.get<
        SelectsSubject[]
      >(
        `/api/selects-subjects/student/${studentId}`,
      );

    return response.data;
  };

/**
 * Get one student-subject selection.
 *
 * Composite ID:
 * student ID + subject ID
 *
 * GET /api/selects-subjects/{studentId}/{subjectId}
 */
export const getSelectsSubjectById =
  async (
    studentId: string,
    subjectId: string,
  ): Promise<SelectsSubject> => {
    const response =
      await apiClient.get<SelectsSubject>(
        `/api/selects-subjects/${studentId}/${subjectId}`,
      );

    return response.data;
  };

/**
 * Select a subject for a student.
 *
 * Expected backend body:
 * {
 *   "student": {
 *     "studentId": "..."
 *   },
 *   "subject": {
 *     "subjectId": "..."
 *   }
 * }
 *
 * POST /api/selects-subjects
 */
export const createSelectsSubject =
  async (
    selectsSubject: CreateSelectsSubjectRequest,
  ): Promise<SelectsSubject> => {
    const response =
      await apiClient.post<SelectsSubject>(
        "/api/selects-subjects",
        selectsSubject,
      );

    return response.data;
  };

/**
 * Delete a student's selected subject.
 *
 * DELETE /api/selects-subjects/{studentId}/{subjectId}
 *
 * Successful response:
 * 204 No Content
 */
export const deleteSelectsSubject =
  async (
    studentId: string,
    subjectId: string,
  ): Promise<void> => {
    await apiClient.delete(
      `/api/selects-subjects/${studentId}/${subjectId}`,
    );
  };