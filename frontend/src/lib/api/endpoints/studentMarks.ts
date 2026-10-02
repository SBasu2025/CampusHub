import { apiClient } from "../client";

import type {
  Examination,
  SemesterSGPAResult,
  Student,
  StudentMark,
  SubjectMarksResult,
} from "../types";

// ============================================================
// REQUEST TYPES
// ============================================================

/**
 * Single-student mark entry.
 *
 * Backend request body:
 * {
 *   "marksObtained": 18
 * }
 */
export interface MarkRequest {
  marksObtained: number;
}

/**
 * One entry inside the batch section marks request.
 *
 * Backend record:
 * MarkEntry(
 *     String studentId,
 *     BigDecimal marksObtained
 * )
 */
export interface MarkEntry {
  studentId: string;
  marksObtained: number;
}

// ============================================================
// BASIC MARK RETRIEVAL
// ============================================================

/**
 * Get every StudentMark record.
 *
 * GET /api/student-marks
 *
 * ADMIN
 */
export const getAllStudentMarks = async (): Promise<
  StudentMark[]
> => {
  const response =
    await apiClient.get<StudentMark[]>(
      "/api/student-marks",
    );

  return response.data;
};

/**
 * Get one StudentMark by its composite key:
 *
 *   studentId + examId
 *
 * GET /api/student-marks/{studentId}/{examId}
 *
 * ADMIN + owning STUDENT
 */
export const getStudentMarkById = async (
  studentId: string,
  examId: string,
): Promise<StudentMark> => {
  const response =
    await apiClient.get<StudentMark>(
      `/api/student-marks/${studentId}/${examId}`,
    );

  return response.data;
};

/**
 * Get all marks belonging to one student.
 *
 * GET /api/student-marks/student/{studentId}
 *
 * ADMIN + owning STUDENT
 */
export const getMarksForStudent = async (
  studentId: string,
): Promise<StudentMark[]> => {
  const response =
    await apiClient.get<StudentMark[]>(
      `/api/student-marks/student/${studentId}`,
    );

  return response.data;
};

/**
 * Get all marks entered for one examination.
 *
 * GET /api/student-marks/exam/{examId}
 *
 * ADMIN + professor assigned to the examination
 *
 * The backend identifies the authenticated professor from
 * Spring Security and verifies examination ownership.
 *
 * No professorId or professorName is submitted here.
 */
export const getMarksForExamination = async (
  examId: string,
): Promise<StudentMark[]> => {
  const response =
    await apiClient.get<StudentMark[]>(
      `/api/student-marks/exam/${examId}`,
    );

  return response.data;
};

// ============================================================
// PROFESSOR EXAMINATION WORKFLOW
// ============================================================

/**
 * Get examinations assigned to one professor.
 *
 * GET /api/student-marks/professor/{professorId}/examinations
 *
 * The professorId here represents the already logged-in
 * professor's CampusHub ID.
 *
 * It is NOT a second credential or identity confirmation.
 */
export const getExaminationsForProfessor =
  async (
    professorId: string,
  ): Promise<Examination[]> => {
    const response =
      await apiClient.get<Examination[]>(
        `/api/student-marks/professor/${encodeURIComponent(
          professorId,
        )}/examinations`,
      );

    return response.data;
  };

/**
 * Get examinations for one professor and one subject.
 *
 * GET
 * /api/student-marks/professor/{professorId}/subject/{subjectId}/examinations
 *
 * Again, professorId is simply the logged-in professor's ID.
 */
export const getExaminationsForProfessorAndSubject =
  async (
    professorId: string,
    subjectId: string,
  ): Promise<Examination[]> => {
    const response =
      await apiClient.get<Examination[]>(
        `/api/student-marks/professor/${encodeURIComponent(
          professorId,
        )}/subject/${encodeURIComponent(
          subjectId,
        )}/examinations`,
      );

    return response.data;
  };

/**
 * Get sections available for an examination.
 *
 * This endpoint is retained for compatibility with the
 * existing API surface.
 *
 * IMPORTANT:
 * The new professor workflow does NOT use this endpoint to
 * let the professor choose a section.
 *
 * The examination itself now contains the authoritative
 * section configured by the administrator.
 *
 * GET:
 * /api/student-marks/exam/{examId}/sections
 *
 * No professorId or professorName is submitted.
 */
export const getSectionsForExamination =
  async (
    examId: string,
  ): Promise<string[]> => {
    const response =
      await apiClient.get<string[]>(
        `/api/student-marks/exam/${examId}/sections`,
      );

    return response.data;
  };

/**
 * Get students belonging to the section configured on the
 * selected examination.
 *
 * GET:
 * /api/student-marks/exam/{examId}/section/{section}/students
 *
 * IMPORTANT:
 * The professor does NOT submit:
 *
 *   professorId
 *   professorName
 *
 * The backend obtains the authenticated professor from
 * Spring Security and verifies that this professor owns
 * the selected examination.
 *
 * The section comes from the examination selected by the
 * administrator.
 */
export const getStudentsForExamination =
  async (
    examId: string,
    section: string,
  ): Promise<Student[]> => {
    const response =
      await apiClient.get<Student[]>(
        `/api/student-marks/exam/${examId}/section/${encodeURIComponent(
          section,
        )}/students`,
      );

    return response.data;
  };

