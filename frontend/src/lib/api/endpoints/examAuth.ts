import { apiClient } from "../client";

// ============================================================
// REQUEST / RESPONSE TYPES
// ============================================================

export interface ProfessorExamAuthenticationRequest {
  examId: string;
  professorId: string;
  professorName: string;
}

export interface ProfessorExamAuthenticationResponse {
  authenticated: boolean;
  message: string;
  professorId: string | null;
  professorName: string | null;
  examId: string;
}

// ============================================================
// PROFESSOR EXAMINATION AUTHENTICATION
// ============================================================

/**
 * Authenticate a professor for a specific examination.
 *
 * This is NOT password authentication.
 *
 * The backend verifies:
 *   1. professorId
 *   2. professorName
 *   3. whether the professor is assigned to the exam
 *
 * POST /api/examinations/authenticate
 *
 * Expected request body:
 * {
 *   "examId": "....",
 *   "professorId": "....",
 *   "professorName": "...."
 * }
 */
export const authenticateProfessorForExam = async (
  request: ProfessorExamAuthenticationRequest,
): Promise<ProfessorExamAuthenticationResponse> => {
  const response =
    await apiClient.post<ProfessorExamAuthenticationResponse>(
      "/api/examinations/authenticate",
      request,
    );

  return response.data;
};