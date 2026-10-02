import { apiClient } from "../client";
import type { Subject } from "../types";

/**
 * Get all subjects.
 *
 * Optional courseId filters subjects by course.
 * Optional semester filters subjects by semester.
 *
 * GET /api/subjects
 * GET /api/subjects?courseId={courseId}
 * GET /api/subjects?courseId={courseId}&semester={semester}
 */
export const getSubjects = async (
  courseId?: string,
  semester?: number,
): Promise<Subject[]> => {
  const response = await apiClient.get<Subject[]>(
    "/api/subjects",
    {
      params:
        courseId || semester !== undefined
          ? {
              ...(courseId
                ? { courseId }
                : {}),

              ...(semester !== undefined
                ? { semester }
                : {}),
            }
          : undefined,
    },
  );

  return response.data;
};

/**
 * Get a single subject by ID.
 *
 * GET /api/subjects/{id}
 */
export const getSubjectById = async (
  subjectId: string,
): Promise<Subject> => {
  const response = await apiClient.get<Subject>(
    `/api/subjects/${subjectId}`,
  );

  return response.data;
};

/**
 * Create a new subject.
 *
 * The backend requires a valid course
 * and semester.
 *
 * Expected body shape:
 * {
 *   "subjectId": "...",
 *   "subjectName": "...",
 *   "semester": 7,
 *   "course": {
 *     "courseId": "..."
 *   }
 * }
 */
export const createSubject = async (
  subject: Subject,
): Promise<Subject> => {
  const response = await apiClient.post<Subject>(
    "/api/subjects",
    subject,
  );

  return response.data;
};

/**
 * Update an existing subject.
 *
 * The backend takes the subject ID from the URL
 * and sets the request body's subjectId to that ID.
 */
export const updateSubject = async (
  subjectId: string,
  subject: Subject,
): Promise<Subject> => {
  const response = await apiClient.put<Subject>(
    `/api/subjects/${subjectId}`,
    subject,
  );

  return response.data;
};

/**
 * Delete a subject.
 *
 * Successful response:
 * 204 No Content
 *
 * Possible errors:
 * 404 Not Found
 * 409 Conflict
 */
export const deleteSubject = async (
  subjectId: string,
): Promise<void> => {
  await apiClient.delete(
    `/api/subjects/${subjectId}`,
  );
};