// ============================================================
// SINGLE MARK ENTRY
// ============================================================

/**
 * Create one student's mark inside an examination section.
 *
 * IMPORTANT:
 * No professorId.
 * No professorName.
 * No additional identity credential.
 *
 * The backend obtains the authenticated professor from
 * Spring Security.
 *
 * POST:
 * /api/student-marks/exam/{examId}/section/{section}/student/{studentId}
 *
 * Request body:
 * {
 *   "marksObtained": 18
 * }
 */
export const createMarkForStudent =
  async (
    examId: string,
    section: string,
    studentId: string,
    request: MarkRequest,
  ): Promise<StudentMark> => {
    const response =
      await apiClient.post<StudentMark>(
        `/api/student-marks/exam/${examId}/section/${encodeURIComponent(
          section,
        )}/student/${studentId}`,
        request,
      );

    return response.data;
  };

// ============================================================
// BATCH MARK ENTRY
// ============================================================

/**
 * Create marks for every student in one section.
 *
 * The backend accepts a List<StudentMarkService.MarkEntry>.
 *
 * Example body:
 *
 * [
 *   {
 *     "studentId": "STU_...",
 *     "marksObtained": 18
 *   },
 *   {
 *     "studentId": "STU_...",
 *     "marksObtained": 16
 *   }
 * ]
 *
 * POST:
 * /api/student-marks/exam/{examId}/section/{section}
 *
 * IMPORTANT:
 * No professorId.
 * No professorName.
 *
 * The authenticated professor is obtained by the backend
 * from Spring Security and checked against the examination.
 */
export const createMarksForSection =
  async (
    examId: string,
    section: string,
    entries: MarkEntry[],
  ): Promise<StudentMark[]> => {
    const response =
      await apiClient.post<StudentMark[]>(
        `/api/student-marks/exam/${examId}/section/${encodeURIComponent(
          section,
        )}`,
        entries,
      );

    return response.data;
  };

// ============================================================
// MARK UPDATE
// ============================================================

/**
 * Update one student's mark inside an examination section.
 *
 * IMPORTANT:
 * No professorId.
 * No professorName.
 *
 * The backend gets the authenticated professor from
 * Spring Security and verifies examination ownership.
 *
 * PUT:
 * /api/student-marks/exam/{examId}/section/{section}/student/{studentId}
 *
 * Request body:
 * {
 *   "marksObtained": 19
 * }
 */
export const updateMarkForStudent =
  async (
    examId: string,
    section: string,
    studentId: string,
    request: MarkRequest,
  ): Promise<StudentMark> => {
    const response =
      await apiClient.put<StudentMark>(
        `/api/student-marks/exam/${examId}/section/${encodeURIComponent(
          section,
        )}/student/${studentId}`,
        request,
      );

    return response.data;
  };

// ============================================================
// STUDENT MARKS DASHBOARD
// ============================================================

/**
 * Get calculated marks for one student, semester and subject.
 *
 * GET:
 * /api/student-marks/student/{studentId}/semester/{semester}/subject/{subjectId}
 *
 * Used by the Student Marks & SGPA screen after a subject
 * is selected.
 */
export const getStudentSubjectMarks =
  async (
    studentId: string,
    semester: number,
    subjectId: string,
  ): Promise<SubjectMarksResult> => {
    const response =
      await apiClient.get<SubjectMarksResult>(
        `/api/student-marks/student/${studentId}/semester/${semester}/subject/${subjectId}`,
      );

    return response.data;
  };

/**
 * Get calculated SGPA for one student and semester.
 *
 * GET:
 * /api/student-marks/student/{studentId}/semester/{semester}/sgpa
 *
 * Used by the Student Marks & SGPA dashboard.
 */
export const getSemesterSGPA =
  async (
    studentId: string,
    semester: number,
  ): Promise<SemesterSGPAResult> => {
    const response =
      await apiClient.get<SemesterSGPAResult>(
        `/api/student-marks/student/${studentId}/semester/${semester}/sgpa`,
      );

    return response.data;
  };

// ============================================================
// DELETE
// ============================================================

/**
 * Delete one StudentMark using its composite key.
 *
 * DELETE /api/student-marks/{studentId}/{examId}
 *
 * ADMIN
 */
export const deleteStudentMark =
  async (
    studentId: string,
    examId: string,
  ): Promise<void> => {
    await apiClient.delete(
      `/api/student-marks/${studentId}/${examId}`,
    );
  };

/**
 * Delete every StudentMark associated with one examination.
 *
 * DELETE /api/student-marks/exam/{examId}
 *
 * The backend returns the number of deleted records.
 */
export const deleteMarksForExamination =
  async (
    examId: string,
  ): Promise<number> => {
    const response =
      await apiClient.delete<number>(
        `/api/student-marks/exam/${examId}`,
      );

    return response.data;
  };

/**
 * Delete every StudentMark associated with one student.
 *
 * DELETE /api/student-marks/student/{studentId}
 *
 * The backend returns the number of deleted records.
 */
export const deleteMarksForStudent =
  async (
    studentId: string,
  ): Promise<number> => {
    const response =
      await apiClient.delete<number>(
        `/api/student-marks/student/${studentId}`,
      );

    return response.data;
  };