package com.campushub.backend.service;

import com.campushub.backend.dto.AttendanceSummary;
import com.campushub.backend.entity.Attendance;
import com.campushub.backend.entity.ClassSession;
import com.campushub.backend.entity.Course;
import com.campushub.backend.entity.Professor;
import com.campushub.backend.entity.SelectsSubject;
import com.campushub.backend.entity.Student;
import com.campushub.backend.entity.Teaching;
import com.campushub.backend.repository.AdminRepository;
import com.campushub.backend.repository.AttendanceRepository;
import com.campushub.backend.repository.ClassSessionRepository;
import com.campushub.backend.repository.CourseRepository;
import com.campushub.backend.repository.SelectsSubjectRepository;
import com.campushub.backend.repository.StudentMarkRepository;
import com.campushub.backend.repository.StudentRepository;
import com.campushub.backend.repository.TeachingRepository;
import com.campushub.backend.repository.ProfessorRepository;
import com.campushub.backend.security.CampusHubIdGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class StudentService {

    /*
     * CampusHub programs run for a fixed 8 semesters.
     *
     * This is also used as the upper bound for promoteStudent()
     * below, so a student already in Semester 8 cannot be
     * promoted into a Semester 9 that no course, timetable or
     * examination configuration will ever recognize.
     */
    private static final int MAX_SEMESTER = 8;

    private final StudentRepository studentRepository;
    private final AdminRepository adminRepository;
    private final ProfessorRepository professorRepository;
    private final CourseRepository courseRepository;
    private final ClassSessionRepository classSessionRepository;
    private final SelectsSubjectRepository selectsSubjectRepository;
    private final TeachingRepository teachingRepository;
    private final AttendanceRepository attendanceRepository;
    private final StudentMarkRepository studentMarkRepository;
    private final AttendanceService attendanceService;
    private final CampusHubIdGenerator idGenerator;

    public StudentService(
            StudentRepository studentRepository,
            AdminRepository adminRepository,
            ProfessorRepository professorRepository,
            CourseRepository courseRepository,
            ClassSessionRepository classSessionRepository,
            SelectsSubjectRepository selectsSubjectRepository,
            TeachingRepository teachingRepository,
            AttendanceRepository attendanceRepository,
            StudentMarkRepository studentMarkRepository,
            AttendanceService attendanceService,
            CampusHubIdGenerator idGenerator) {

        this.studentRepository = studentRepository;
        this.adminRepository = adminRepository;
        this.professorRepository = professorRepository;
        this.courseRepository = courseRepository;
        this.classSessionRepository = classSessionRepository;
        this.selectsSubjectRepository = selectsSubjectRepository;
        this.teachingRepository = teachingRepository;
        this.attendanceRepository = attendanceRepository;
        this.studentMarkRepository = studentMarkRepository;
        this.attendanceService = attendanceService;
        this.idGenerator = idGenerator;
    }

    // -------------------------------------------------------------------------
    // STUDENT RETRIEVAL
    // -------------------------------------------------------------------------

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public List<Student> getStudentsByCourse(String courseId) {

        if (courseId == null || courseId.isBlank()) {
            throw new IllegalArgumentException(
                    "Course ID is required"
            );
        }

        return studentRepository.findByCourse_CourseId(courseId);
    }

    public List<Student> getStudentsBySection(String section) {

        if (section == null || section.isBlank()) {
            throw new IllegalArgumentException(
                    "Section is required"
            );
        }

        return studentRepository.findBySection(section);
    }

    public List<Student> getStudentsBySemester(Integer semester) {

        validateSemester(semester);

        return studentRepository.findBySemester(semester);
    }

    /*
     * Combined filter required by the examination workflow:
     *
     * Course + Section + Semester
     */
    public List<Student> getStudentsByCourseSectionSemester(
            String courseId,
            String section,
            Integer semester) {

        if (courseId == null || courseId.isBlank()) {
            throw new IllegalArgumentException(
                    "Course ID is required"
            );
        }

        if (section == null || section.isBlank()) {
            throw new IllegalArgumentException(
                    "Section is required"
            );
        }

        validateSemester(semester);

        return studentRepository
                .findByCourse_CourseIdAndSectionAndSemester(
                        courseId,
                        section,
                        semester
                );
    }

    public Optional<Student> getStudentById(String id) {

        if (id == null || id.isBlank()) {
            return Optional.empty();
        }

        return studentRepository.findById(id);
    }

    // -------------------------------------------------------------------------
    // CREATE / UPDATE
    // -------------------------------------------------------------------------

    public Student saveStudent(Student student) {

        if (student == null) {
            throw new IllegalArgumentException(
                    "Student data is required."
            );
        }

        if (student.getStudentName() == null
                || student.getStudentName().isBlank()) {

            throw new IllegalArgumentException(
                    "Student name is required."
            );
        }

        /*
         * OTP login requires a student phone number.
         */
        if (student.getPhoneNumber() == null
                || student.getPhoneNumber().isBlank()) {

            throw new IllegalArgumentException(
                    "Phone number is required."
            );
        }

        /*
         * Normalize accidental spaces before checking uniqueness.
         */
        String phoneNumber =
                student.getPhoneNumber().trim();

        student.setPhoneNumber(phoneNumber);

        if (student.getSection() == null
                || student.getSection().isBlank()) {

            throw new IllegalArgumentException(
                    "Section is required."
            );
        }

        validateSemester(student.getSemester());

        if (student.getCourse() == null
                || student.getCourse().getCourseId() == null
                || student.getCourse().getCourseId().isBlank()) {

            throw new IllegalArgumentException(
                    "Course is required for a student."
            );
        }

        String courseId =
                student.getCourse().getCourseId();

        Course course =
                courseRepository.findById(courseId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Course not found: " + courseId
                                ));

        student.setCourse(course);

        /*
         * Existing student = update.
         * New student = generate the ID automatically.
         */
        String studentId =
                student.getStudentId();

        boolean updatingExistingStudent =
                studentId != null
                        && !studentId.isBlank()
                        && studentRepository.existsById(studentId);

        /*
         * ---------------------------------------------------------
         * GLOBAL PHONE NUMBER UNIQUENESS
         * ---------------------------------------------------------
         *
         * One phone number may belong to only ONE CampusHub account.
         *
         * Therefore the same number cannot be used by:
         *
         * ADMIN
         * PROFESSOR
         * STUDENT
         *
         * When updating a student, the student's own existing
         * phone number is excluded from the Student table check.
         */

        if (updatingExistingStudent) {

            if (studentRepository
                    .existsByPhoneNumberAndStudentIdNot(
                            phoneNumber,
                            studentId)) {

                throw new IllegalArgumentException(
                        "Phone number is already registered to another student."
                );
            }

            if (professorRepository
                    .existsByPhoneNumber(phoneNumber)) {

                throw new IllegalArgumentException(
                        "Phone number is already registered to a professor."
                );
            }

            if (adminRepository
                    .existsByPhoneNumber(phoneNumber)) {

                throw new IllegalArgumentException(
                        "Phone number is already registered to an admin."
                );
            }

            Student existingStudent =
                    studentRepository.findById(studentId)
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "Student not found: " + studentId
                                    ));

            /*
             * Preserve active/inactive state during normal profile updates.
             * Status changes should happen through the dedicated operation.
             */
            student.setActive(
                    existingStudent.isActive()
            );

        } else {

            /*
             * New student:
             * Check the phone number against every account type.
             */
            if (studentRepository
                    .existsByPhoneNumber(phoneNumber)) {

                throw new IllegalArgumentException(
                        "Phone number is already registered to another student."
                );
            }

            if (professorRepository
                    .existsByPhoneNumber(phoneNumber)) {

                throw new IllegalArgumentException(
                        "Phone number is already registered to a professor."
                );
            }

            if (adminRepository
                    .existsByPhoneNumber(phoneNumber)) {

                throw new IllegalArgumentException(
                        "Phone number is already registered to an admin."
                );
            }

            /*
             * Any manually supplied ID for a NEW student is ignored.
             * The system always generates the ID automatically.
             */
            student.setStudentId(
                    generateUniqueStudentId()
            );

            /*
             * New accounts are active by default.
             */
            student.setActive(true);
        }

        return studentRepository.save(student);
    }

    // -------------------------------------------------------------------------
    // PROMOTION
    // -------------------------------------------------------------------------

    public Student promoteStudent(String id) {

        Student student =
                studentRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Student not found: " + id
                                ));

        Integer currentSemester =
                student.getSemester();

        validateSemester(currentSemester);

        /*
         * A student already in Semester 8 cannot be promoted
         * into Semester 9.
         */
        if (currentSemester >= MAX_SEMESTER) {
            throw new IllegalArgumentException(
                    "Student " + id + " is already in Semester "
                            + MAX_SEMESTER
                            + " and cannot be promoted further."
            );
        }

        student.setSemester(
                currentSemester + 1
        );

        return studentRepository.save(student);
    }

    // -------------------------------------------------------------------------
    // ACTIVATE / DEACTIVATE STUDENT
    // -------------------------------------------------------------------------

    public Student setStudentActive(
            String id,
            boolean active) {

        Student student =
                studentRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Student not found: " + id
                                ));

        student.setActive(active);

        return studentRepository.save(student);
    }

    // -------------------------------------------------------------------------
    // TIMETABLE
    // -------------------------------------------------------------------------

    public List<ClassSession> getStudentTimetable(
            String studentId) {

        Student student =
                studentRepository.findById(studentId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Student not found: " + studentId
                                ));

        if (student.getCourse() == null
                || student.getCourse().getCourseId() == null) {

            throw new IllegalStateException(
                    "Student is not enrolled in a course."
            );
        }

        if (student.getSection() == null
                || student.getSection().isBlank()) {

            throw new IllegalStateException(
                    "Student section is not set."
            );
        }

        validateSemester(student.getSemester());

        String courseId =
                student.getCourse().getCourseId();

        String section =
                student.getSection();

        Integer semester =
                student.getSemester();

        return classSessionRepository
                .findByCourse_CourseIdAndSectionAndSemester(
                        courseId,
                        section,
                        semester
                );
    }

    // -------------------------------------------------------------------------
    // ATTENDANCE
    // -------------------------------------------------------------------------

    public List<Attendance> getStudentAttendance(
            String studentId) {

        requireStudent(studentId);

        return attendanceService
                .getAttendanceByStudent(studentId);
    }

    public AttendanceSummary getStudentSubjectAttendance(
            String studentId,
            String subjectId) {

        requireStudent(studentId);

        if (subjectId == null || subjectId.isBlank()) {
            throw new IllegalArgumentException(
                    "Subject ID is required"
            );
        }

        return attendanceService
                .getStudentSubjectAttendanceSummary(
                        studentId,
                        subjectId
                );
    }

    // -------------------------------------------------------------------------
    // SELECTED SUBJECTS
    // -------------------------------------------------------------------------

    public List<SelectsSubject> getStudentSelectedSubjects(
            String studentId) {

        requireStudent(studentId);

        return selectsSubjectRepository
                .findByStudent_StudentId(studentId);
    }

    // -------------------------------------------------------------------------
    // PROFESSORS FOR STUDENT
    // -------------------------------------------------------------------------

    public List<Professor> getProfessorsForStudent(
            String studentId) {

        requireStudent(studentId);

        List<SelectsSubject> selectedSubjects =
                selectsSubjectRepository
                        .findByStudent_StudentId(studentId);

        /*
         * LinkedHashMap removes duplicate professors while preserving
         * discovery order.
         */
        Map<String, Professor> uniqueProfessors =
                new LinkedHashMap<>();

        for (SelectsSubject selection : selectedSubjects) {

            if (selection == null
                    || selection.getSubject() == null
                    || selection.getSubject()
                    .getSubjectId() == null) {

                continue;
            }

            String subjectId =
                    selection.getSubject().getSubjectId();

            List<Teaching> teachings =
                    teachingRepository
                            .findBySubject_SubjectId(subjectId);

            for (Teaching teaching : teachings) {

                if (teaching == null
                        || teaching.getProfessor() == null
                        || teaching.getProfessor()
                        .getProfId() == null) {

                    continue;
                }

                Professor professor =
                        teaching.getProfessor();

                uniqueProfessors.putIfAbsent(
                        professor.getProfId(),
                        professor
                );
            }
        }

        return new ArrayList<>(
                uniqueProfessors.values()
        );
    }

    // -------------------------------------------------------------------------
    // DELETE
    // -------------------------------------------------------------------------

    @Transactional
    public void deleteStudentById(String id) {

        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException(
                    "Student ID is required"
            );
        }

        if (!studentRepository.existsById(id)) {
            throw new IllegalArgumentException(
                    "Student not found: " + id
            );
        }

        /*
         * Delete dependent records first because they reference STUDENT.
         */

        // ATTENDANCE
        attendanceRepository.deleteByStudent_StudentId(id);

        // SELECTS_SUBJECT
        selectsSubjectRepository.deleteByStudent_StudentId(id);

        // STUDENT_MARK
        studentMarkRepository.deleteByStudent_StudentId(id);

        /*
         * Finally delete the parent STUDENT record.
         */
        studentRepository.deleteById(id);
    }

    // -------------------------------------------------------------------------
    // ID GENERATION
    // -------------------------------------------------------------------------

    private String generateUniqueStudentId() {

        for (int attempt = 0; attempt < 10; attempt++) {

            String generatedId =
                    idGenerator.generateStudentId();

            if (!studentRepository.existsById(generatedId)) {
                return generatedId;
            }
        }

        throw new IllegalStateException(
                "Unable to generate a unique Student ID."
        );
    }

    // -------------------------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------------------------

    private Student requireStudent(String studentId) {

        if (studentId == null || studentId.isBlank()) {
            throw new IllegalArgumentException(
                    "Student ID is required"
            );
        }

        return studentRepository.findById(studentId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Student not found: "
                                        + studentId
                        )
                );
    }

    private void validateSemester(Integer semester) {

        /*
         * This validates that a semester is a positive number.
         *
         * Semester 8 remains valid because it is the final semester.
         * The restriction against Semester 9 is specifically enforced
         * inside promoteStudent().
         */
        if (semester == null || semester <= 0) {
            throw new IllegalArgumentException(
                    "Semester must be greater than 0."
            );
        }
    }
}