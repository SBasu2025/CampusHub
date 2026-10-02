import { apiClient } from "../client";

import type {
  Examination,
  ExamType,
} from "../types";

// ============================================================
// REQUEST TYPES
// ============================================================

/**
 * Request body for creating a single examination.
 *
 * The backend resolves the related Subject and Professor
 * using their IDs.
 *
 * examId IS required for the single-create endpoint.
 */
export interface CreateExaminationRequest {
  examId: string;

  subject: {
    subjectId: string;
  };

  semester: number;

  /**
   * Section configured by the administrator for this
   * examination.
   *
   * The professor-side marks workflow uses this value as
   * the authoritative student section.
   */
  section: string;

  examType: ExamType;

  /**
   * Required for INTERNAL.
   * Must be null for FINAL.
   */
  internalNumber: number | null;

  maxMarks: number;

  professor: {
    profId: string;
  };
}

/**
 * Request body for updating one examination.
 *
 * The backend replaces examId using the path variable,
 * so the request body does not need to contain examId.
 */
export interface UpdateExaminationRequest {
  subject: {
    subjectId: string;
  };

  semester: number;

  /**
   * Section configured by the administrator.
   *
   * This is preserved when an examination is edited unless
   * the backend explicitly permits changing it.
   */
  section: string;

  examType: ExamType;

  /**
   * Required for INTERNAL.
   * Must be null for FINAL.
   */
  internalNumber: number | null;

  maxMarks: number;

  professor: {
    profId: string;
  };
}

/**
 * Bulk examination configuration request.
 *
 * The backend creates:
 *
 *   INTERNAL 1
 *   INTERNAL 2
 *   ...
 *   INTERNAL N
 *   FINAL
 *
 * and generates the exam IDs itself.
 */
export interface ConfigureExaminationsRequest {
  subjectId: string;

  semester: number;

  /**
   * Section that this entire examination configuration
   * belongs to.
   *
   * Example:
   *   "A"
   */
  section: string;

  numberOfInternals: number;

  internalMaxMarks: number;

  finalMaxMarks: number;

  /**
   * Must contain exactly one professor ID for
   * every internal examination.
   *
   * Example:
   *
   * numberOfInternals = 3
   * internalProfessorIds = [
   *   prof1,
   *   prof2,
   *   prof3
   * ]
   */
  internalProfessorIds: string[];

  /**
   * Professor assigned to the Final examination.
   */
  finalProfessorId: string;
}

// ============================================================
// RETRIEVAL
// ============================================================

/**
 * Get every examination.
 *
 * GET /api/examinations
 *
 * ADMIN + PROFESSOR
 */
export const getExaminations =
  async (): Promise<Examination[]> => {
    const response =
      await apiClient.get<Examination[]>(
        "/api/examinations",
      );

    return response.data;
  };

/**
 * Get one examination.
 *
 * GET /api/examinations/{examId}
 */
export const getExaminationById =
  async (
    examId: string,
  ): Promise<Examination> => {
    const response =
      await apiClient.get<Examination>(
        `/api/examinations/${examId}`,
      );

    return response.data;
  };

/**
 * Get examinations assigned to one professor.
 *
 * GET /api/examinations/professor/{profId}
 *
 * Used by professor-side examination views
 * and workflows.
 *
 * The backend should use the authenticated professor
 * for authorization when accessing actual marks/students.
 */
export const getExaminationsByProfessor =
  async (
    profId: string,
  ): Promise<Examination[]> => {
    const response =
      await apiClient.get<Examination[]>(
        `/api/examinations/professor/${encodeURIComponent(
          profId,
        )}`,
      );

    return response.data;
  };

/**
 * Get examinations assigned to one professor
 * for one subject.
 *
 * GET /api/examinations/professor/{profId}/subject/{subjectId}
 */
export const getExaminationsByProfessorAndSubject =
  async (
    profId: string,
    subjectId: string,
  ): Promise<Examination[]> => {
    const response =
      await apiClient.get<Examination[]>(
        `/api/examinations/professor/${encodeURIComponent(
          profId,
        )}/subject/${encodeURIComponent(
          subjectId,
        )}`,
      );

    return response.data;
  };

/**
 * Get examinations configured for one subject
 * and semester.
 *
 * GET /api/examinations/subject/{subjectId}/semester/{semester}
 *
 * The backend orders the result by internalNumber.
 * The Final examination naturally appears after
 * the Internals.
 */
export const getExaminationsBySubjectAndSemester =
  async (
    subjectId: string,
    semester: number,
  ): Promise<Examination[]> => {
    const response =
      await apiClient.get<Examination[]>(
        `/api/examinations/subject/${encodeURIComponent(
          subjectId,
        )}/semester/${semester}`,
      );

    return response.data;
  };

// ============================================================
// BULK CONFIGURATION
// ============================================================

/**
 * Configure all examinations for one
 * Subject + Semester + Section.
 *
 * POST /api/examinations/configure
 *
 * The backend creates:
 *
 *   Internal 1
 *   Internal 2
 *   ...
 *   Internal N
 *   Final
 *
 * and generates all exam IDs.
 *
 * IMPORTANT:
 * The frontend must NOT send exam IDs here.
 *
 * The section is part of the configuration because
 * an examination must belong to a specific student section.
 */
export const configureExaminations =
  async (
    request: ConfigureExaminationsRequest,
  ): Promise<Examination[]> => {
    const response =
      await apiClient.post<Examination[]>(
        "/api/examinations/configure",
        request,
      );

    return response.data;
  };

// ============================================================
// SINGLE EXAMINATION CREATE
// ============================================================

/**
 * Create one examination manually.
 *
 * POST /api/examinations
 *
 * Unlike the bulk configuration endpoint,
 * this endpoint requires the frontend to supply examId.
 */
export const createExamination =
  async (
    request: CreateExaminationRequest,
  ): Promise<Examination> => {
    const response =
      await apiClient.post<Examination>(
        "/api/examinations",
        request,
      );

    return response.data;
  };

// ============================================================
// UPDATE
// ============================================================

/**
 * Update one examination.
 *
 * PUT /api/examinations/{examId}
 *
 * The backend forces the path examId onto the entity.
 *
 * Section is included because it is now part of the
 * examination's persisted configuration.
 */
export const updateExamination =
  async (
    examId: string,
    request: UpdateExaminationRequest,
  ): Promise<Examination> => {
    const response =
      await apiClient.put<Examination>(
        `/api/examinations/${encodeURIComponent(
          examId,
        )}`,
        request,
      );

    return response.data;
  };

// ============================================================
// DELETE
// ============================================================

/**
 * Delete one examination.
 *
 * DELETE /api/examinations/{examId}
 *
 * The backend first deletes all StudentMark records
 * belonging to the examination and then deletes the
 * examination itself.
 */
export const deleteExamination =
  async (
    examId: string,
  ): Promise<void> => {
    await apiClient.delete(
      `/api/examinations/${encodeURIComponent(
        examId,
      )}`,
    );
  };