package com.campushub.backend.service;

import com.campushub.backend.entity.Department;
import com.campushub.backend.entity.ExamType;
import com.campushub.backend.entity.Examination;
import com.campushub.backend.entity.Professor;
import com.campushub.backend.entity.Subject;
import com.campushub.backend.repository.ExaminationRepository;
import com.campushub.backend.repository.ProfessorRepository;
import com.campushub.backend.repository.StudentMarkRepository;
import com.campushub.backend.repository.SubjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class ExaminationService {

    private final ExaminationRepository examinationRepository;
    private final SubjectRepository subjectRepository;
    private final ProfessorRepository professorRepository;
    private final StudentMarkRepository studentMarkRepository;

    public ExaminationService(
            ExaminationRepository examinationRepository,
            SubjectRepository subjectRepository,
            ProfessorRepository professorRepository,
            StudentMarkRepository studentMarkRepository) {

        this.examinationRepository = examinationRepository;
        this.subjectRepository = subjectRepository;
        this.professorRepository = professorRepository;
        this.studentMarkRepository = studentMarkRepository;
    }

    // -------------------------------------------------------------------------
    // RETRIEVAL
    // -------------------------------------------------------------------------

    public List<Examination> getAllExaminations() {
        return examinationRepository.findAll();
    }

    public Optional<Examination> getExaminationById(
            String examId) {

        return examinationRepository.findById(
                examId
        );
    }

    public List<Examination> getExaminationsByProfessor(
            String profId) {

        return examinationRepository
                .findByProfessor_ProfId(
                        profId
                );
    }

    public List<Examination> getExaminationsByProfessorAndSubject(
            String profId,
            String subjectId) {

        return examinationRepository
                .findByProfessor_ProfIdAndSubject_SubjectId(
                        profId,
                        subjectId
                );
    }

    public List<Examination> getExaminationsBySubjectAndSemester(
            String subjectId,
            Integer semester) {

        return examinationRepository
                .findBySubject_SubjectIdAndSemesterOrderByInternalNumberAsc(
                        subjectId,
                        semester
                );
    }

    // -------------------------------------------------------------------------
    // CREATE
    // -------------------------------------------------------------------------

    public Examination saveExamination(
            Examination examination) {

        validateExamination(
                examination,
                false
        );

        String subjectId =
                examination
                        .getSubject()
                        .getSubjectId();

        String professorId =
                examination
                        .getProfessor()
                        .getProfId();

        Subject subject =
                subjectRepository
                        .findById(
                                subjectId
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Subject not found: "
                                                + subjectId
                                )
                        );

        Professor professor =
                professorRepository
                        .findById(
                                professorId
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Professor not found: "
                                                + professorId
                                )
                        );

        // -----------------------------------------------------
        // Normalize section before persisting.
        // -----------------------------------------------------

        examination.setSection(
                normalizeSection(
                        examination.getSection()
                )
        );

        examination.setSubject(
                subject
        );

        examination.setProfessor(
                professor
        );

        // -----------------------------------------------------
        // Professor must belong to the same department as the
        // selected subject's course.
        //
        // Subject
        //   -> Course
        //      -> Department
        //
        // Professor
        //   -> Department
        // -----------------------------------------------------

        validateProfessorDepartment(
                subject,
                professor
        );

        validateDuplicateConfiguration(
                examination,
                null
        );

        return examinationRepository.save(
                examination
        );
    }

    // -------------------------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------------------------

    public Examination updateExamination(
            String examId,
            Examination examination) {

        if (!examinationRepository.existsById(
                examId
        )) {
            return null;
        }

        examination.setExamId(
                examId
        );

        validateExamination(
                examination,
                true
        );

        String subjectId =
                examination
                        .getSubject()
                        .getSubjectId();

        String professorId =
                examination
                        .getProfessor()
                        .getProfId();

        Subject subject =
                subjectRepository
                        .findById(
                                subjectId
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Subject not found: "
                                                + subjectId
                                )
                        );

        Professor professor =
                professorRepository
                        .findById(
                                professorId
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Professor not found: "
                                                + professorId
                                )
                        );

        examination.setSection(
                normalizeSection(
                        examination.getSection()
                )
        );

        examination.setSubject(
                subject
        );

        examination.setProfessor(
                professor
        );

        validateProfessorDepartment(
                subject,
                professor
        );

        validateDuplicateConfiguration(
                examination,
                examId
        );

        return examinationRepository.save(
                examination
        );
    }

    // -------------------------------------------------------------------------
    // BULK EXAMINATION CONFIGURATION
    // -------------------------------------------------------------------------

    @Transactional
    public List<Examination> configureExaminations(
            String subjectId,
            Integer semester,
            String section,
            Integer numberOfInternals,
            Integer internalMaxMarks,
            Integer finalMaxMarks,
            List<String> internalProfessorIds,
            String finalProfessorId,
            List<String> examIds) {

        // -----------------------------------------------------
        // BASIC VALIDATION
        // -----------------------------------------------------

        if (subjectId == null
                || subjectId.isBlank()) {

            throw new IllegalArgumentException(
                    "Subject ID is required"
            );
        }

        if (semester == null
                || semester <= 0) {

            throw new IllegalArgumentException(
                    "Semester must be greater than 0"
            );
        }

        String normalizedSection =
                normalizeSection(
                        section
                );

        if (normalizedSection.isBlank()) {

            throw new IllegalArgumentException(
                    "Section is required"
            );
        }

        if (numberOfInternals == null
                || numberOfInternals <= 0) {

            throw new IllegalArgumentException(
                    "Number of Internals must be greater than 0"
            );
        }

        if (internalMaxMarks == null
                || internalMaxMarks <= 0) {

            throw new IllegalArgumentException(
                    "Internal maximum marks must be greater than 0"
            );
        }

        if (finalMaxMarks == null
                || finalMaxMarks <= 0) {

            throw new IllegalArgumentException(
                    "Final maximum marks must be greater than 0"
            );
        }

        if (internalProfessorIds == null
                || internalProfessorIds.size()
                != numberOfInternals) {

            throw new IllegalArgumentException(
                    "Exactly one professor must be assigned for every Internal exam"
            );
        }

        if (finalProfessorId == null
                || finalProfessorId.isBlank()) {

            throw new IllegalArgumentException(
                    "Professor is required for the Final exam"
            );
        }

        if (examIds == null
                || examIds.size()
                != numberOfInternals + 1) {

            throw new IllegalArgumentException(
                    "Exactly one exam ID is required for every Internal and Final exam"
            );
        }

        // -----------------------------------------------------
        // LOAD SUBJECT
        // -----------------------------------------------------

        Subject subject =
                subjectRepository
                        .findById(
                                subjectId
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Subject not found: "
                                                + subjectId
                                )
                        );

        // -----------------------------------------------------
        // DUPLICATE CONFIGURATION
        // -----------------------------------------------------
        //
        // The same Subject + Semester may have separate
        // configurations for:
        //
        //   Section A
        //   Section B
        //
        // Therefore section is part of the uniqueness scope.
        // -----------------------------------------------------

        List<Examination> existing =
                examinationRepository
                        .findBySubject_SubjectIdAndSemesterOrderByInternalNumberAsc(
                                subjectId,
                                semester
                        );

        boolean sameSectionExists =
                existing.stream()
                        .anyMatch(
                                examination ->
                                        normalizeSection(
                                                examination.getSection()
                                        )
                                                .equalsIgnoreCase(
                                                        normalizedSection
                                                )
                        );

        if (sameSectionExists) {

            throw new IllegalArgumentException(
                    "Examinations are already configured for "
                            + subjectId
                            + ", semester "
                            + semester
                            + ", section "
                            + normalizedSection
            );
        }

        // -----------------------------------------------------
        // INTERNAL EXAMINATIONS
        // -----------------------------------------------------

        for (
                int i = 0;
                i < internalProfessorIds.size();
                i++
        ) {

            String professorId =
                    internalProfessorIds.get(
                            i
                    );

            if (professorId == null
                    || professorId.isBlank()) {

                throw new IllegalArgumentException(
                        "Professor is required for Internal exam "
                                + (i + 1)
                );
            }

            Professor professor =
                    professorRepository
                            .findById(
                                    professorId
                            )
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "Professor not found: "
                                                    + professorId
                                    )
                            );

            validateProfessorDepartment(
                    subject,
                    professor
            );

            Examination examination =
                    new Examination(
                            examIds.get(i),
                            subject,
                            semester,
                            normalizedSection,
                            ExamType.INTERNAL,
                            i + 1,
                            internalMaxMarks,
                            professor
                    );

            validateExamination(
                    examination,
                    false
            );

            validateDuplicateConfiguration(
                    examination,
                    null
            );

            examinationRepository.save(
                    examination
            );
        }

        // -----------------------------------------------------
        // FINAL EXAMINATION
        // -----------------------------------------------------

        Professor finalProfessor =
                professorRepository
                        .findById(
                                finalProfessorId
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Professor not found: "
                                                + finalProfessorId
                                )
                        );

        validateProfessorDepartment(
                subject,
                finalProfessor
        );

        Examination finalExam =
                new Examination(
                        examIds.get(
                                numberOfInternals
                        ),
                        subject,
                        semester,
                        normalizedSection,
                        ExamType.FINAL,
                        null,
                        finalMaxMarks,
                        finalProfessor
                );

        validateExamination(
                finalExam,
                false
        );

        validateDuplicateConfiguration(
                finalExam,
                null
        );

        examinationRepository.save(
                finalExam
        );

        // -----------------------------------------------------
        // RETURN THE NEW SECTION-SPECIFIC CONFIGURATION
        // -----------------------------------------------------

        return examinationRepository
                .findBySubject_SubjectIdAndSemesterOrderByInternalNumberAsc(
                        subjectId,
                        semester
                )
                .stream()
                .filter(
                        examination ->
                                normalizeSection(
                                        examination.getSection()
                                )
                                        .equalsIgnoreCase(
                                                normalizedSection
                                        )
                )
                .toList();
    }

    // -------------------------------------------------------------------------
    // DELETE
    // -------------------------------------------------------------------------

    @Transactional
    public boolean deleteExamination(
            String examId) {

        if (!examinationRepository.existsById(
                examId
        )) {
            return false;
        }

        /*
         * STUDENT_MARK has a foreign key to EXAMINATION.
         *
         * Therefore marks must be removed first before the
         * examination itself can be deleted.
         */
        studentMarkRepository
                .deleteByExamination_ExamId(
                        examId
                );

        examinationRepository.deleteById(
                examId
        );

        return true;
    }

    // -------------------------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------------------------

    private void validateExamination(
            Examination examination,
            boolean updating) {

        if (examination == null) {

            throw new IllegalArgumentException(
                    "Examination data is required"
            );
        }

        if (!updating
                && (
                examination.getExamId() == null
                        || examination.getExamId().isBlank()
        )) {

            throw new IllegalArgumentException(
                    "Exam ID is required"
            );
        }

        if (examination.getExamType() == null) {

            throw new IllegalArgumentException(
                    "Exam type is required"
            );
        }

        if (examination.getSemester() == null
                || examination.getSemester() <= 0) {

            throw new IllegalArgumentException(
                    "Semester must be greater than 0"
            );
        }

        if (examination.getMaxMarks() == null
                || examination.getMaxMarks() <= 0) {

            throw new IllegalArgumentException(
                    "Maximum marks must be greater than 0"
            );
        }

        if (examination.getSection() == null
                || examination.getSection().isBlank()) {

            throw new IllegalArgumentException(
                    "Section is required"
            );
        }

        if (examination.getSubject() == null
                || examination
                        .getSubject()
                        .getSubjectId() == null
                || examination
                        .getSubject()
                        .getSubjectId()
                        .isBlank()) {

            throw new IllegalArgumentException(
                    "Subject is required"
            );
        }

        if (examination.getProfessor() == null
                || examination
                        .getProfessor()
                        .getProfId() == null
                || examination
                        .getProfessor()
                        .getProfId()
                        .isBlank()) {

            throw new IllegalArgumentException(
                    "Professor is required"
            );
        }

        if (examination.getExamType()
                == ExamType.INTERNAL) {

            if (examination.getInternalNumber()
                    == null
                    || examination
                    .getInternalNumber()
                    <= 0) {

                throw new IllegalArgumentException(
                        "Internal number is required for Internal exams"
                );
            }

        } else if (
                examination.getExamType()
                        == ExamType.FINAL
        ) {

            if (examination.getInternalNumber()
                    != null) {

                throw new IllegalArgumentException(
                        "Internal number must be null for Final exams"
                );
            }
        }
    }

    // -------------------------------------------------------------------------
    // DUPLICATE CONFIGURATION VALIDATION
    // -------------------------------------------------------------------------

    private void validateDuplicateConfiguration(
            Examination examination,
            String currentExamId) {

        String subjectId =
                examination
                        .getSubject()
                        .getSubjectId();

        Integer semester =
                examination.getSemester();

        String section =
                normalizeSection(
                        examination.getSection()
                );

        List<Examination> existing =
                examinationRepository
                        .findBySubject_SubjectIdAndSemesterOrderByInternalNumberAsc(
                                subjectId,
                                semester
                        );

        for (
                Examination current :
                existing
        ) {

            if (currentExamId != null
                    && current.getExamId()
                    .equals(
                            currentExamId
                    )) {

                continue;
            }

            String currentSection =
                    normalizeSection(
                            current.getSection()
                    );

            if (!currentSection.equalsIgnoreCase(
                    section
            )) {

                continue;
            }

            if (current.getExamType()
                    != examination.getExamType()) {

                continue;
            }

            if (
                    examination.getExamType()
                            == ExamType.INTERNAL
            ) {

                if (
                        current.getInternalNumber()
                                != null
                                && current
                                .getInternalNumber()
                                .equals(
                                        examination
                                                .getInternalNumber()
                                )
                ) {

                    throw new IllegalArgumentException(
                            "This Internal exam is already configured for section "
                                    + section
                    );
                }

            } else {

                throw new IllegalArgumentException(
                        "A Final exam is already configured for section "
                                + section
                );
            }
        }
    }

    // -------------------------------------------------------------------------
    // PROFESSOR / SUBJECT DEPARTMENT VALIDATION
    // -------------------------------------------------------------------------

    private void validateProfessorDepartment(
            Subject subject,
            Professor professor) {

        if (subject == null
                || subject.getCourse() == null
                || subject.getCourse().getDepartment() == null) {

            throw new IllegalArgumentException(
                    "Subject course department could not be resolved"
            );
        }

        Department subjectDepartment =
                subject
                        .getCourse()
                        .getDepartment();

        Department professorDepartment =
                professor.getDepartment();

        if (professorDepartment == null) {

            throw new IllegalArgumentException(
                    "Professor department could not be resolved"
            );
        }

        if (!subjectDepartment
                .getDeptId()
                .equalsIgnoreCase(
                        professorDepartment.getDeptId()
                )) {

            throw new IllegalArgumentException(
                    "Professor "
                            + professor.getProfId()
                            + " does not belong to the department of the selected subject"
            );
        }
    }

    // -------------------------------------------------------------------------
    // SECTION NORMALIZATION
    // -------------------------------------------------------------------------

    private String normalizeSection(
            String section) {

        if (section == null) {
            return "";
        }

        return section
                .trim()
                .toUpperCase(
                        Locale.ROOT
                );
    }
}