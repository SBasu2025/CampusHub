import { apiClient } from "../client";
import type { Teaching } from "../types";

/**
 * Get all teaching assignments.
 *
 * GET /api/teachings
 */
export const getTeachings = async (): Promise<Teaching[]> => {
  const response = await apiClient.get<Teaching[]>(
    "/api/teachings",
  );

  return response.data;
};

/**
 * Get all teaching assignments for one professor.
 *
 * GET /api/teachings/professor/{profId}
 */
export const getTeachingsByProfessor = async (
  profId: string,
): Promise<Teaching[]> => {
  const response = await apiClient.get<Teaching[]>(
    `/api/teachings/professor/${profId}`,
  );

  return response.data;
};

/**
 * Get all teaching assignments for one subject.
 *
 * GET /api/teachings/subject/{subjectId}
 */
export const getTeachingsBySubject = async (
  subjectId: string,
): Promise<Teaching[]> => {
  const response = await apiClient.get<Teaching[]>(
    `/api/teachings/subject/${subjectId}`,
  );

  return response.data;
};

/**
 * Get one teaching assignment.
 *
 * Composite ID:
 * professor ID + subject ID
 *
 * GET /api/teachings/{profId}/{subjectId}
 */
export const getTeachingById = async (
  profId: string,
  subjectId: string,
): Promise<Teaching> => {
  const response = await apiClient.get<Teaching>(
    `/api/teachings/${profId}/${subjectId}`,
  );

  return response.data;
};

/**
 * Create a new teaching assignment.
 *
 * Expected backend body:
 * {
 *   "professor": {
 *     "profId": "..."
 *   },
 *   "subject": {
 *     "subjectId": "..."
 *   }
 * }
 *
 * The backend resolves the complete Professor and Subject
 * entities and generates the composite TeachingId.
 *
 * POST /api/teachings
 */
export const createTeaching = async (
  teaching: Teaching,
): Promise<Teaching> => {
  const response = await apiClient.post<Teaching>(
    "/api/teachings",
    teaching,
  );

  return response.data;
};

/**
 * Reassign an existing subject from one professor
 * to another professor.
 *
 * IMPORTANT:
 * The backend also migrates existing ClassSession records
 * from the old Teaching record to the newly-created
 * Teaching record.
 *
 * PUT /api/teachings/reassign
 *
 * Request parameters:
 * oldProfId
 * subjectId
 * newProfId
 */
export const reassignProfessor = async (
  oldProfId: string,
  subjectId: string,
  newProfId: string,
): Promise<Teaching> => {
  const response = await apiClient.put<Teaching>(
    "/api/teachings/reassign",
    undefined,
    {
      params: {
        oldProfId,
        subjectId,
        newProfId,
      },
    },
  );

  return response.data;
};

/**
 * Delete a teaching assignment.
 *
 * DELETE /api/teachings/{profId}/{subjectId}
 *
 * Successful response:
 * 204 No Content
 */
export const deleteTeaching = async (
  profId: string,
  subjectId: string,
): Promise<void> => {
  await apiClient.delete(
    `/api/teachings/${profId}/${subjectId}`,
  );
};