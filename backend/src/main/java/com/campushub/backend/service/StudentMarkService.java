package com.campushub.backend.service;

import com.campushub.backend.entity.ExamType;
import com.campushub.backend.entity.Examination;
import com.campushub.backend.entity.Student;
import com.campushub.backend.entity.StudentMark;
import com.campushub.backend.entity.StudentMarkId;
import com.campushub.backend.entity.Subject;
import com.campushub.backend.repository.ExaminationRepository;
import com.campushub.backend.repository.StudentMarkRepository;
import com.campushub.backend.repository.StudentRepository;
import com.campushub.backend.repository.SubjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class StudentMarkService {

    private static final BigDecimal INTERNAL_WEIGHT =
            BigDecimal.valueOf(40);

    private static final BigDecimal FINAL_WEIGHT =
            BigDecimal.valueOf(60);

    private final StudentMarkRepository studentMarkRepository;

    private final StudentRepository studentRepository;

    private final ExaminationRepository examinationRepository;

    private final SubjectRepository subjectRepository;

    public StudentMarkService(
            StudentMarkRepository studentMarkRepository,
            StudentRepository studentRepository,
            ExaminationRepository examinationRepository,
            SubjectRepository subjectRepository) {

        this.studentMarkRepository =
                studentMarkRepository;

        this.studentRepository =
                studentRepository;

        this.examinationRepository =
                examinationRepository;

        this.subjectRepository =
                subjectRepository;
    }

    // =========================================================
    // BASIC RETRIEVAL
    // =========================================================

    public List<StudentMark> getAllStudentMarks() {

        return studentMarkRepository.findAll();
    }

    public Optional<StudentMark> getStudentMarkById(
            String studentId,
            String examId) {

        return studentMarkRepository
                .findByStudent_StudentIdAndExamination_ExamId(
                        studentId,
                        examId
                );
    }

    public List<StudentMark> getMarksForStudent(
            String studentId) {

        requireStudent(studentId);

        return studentMarkRepository
                .findByStudent_StudentId(
                        studentId
                );
    }

    public List<StudentMark> getMarksForExamination(
            String examId) {

        requireExamination(examId);

        return studentMarkRepository
                .findByExamination_ExamIdOrderByStudent_StudentIdAsc(
                        examId
                );
    }

    // =========================================================
    // PROFESSOR EXAMINATION WORKFLOW
    // =========================================================

    /**
     * Returns examinations assigned to the supplied professor.
     *
     * IMPORTANT:
     *
     * The controller will obtain the professor ID from the
     * authenticated Spring Security principal.
     *
     * The professor does not need to enter their name again.
     */
    public List<Examination> getExaminationsForProfessor(
            String professorId) {

        requireProfessorId(professorId);

        return examinationRepository
                .findByProfessor_ProfId(
                        professorId
                );
    }

    /**
     * Returns only examinations assigned to the supplied
     * professor for the selected subject.
     */
    public List<Examination>
    getExaminationsForProfessorAndSubject(
            String professorId,
            String subjectId) {

        requireProfessorId(professorId);

        if (
                subjectId == null
                        || subjectId.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Subject ID is required"
            );
        }

        return examinationRepository
                .findByProfessor_ProfIdAndSubject_SubjectId(
                        professorId,
                        subjectId
                );
    }

    /**
     * Compatibility method for the old /sections endpoint.
     *
     * The new professor workflow does NOT allow the professor
     * to choose a section.
     *
     * Therefore, this endpoint now returns only the section
     * configured on the examination itself.
     */
    public List<String> getSectionsForExamination(
            String examId,
            String professorId) {

        Examination examination =
                requireExamination(examId);

        requireProfessorAssignment(
                examination,
                professorId
        );

        String section =
                requireExamSection(
                        examination
                );

        return List.of(section);
    }

    /**
     * Returns the students belonging to the exact scope of
     * the selected examination:
     *
     *   examination course
     *   examination semester
     *   examination section
     *
     * The requested section must match the section configured
     * by the administrator on the examination.
     */
    public List<Student> getStudentsForExamination(
            String examId,
            String section,
            String professorId) {

        Examination examination =
                requireExamination(examId);

        requireProfessorAssignment(
                examination,
                professorId
        );

        String examSection =
                requireExamSection(
                        examination
                );

        String requestedSection =
                normalizeSection(
                        section
                );

        if (
                requestedSection.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Section is required"
            );
        }

        if (
                !examSection.equalsIgnoreCase(
                        requestedSection
                )
        ) {
            throw new IllegalArgumentException(
                    "The requested section does not belong to this examination"
            );
        }

        String courseId =
                requireExamCourseId(
                        examination
                );

        Integer semester =
                requireExamSemester(
                        examination
                );

        List<Student> students =
                studentRepository
                        .findByCourse_CourseIdAndSectionAndSemester(
                                courseId,
                                examSection,
                                semester
                        );

        if (
                students.isEmpty()
        ) {
            throw new IllegalArgumentException(
                    "No students found for the configured course, semester and section"
            );
        }

        return students;
    }

    // =========================================================
    // SINGLE MARK ENTRY
    // =========================================================

    @Transactional
    public StudentMark saveMarkForSection(
            String examId,
            String studentId,
            String section,
            String professorId,
            BigDecimal marksObtained) {

        Examination examination =
                requireExamination(
                        examId
                );

        Student student =
                requireStudent(
                        studentId
                );

        requireProfessorAssignment(
                examination,
                professorId
        );

        validateStudentBelongsToExamSection(
                student,
                examination,
                section
        );

        if (
                studentMarkRepository
                        .existsByStudent_StudentIdAndExamination_ExamId(
                                studentId,
                                examId
                        )
        ) {
            throw new IllegalArgumentException(
                    "A mark already exists for this student and examination"
            );
        }

        StudentMark studentMark =
                new StudentMark(
                        new StudentMarkId(
                                studentId,
                                examId
                        ),
                        student,
                        examination,
                        marksObtained
                );

        validateMarks(
                studentMark
        );

        return studentMarkRepository.save(
                studentMark
        );
    }

    // =========================================================
    // BATCH MARK ENTRY
    // =========================================================

    @Transactional
    public List<StudentMark> saveMarksForSection(
            String examId,
            String section,
            String professorId,
            List<MarkEntry> entries) {

        Examination examination =
                requireExamination(
                        examId
                );

        requireProfessorAssignment(
                examination,
                professorId
        );

        String examSection =
                requireExamSection(
                        examination
                );

        String requestedSection =
                normalizeSection(
                        section
                );

        if (
                requestedSection.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Section is required"
            );
        }

        if (
                !examSection.equalsIgnoreCase(
                        requestedSection
                )
        ) {
            throw new IllegalArgumentException(
                    "The requested section does not belong to this examination"
            );
        }

        if (
                entries == null
                        || entries.isEmpty()
        ) {
            throw new IllegalArgumentException(
                    "At least one student mark is required"
            );
        }

        List<Student> sectionStudents =
                getStudentsForExamination(
                        examId,
                        examSection,
                        professorId
                );

                Map<String, Student> allowedStudents =
                sectionStudents.stream()
                        .filter(
                                Objects::nonNull
                        )
                        .filter(
                                student ->
                                        student.getStudentId()
                                                != null
                        )
                        .collect(
                                Collectors.toMap(
                                        student ->
                                                student.getStudentId(),
                                        student ->
                                                student
                                )
                        );

        if (
                entries.size()
                        != allowedStudents.size()
        ) {
            throw new IllegalArgumentException(
                    "Marks must be entered for every student in the configured section"
            );
        }

        Set<String> submittedStudentIds =
                new HashSet<>();

        List<StudentMark> marksToSave =
                new ArrayList<>();

        for (
                MarkEntry entry :
                entries
        ) {

            if (
                    entry == null
                            || entry.studentId()
                            == null
                            || entry.studentId()
                            .isBlank()
            ) {
                throw new IllegalArgumentException(
                        "Student ID is required for every mark entry"
                );
            }

            String studentId =
                    entry.studentId()
                            .trim();

            if (
                    !submittedStudentIds.add(
                            studentId
                    )
            ) {
                throw new IllegalArgumentException(
                        "Duplicate student ID in the same mark submission: "
                                + studentId
                );
            }

            Student student =
                    allowedStudents.get(
                            studentId
                    );

            if (
                    student == null
            ) {
                throw new IllegalArgumentException(
                        "Student "
                                + studentId
                                + " does not belong to the configured course, semester and section"
                );
            }

            if (
                    studentMarkRepository
                            .existsByStudent_StudentIdAndExamination_ExamId(
                                    studentId,
                                    examId
                            )
            ) {
                throw new IllegalArgumentException(
                        "A mark already exists for student "
                                + studentId
                                + " and examination "
                                + examId
                );
            }

            StudentMark studentMark =
                    new StudentMark(
                            new StudentMarkId(
                                    studentId,
                                    examId
                            ),
                            student,
                            examination,
                            entry.marksObtained()
                    );

            validateMarks(
                    studentMark
            );

            marksToSave.add(
                    studentMark
            );
        }

        if (
                submittedStudentIds.size()
                        != allowedStudents.size()
        ) {
            throw new IllegalArgumentException(
                    "Marks are missing for one or more students in the configured section"
            );
        }

        return studentMarkRepository.saveAll(
                marksToSave
        );
    }

    // =========================================================
    // MARK UPDATE
    // =========================================================

    @Transactional
    public StudentMark updateMarkForSection(
            String examId,
            String studentId,
            String section,
            String professorId,
            BigDecimal marksObtained) {

        Examination examination =
                requireExamination(
                        examId
                );

        Student student =
                requireStudent(
                        studentId
                );

        requireProfessorAssignment(
                examination,
                professorId
        );

        validateStudentBelongsToExamSection(
                student,
                examination,
                section
        );

        StudentMarkId id =
                new StudentMarkId(
                        studentId,
                        examId
                );

        StudentMark existing =
                studentMarkRepository
                        .findById(
                                id
                        )
                        .orElse(null);

        if (
                existing == null
        ) {
            throw new IllegalArgumentException(
                    "Student mark does not exist"
            );
        }

        existing.setStudent(
                student
        );

        existing.setExamination(
                examination
        );

        existing.setMarksObtained(
                marksObtained
        );

        validateMarks(
                existing
        );

        return studentMarkRepository.save(
                existing
        );
    }

    // =========================================================
    // DIRECT CRUD
    // =========================================================
    //
    // These methods are retained because other parts of the
    // application may use them.
    //
    // For direct creation/update, the student's course,
    // semester AND examination section are validated.
    // =========================================================

    public StudentMark saveStudentMark(
            StudentMark studentMark) {

        validateStudentMarkStructure(
                studentMark
        );

        String studentId =
                studentMark
                        .getStudent()
                        .getStudentId();

        String examId =
                studentMark
                        .getExamination()
                        .getExamId();

        Student student =
                requireStudent(
                        studentId
                );

        Examination examination =
                requireExamination(
                        examId
                );

        if (
                studentMarkRepository
                        .existsByStudent_StudentIdAndExamination_ExamId(
                                studentId,
                                examId
                        )
        ) {
            throw new IllegalArgumentException(
                    "A mark already exists for this student and examination"
            );
        }

        validateStudentBelongsToExamSection(
                student,
                examination,
                examination.getSection()
        );

        studentMark.setId(
                new StudentMarkId(
                        studentId,
                        examId
                )
        );

        studentMark.setStudent(
                student
        );

        studentMark.setExamination(
                examination
        );

        validateMarks(
                studentMark
        );

        return studentMarkRepository.save(
                studentMark
        );
    }

    public StudentMark updateStudentMark(
            String studentId,
            String examId,
            StudentMark studentMark) {

        StudentMarkId id =
                new StudentMarkId(
                        studentId,
                        examId
                );

        StudentMark existing =
                studentMarkRepository
                        .findById(
                                id
                        )
                        .orElse(null);

        if (
                existing == null
        ) {
            return null;
        }

        Student student =
                requireStudent(
                        studentId
                );

        Examination examination =
                requireExamination(
                        examId
                );

        if (
                studentMark.getMarksObtained()
                        == null
        ) {
            throw new IllegalArgumentException(
                    "Marks obtained is required"
            );
        }

        validateStudentBelongsToExamSection(
                student,
                examination,
                examination.getSection()
        );

        existing.setId(
                id
        );

        existing.setStudent(
                student
        );

        existing.setExamination(
                examination
        );

        existing.setMarksObtained(
                studentMark.getMarksObtained()
        );

        validateMarks(
                existing
        );

        return studentMarkRepository.save(
                existing
        );
    }

    public boolean deleteStudentMark(
            String studentId,
            String examId) {

        StudentMarkId id =
                new StudentMarkId(
                        studentId,
                        examId
                );

        if (
                !studentMarkRepository
                        .existsById(
                                id
                        )
        ) {
            return false;
        }

        studentMarkRepository.deleteById(
                id
        );

        return true;
    }

    @Transactional
    public long deleteMarksForExamination(
            String examId) {

        requireExamination(
                examId
        );

        return studentMarkRepository
                .deleteByExamination_ExamId(
                        examId
                );
    }

    @Transactional
    public long deleteMarksForStudent(
            String studentId) {

        requireStudent(
                studentId
        );

        return studentMarkRepository
                .deleteByStudent_StudentId(
                        studentId
                );
    }

    // =========================================================
    // STUDENT SUBJECT MARKS
    // =========================================================

    public SubjectMarksResult getStudentSubjectMarks(
            String studentId,
            String subjectId,
            Integer semester) {

        Student student =
                requireStudent(
                        studentId
                );

        if (
                subjectId == null
                        || subjectId.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Subject ID is required"
            );
        }

        if (
                semester == null
                        || semester <= 0
        ) {
            throw new IllegalArgumentException(
                    "Semester must be greater than 0"
            );
        }

        String studentSection =
                normalizeSection(
                        student.getSection()
                );

        if (
                studentSection.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Student section is not configured"
            );
        }

        List<Examination> allExaminations =
                examinationRepository
                        .findBySubject_SubjectIdAndSemesterOrderByInternalNumberAsc(
                                subjectId,
                                semester
                        );

        /*
         * Multiple sections can now have separate examination
         * configurations for the same subject and semester.
         *
         * A student must only see the examinations belonging
         * to that student's own section.
         */
        List<Examination> examinations =
                allExaminations.stream()
                        .filter(
                                examination ->
                                        studentSection.equalsIgnoreCase(
                                                normalizeSection(
                                                        examination
                                                                .getSection()
                                                )
                                        )
                        )
                        .toList();

        if (
                examinations.isEmpty()
        ) {
            throw new IllegalArgumentException(
                    "No examinations are configured for this subject, semester and student section"
            );
        }

        validateStudentBelongsToSubjectCourse(
                student,
                examinations.get(0)
        );

        boolean hasInternal =
                false;

        boolean hasFinal =
                false;

        List<StudentMark> marks =
                studentMarkRepository
                        .findByStudent_StudentIdAndExamination_Subject_SubjectIdAndExamination_Semester(
                                studentId,
                                subjectId,
                                semester
                        );

        Map<String, StudentMark> markByExamId =
                marks.stream()
                        .filter(
                                Objects::nonNull
                        )
                        .filter(
                                mark ->
                                        mark.getExamination()
                                                != null
                        )
                        .filter(
                                mark ->
                                        studentSection.equalsIgnoreCase(
                                                normalizeSection(
                                                        mark.getExamination()
                                                                .getSection()
                                                )
                                        )
                        )
                        .collect(
                                Collectors.toMap(
                                        mark ->
                                                mark.getExamination()
                                                        .getExamId(),
                                        mark ->
                                                mark
                                )
                        );

        List<ExamMark> examMarks =
                new ArrayList<>();

        BigDecimal internalObtained =
                BigDecimal.ZERO;

        BigDecimal internalMaximum =
                BigDecimal.ZERO;

        BigDecimal finalObtained =
                BigDecimal.ZERO;

        BigDecimal finalMaximum =
                BigDecimal.ZERO;

        for (
                Examination examination :
                examinations
        ) {

            if (
                    examination.getExamType()
                            == ExamType.INTERNAL
            ) {

                hasInternal =
                        true;

                if (
                        examination
                                        .getInternalNumber()
                                == null
                                || examination
                                        .getInternalNumber()
                                        <= 0
                ) {
                    throw new IllegalArgumentException(
                            "Invalid Internal examination configuration for subject "
                                    + subjectId
                                    + " and semester "
                                    + semester
                    );
                }

            } else if (
                    examination.getExamType()
                            == ExamType.FINAL
            ) {

                if (
                        hasFinal
                ) {
                    throw new IllegalArgumentException(
                            "Multiple Final examinations configured for subject "
                                    + subjectId
                                    + ", semester "
                                    + semester
                                    + " and section "
                                    + studentSection
                    );
                }

                hasFinal =
                        true;
            }

            if (
                    examination.getMaxMarks()
                            == null
                            || examination
                            .getMaxMarks()
                            <= 0
            ) {
                throw new IllegalArgumentException(
                        "Invalid maximum marks configured for examination "
                                + examination.getExamId()
                );
            }

            StudentMark mark =
                    markByExamId.get(
                            examination.getExamId()
                    );

            BigDecimal obtained =
                    mark != null
                            ? mark.getMarksObtained()
                            : null;

            examMarks.add(
                    new ExamMark(
                            examination.getExamId(),
                            examination.getExamType(),
                            examination.getInternalNumber(),
                            examination.getMaxMarks(),
                            obtained
                    )
            );

            if (
                    examination.getExamType()
                            == ExamType.INTERNAL
            ) {

                internalMaximum =
                        internalMaximum.add(
                                BigDecimal.valueOf(
                                        examination
                                                .getMaxMarks()
                                )
                        );

                if (
                        obtained != null
                ) {
                    internalObtained =
                            internalObtained.add(
                                    obtained
                            );
                }

            } else {

                finalMaximum =
                        finalMaximum.add(
                                BigDecimal.valueOf(
                                        examination
                                                .getMaxMarks()
                                )
                        );

                if (
                        obtained != null
                ) {
                    finalObtained =
                            finalObtained.add(
                                    obtained
                            );
                }
            }
        }

        if (
                !hasInternal
        ) {
            throw new IllegalArgumentException(
                    "No Internal examinations configured for subject "
                            + subjectId
                            + ", semester "
                            + semester
                            + " and section "
                            + studentSection
            );
        }

        if (
                !hasFinal
        ) {
            throw new IllegalArgumentException(
                    "Final examination is not configured for subject "
                            + subjectId
                            + ", semester "
                            + semester
                            + " and section "
                            + studentSection
            );
        }

        boolean allMarksAvailable =
                examinations.size()
                        == markByExamId.size();

        BigDecimal internalContribution =
                null;

        BigDecimal finalContribution =
                null;

        BigDecimal subjectTotal =
                null;

        if (
                allMarksAvailable
        ) {

            internalContribution =
                    calculateWeightedContribution(
                            internalObtained,
                            internalMaximum,
                            INTERNAL_WEIGHT
                    );

            finalContribution =
                    calculateWeightedContribution(
                            finalObtained,
                            finalMaximum,
                            FINAL_WEIGHT
                    );

            subjectTotal =
                    internalContribution
                            .add(
                                    finalContribution
                            )
                            .setScale(
                                    2,
                                    RoundingMode.HALF_UP
                            );
        }

        return new SubjectMarksResult(
                studentId,
                subjectId,
                semester,
                examMarks,
                internalObtained,
                internalMaximum,
                internalContribution,
                finalObtained,
                finalMaximum,
                finalContribution,
                subjectTotal,
                allMarksAvailable
        );
    }

    // =========================================================
    // SEMESTER SGPA
    // =========================================================

    public SemesterSGPAResult calculateSemesterSGPA(
            String studentId,
            Integer semester) {

        Student student =
                requireStudent(
                        studentId
                );

        if (
                semester == null
                        || semester <= 0
        ) {
            throw new IllegalArgumentException(
                    "Semester must be greater than 0"
            );
        }

        if (
                student.getCourse() == null
                        || student.getCourse()
                        .getCourseId() == null
        ) {
            throw new IllegalArgumentException(
                    "Student is not enrolled in a course"
            );
        }

        String courseId =
                student.getCourse()
                        .getCourseId();

        String studentSection =
                normalizeSection(
                        student.getSection()
                );

        if (
                studentSection.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Student section is not configured"
            );
        }

        List<Subject> courseSubjects =
                subjectRepository
                        .findByCourse_CourseId(
                                courseId
                        );

        if (
                courseSubjects.isEmpty()
        ) {
            throw new IllegalArgumentException(
                    "No subjects found for the student's course"
            );
        }

        List<SubjectScore> subjectScores =
                new ArrayList<>();

        BigDecimal totalSubjectScores =
                BigDecimal.ZERO;

        for (
                Subject subject :
                courseSubjects
        ) {

            if (
                    subject == null
                            || subject.getSubjectId()
                            == null
            ) {
                continue;
            }

            List<Examination> allExaminations =
                    examinationRepository
                            .findBySubject_SubjectIdAndSemesterOrderByInternalNumberAsc(
                                    subject.getSubjectId(),
                                    semester
                            );

            /*
             * Only examinations belonging to the student's
             * section are considered.
             */
            List<Examination> examinations =
                    allExaminations.stream()
                            .filter(
                                    examination ->
                                            studentSection.equalsIgnoreCase(
                                                    normalizeSection(
                                                            examination
                                                                    .getSection()
                                                    )
                                            )
                            )
                            .toList();

            /*
             * A subject configured for another section must not
             * accidentally become part of this student's SGPA.
             */
            if (
                    examinations.isEmpty()
            ) {
                continue;
            }

            SubjectMarksResult result =
                    getStudentSubjectMarks(
                            studentId,
                            subject.getSubjectId(),
                            semester
                    );

            if (
                    !result.allMarksAvailable()
                            || result.subjectTotal()
                            == null
            ) {
                throw new IllegalArgumentException(
                        "Marks are incomplete for subject "
                                + subject.getSubjectId()
                                + " in semester "
                                + semester
                );
            }

            BigDecimal subjectTotal =
                    result.subjectTotal();

            subjectScores.add(
                    new SubjectScore(
                            subject.getSubjectId(),
                            result.examinations(),
                            subjectTotal
                    )
            );

            totalSubjectScores =
                    totalSubjectScores.add(
                            subjectTotal
                    );
        }

        if (
                subjectScores.isEmpty()
        ) {
            throw new IllegalArgumentException(
                    "No configured examination subjects found for student "
                            + studentId
                            + " in semester "
                            + semester
                            + " and section "
                            + studentSection
            );
        }

        BigDecimal sgpa =
                totalSubjectScores.divide(
                        BigDecimal.valueOf(
                                subjectScores.size()
                        ),
                        2,
                        RoundingMode.HALF_UP
                );

        return new SemesterSGPAResult(
                studentId,
                semester,
                subjectScores.size(),
                subjectScores,
                sgpa
        );
    }

    // =========================================================
    // VALIDATION
    // =========================================================

    private Student requireStudent(
            String studentId) {

        if (
                studentId == null
                        || studentId.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Student ID is required"
            );
        }

        return studentRepository
                .findById(
                        studentId
                )
                .orElseThrow(
                        () ->
                                new IllegalArgumentException(
                                        "Student not found: "
                                                + studentId
                                )
                );
    }

    private Examination requireExamination(
            String examId) {

        if (
                examId == null
                        || examId.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Exam ID is required"
            );
        }

        return examinationRepository
                .findById(
                        examId
                )
                .orElseThrow(
                        () ->
                                new IllegalArgumentException(
                                        "Examination not found: "
                                                + examId
                                )
                );
    }

    private void requireProfessorId(
            String professorId) {

        if (
                professorId == null
                        || professorId.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Professor ID is required"
            );
        }
    }

    /**
     * Verifies that the supplied professor is the professor
     * assigned to the examination.
     *
     * The supplied professor ID is expected to come from the
     * authenticated Spring Security principal in the controller.
     */
    private void requireProfessorAssignment(
            Examination examination,
            String professorId) {

        requireProfessorId(
                professorId
        );

        if (
                examination.getProfessor() == null
                        || examination
                        .getProfessor()
                        .getProfId() == null
        ) {
            throw new IllegalArgumentException(
                    "No professor is assigned to this examination"
            );
        }

        if (
                !examination
                        .getProfessor()
                        .getProfId()
                        .equals(
                                professorId
                        )
        ) {
            throw new IllegalArgumentException(
                    "Professor is not assigned to this examination"
            );
        }
    }

    private String requireExamCourseId(
            Examination examination) {

        if (
                examination.getSubject() == null
        ) {
            throw new IllegalArgumentException(
                    "Examination subject is not configured"
            );
        }

        if (
                examination
                        .getSubject()
                        .getCourse() == null
                        || examination
                        .getSubject()
                        .getCourse()
                        .getCourseId() == null
        ) {
            throw new IllegalArgumentException(
                    "Examination subject is not linked to a course"
            );
        }

        return examination
                .getSubject()
                .getCourse()
                .getCourseId();
    }

    private Integer requireExamSemester(
            Examination examination) {

        if (
                examination.getSemester() == null
                        || examination.getSemester()
                        <= 0
        ) {
            throw new IllegalArgumentException(
                    "Examination semester is invalid"
            );
        }

        return examination.getSemester();
    }

    private String requireExamSection(
            Examination examination) {

        String section =
                normalizeSection(
                        examination.getSection()
                );

        if (
                section.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Examination section is not configured"
            );
        }

        return section;
    }

    /**
     * Exact student scope validation:
     *
     *   Student Course == Examination Course
     *   Student Semester == Examination Semester
     *   Student Section == Examination Section
     */
    private void validateStudentBelongsToExamSection(
            Student student,
            Examination examination,
            String requestedSection) {

        String examSection =
                requireExamSection(
                        examination
                );

        String requested =
                normalizeSection(
                        requestedSection
                );

        if (
                requested.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Section is required"
            );
        }

        if (
                !examSection.equalsIgnoreCase(
                        requested
                )
        ) {
            throw new IllegalArgumentException(
                    "The requested section does not belong to this examination"
            );
        }

        String examCourseId =
                requireExamCourseId(
                        examination
                );

        Integer examSemester =
                requireExamSemester(
                        examination
                );

        if (
                student.getCourse() == null
                        || student
                        .getCourse()
                        .getCourseId() == null
                        || !examCourseId.equals(
                                student
                                        .getCourse()
                                        .getCourseId()
                        )
        ) {
            throw new IllegalArgumentException(
                    "Student does not belong to the course of this examination"
            );
        }

        if (
                !Objects.equals(
                        examSemester,
                        student.getSemester()
                )
        ) {
            throw new IllegalArgumentException(
                    "Student does not belong to the semester of this examination"
            );
        }

        String studentSection =
                normalizeSection(
                        student.getSection()
                );

        if (
                studentSection.isBlank()
                        || !examSection.equalsIgnoreCase(
                                studentSection
                        )
        ) {
            throw new IllegalArgumentException(
                    "Student does not belong to the section of this examination"
            );
        }
    }

    private void validateStudentBelongsToSubjectCourse(
            Student student,
            Examination examination) {

        String examCourseId =
                requireExamCourseId(
                        examination
                );

        if (
                student.getCourse() == null
                        || student
                        .getCourse()
                        .getCourseId() == null
                        || !examCourseId.equals(
                                student
                                        .getCourse()
                                        .getCourseId()
                        )
        ) {
            throw new IllegalArgumentException(
                    "Student does not belong to the course of this subject"
            );
        }
    }

    private void validateStudentMarkStructure(
            StudentMark studentMark) {

        if (
                studentMark == null
        ) {
            throw new IllegalArgumentException(
                    "Student mark data is required"
            );
        }

        if (
                studentMark.getStudent() == null
        ) {
            throw new IllegalArgumentException(
                    "Student is required"
            );
        }

        if (
                studentMark.getExamination() == null
        ) {
            throw new IllegalArgumentException(
                    "Examination is required"
            );
        }

        if (
                studentMark.getMarksObtained() == null
        ) {
            throw new IllegalArgumentException(
                    "Marks obtained is required"
            );
        }
    }

    private void validateMarks(
            StudentMark studentMark) {

        validateStudentMarkStructure(
                studentMark
        );

        BigDecimal marksObtained =
                studentMark.getMarksObtained();

        if (
                marksObtained.compareTo(
                        BigDecimal.ZERO
                ) < 0
        ) {
            throw new IllegalArgumentException(
                    "Marks obtained cannot be negative"
            );
        }

        Integer maxMarks =
                studentMark
                        .getExamination()
                        .getMaxMarks();

        if (
                maxMarks == null
                        || maxMarks <= 0
        ) {
            throw new IllegalArgumentException(
                    "Examination maximum marks must be greater than 0"
            );
        }

        BigDecimal maximum =
                BigDecimal.valueOf(
                        maxMarks
                );

        if (
                marksObtained.compareTo(
                        maximum
                ) > 0
        ) {
            throw new IllegalArgumentException(
                    "Marks obtained cannot exceed maximum marks of the examination"
            );
        }
    }

    private BigDecimal calculateWeightedContribution(
            BigDecimal obtained,
            BigDecimal maximum,
            BigDecimal weight) {

        if (
                maximum.compareTo(
                        BigDecimal.ZERO
                ) == 0
        ) {
            throw new IllegalArgumentException(
                    "Maximum marks cannot be zero during calculation"
            );
        }

        return obtained
                .divide(
                        maximum,
                        6,
                        RoundingMode.HALF_UP
                )
                .multiply(
                        weight
                )
                .setScale(
                        2,
                        RoundingMode.HALF_UP
                );
    }

    private String normalizeSection(
            String section) {

        if (
                section == null
        ) {
            return "";
        }

        return section
                .trim()
                .toUpperCase(
                        Locale.ROOT
                );
    }

    // =========================================================
    // RESPONSE TYPES
    // =========================================================

    public record MarkEntry(
            String studentId,
            BigDecimal marksObtained
    ) {
    }

    public record ExamMark(
            String examId,
            ExamType examType,
            Integer internalNumber,
            Integer maxMarks,
            BigDecimal marksObtained
    ) {
    }

    public record SubjectMarksResult(
            String studentId,
            String subjectId,
            Integer semester,
            List<ExamMark> examinations,
            BigDecimal internalObtained,
            BigDecimal internalMaximum,
            BigDecimal internalContribution,
            BigDecimal finalObtained,
            BigDecimal finalMaximum,
            BigDecimal finalContribution,
            BigDecimal subjectTotal,
            boolean allMarksAvailable
    ) {
    }

    public record SubjectScore(
            String subjectId,
            List<ExamMark> examinations,
            BigDecimal subjectTotal
    ) {
    }

    public record SemesterSGPAResult(
            String studentId,
            Integer semester,
            int subjectCount,
            List<SubjectScore> subjects,
            BigDecimal sgpa
    ) {
    }
}