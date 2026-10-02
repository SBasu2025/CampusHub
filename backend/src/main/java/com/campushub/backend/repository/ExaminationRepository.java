package com.campushub.backend.repository;

import com.campushub.backend.entity.ExamType;
import com.campushub.backend.entity.Examination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ExaminationRepository
        extends JpaRepository<Examination, String> {

    // =========================================================
    // PROFESSOR EXAMINATIONS
    // =========================================================

    /**
     * All examinations assigned to a professor.
     *
     * Used by the professor-side examination workflow.
     */
    List<Examination>
    findByProfessor_ProfId(
            String profId
    );

    /**
     * Examinations of a specific subject assigned to a
     * professor.
     *
     * This keeps the professor workflow scoped to the
     * authenticated professor and selected subject.
     */
    List<Examination>
    findByProfessor_ProfIdAndSubject_SubjectId(
            String profId,
            String subjectId
    );

    // =========================================================
    // SUBJECT + SEMESTER
    // =========================================================

    /**
     * All examinations configured for a subject and semester.
     *
     * Ordering:
     *
     *   Internal 1
     *   Internal 2
     *   Internal 3
     *   ...
     *   Final
     *
     * The CASE expression intentionally keeps FINAL after
     * all INTERNAL examinations.
     *
     * Section is NOT filtered here because this method is also
     * used by the administration screen to inspect all
     * configurations.
     */
    @Query("""
            SELECT e
            FROM Examination e
            WHERE e.subject.subjectId = :subjectId
              AND e.semester = :semester
            ORDER BY
                CASE
                    WHEN e.examType =
                        com.campushub.backend.entity.ExamType.INTERNAL
                    THEN 0
                    ELSE 1
                END,
                e.internalNumber ASC
            """)
    List<Examination>
    findBySubject_SubjectIdAndSemesterOrderByInternalNumberAsc(
            @Param("subjectId")
            String subjectId,

            @Param("semester")
            Integer semester
    );

    // =========================================================
    // SUBJECT + SEMESTER + SECTION
    // =========================================================

    /**
     * All examinations belonging to one exact:
     *
     *   Subject
     *   Semester
     *   Section
     *
     * Section matching is case-insensitive.
     *
     * This is useful for the examination configuration and
     * professor marks workflow where the section configured by
     * the administrator is authoritative.
     */
    @Query("""
            SELECT e
            FROM Examination e
            WHERE e.subject.subjectId = :subjectId
              AND e.semester = :semester
              AND LOWER(TRIM(e.section)) =
                  LOWER(TRIM(:section))
            ORDER BY
                CASE
                    WHEN e.examType =
                        com.campushub.backend.entity.ExamType.INTERNAL
                    THEN 0
                    ELSE 1
                END,
                e.internalNumber ASC
            """)
    List<Examination>
    findBySubject_SubjectIdAndSemesterAndSection(
            @Param("subjectId")
            String subjectId,

            @Param("semester")
            Integer semester,

            @Param("section")
            String section
    );

    // =========================================================
    // SUBJECT + SEMESTER + SECTION + EXAM TYPE
    // =========================================================

    /**
     * All examinations of a specific type for:
     *
     *   Subject + Semester + Section
     *
     * Example:
     *
     *   Subject = DBMS
     *   Semester = 5
     *   Section = A
     *   ExamType = INTERNAL
     */
    @Query("""
            SELECT e
            FROM Examination e
            WHERE e.subject.subjectId = :subjectId
              AND e.semester = :semester
              AND LOWER(TRIM(e.section)) =
                  LOWER(TRIM(:section))
              AND e.examType = :examType
            ORDER BY e.internalNumber ASC
            """)
    List<Examination>
    findBySubject_SubjectIdAndSemesterAndSectionAndExamType(
            @Param("subjectId")
            String subjectId,

            @Param("semester")
            Integer semester,

            @Param("section")
            String section,

            @Param("examType")
            ExamType examType
    );

    // =========================================================
    // SUBJECT + SEMESTER + EXAM TYPE
    // =========================================================
    //
    // Kept for compatibility with existing service/controller
    // code elsewhere in the application.
    // =========================================================

    List<Examination>
    findBySubject_SubjectIdAndSemesterAndExamType(
            String subjectId,
            Integer semester,
            ExamType examType
    );

    // =========================================================
    // SECTION-AWARE DUPLICATE CHECK
    // =========================================================

    /**
     * Checks whether a particular examination configuration
     * already exists for:
     *
     *   Subject
     *   Semester
     *   Section
     *   Exam Type
     *   Internal Number
     *
     * For FINAL examinations, internalNumber is NULL.
     *
     * This repository method is section-aware so that:
     *
     *   Section A + Internal 1
     *
     * and
     *
     *   Section B + Internal 1
     *
     * are treated as different configurations.
     */
    @Query("""
            SELECT COUNT(e) > 0
            FROM Examination e
            WHERE e.subject.subjectId = :subjectId
              AND e.semester = :semester
              AND LOWER(TRIM(e.section)) =
                  LOWER(TRIM(:section))
              AND e.examType = :examType
              AND (
                    (:internalNumber IS NULL
                     AND e.internalNumber IS NULL)
                    OR
                    (:internalNumber IS NOT NULL
                     AND e.internalNumber = :internalNumber)
                  )
            """)
    boolean existsBySubjectAndSemesterAndSectionAndTypeAndInternalNumber(
            @Param("subjectId")
            String subjectId,

            @Param("semester")
            Integer semester,

            @Param("section")
            String section,

            @Param("examType")
            ExamType examType,

            @Param("internalNumber")
            Integer internalNumber
    );

    // =========================================================
    // PROFESSOR + EXAMINATION
    // =========================================================

    /**
     * Checks whether the supplied professor is the professor
     * assigned to the supplied examination.
     *
     * This is useful for the marks workflow and keeps the
     * professor authorization logic independent of the
     * professor name.
     *
     * IMPORTANT:
     *
     * The actual security boundary should still use the
     * authenticated Spring Security principal.
     */
    boolean existsByExamIdAndProfessor_ProfId(
            String examId,
            String profId
    );

    // =========================================================
    // PROFESSOR + EXAMINATION + SUBJECT
    // =========================================================

    /**
     * Checks the complete professor/examination/subject
     * relationship.
     *
     * This is useful when validating that the requested
     * examination belongs to the professor and subject currently
     * selected in the professor dashboard.
     */
    boolean existsByExamIdAndProfessor_ProfIdAndSubject_SubjectId(
            String examId,
            String profId,
            String subjectId
    );
}