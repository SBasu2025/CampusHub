package com.campushub.backend.service;

import com.campushub.backend.dto.AttendanceSummary;
import com.campushub.backend.entity.Attendance;
import com.campushub.backend.entity.ClassSession;
import com.campushub.backend.entity.Department;
import com.campushub.backend.entity.Examination;
import com.campushub.backend.entity.Professor;
import com.campushub.backend.entity.StaffAttendance;
import com.campushub.backend.entity.Student;
import com.campushub.backend.entity.Teaching;
import com.campushub.backend.repository.AdminRepository;
import com.campushub.backend.repository.ClassSessionRepository;
import com.campushub.backend.repository.ExaminationRepository;
import com.campushub.backend.repository.DepartmentRepository;
import com.campushub.backend.repository.ProfessorRepository;
import com.campushub.backend.repository.StudentRepository;
import com.campushub.backend.repository.TeachingRepository;
import com.campushub.backend.security.CampusHubIdGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ProfessorService {

    private final ProfessorRepository professorRepository;
    private final AdminRepository adminRepository;
    private final DepartmentRepository departmentRepository;
    private final TeachingRepository teachingRepository;
    private final ClassSessionRepository classSessionRepository;
    private final StudentRepository studentRepository;
    private final ExaminationRepository examinationRepository;
    private final ClassSessionService classSessionService;
    private final ExaminationService examinationService;
    private final StaffAttendanceService staffAttendanceService;
    private final AttendanceService attendanceService;
    private final CampusHubIdGenerator idGenerator;

    public ProfessorService(
            ProfessorRepository professorRepository,
            AdminRepository adminRepository,
            DepartmentRepository departmentRepository,
            TeachingRepository teachingRepository,
            ClassSessionRepository classSessionRepository,
            StudentRepository studentRepository,
            ExaminationRepository examinationRepository,
            StaffAttendanceService staffAttendanceService,
            AttendanceService attendanceService,
            ClassSessionService classSessionService,
            ExaminationService examinationService,
            CampusHubIdGenerator idGenerator) {

        this.professorRepository = professorRepository;
        this.adminRepository = adminRepository;
        this.departmentRepository = departmentRepository;
        this.teachingRepository = teachingRepository;
        this.classSessionRepository = classSessionRepository;
        this.studentRepository = studentRepository;
        this.examinationRepository = examinationRepository;
        this.staffAttendanceService = staffAttendanceService;
        this.attendanceService = attendanceService;
        this.classSessionService = classSessionService;
        this.examinationService = examinationService;
        this.idGenerator = idGenerator;
    }

    // -------------------------------------------------------------------------
    // PROFESSOR RETRIEVAL
    // -------------------------------------------------------------------------

    public List<Professor> getAllProfessors() {
        return professorRepository.findAll();
    }

    public List<Professor> getProfessorsByDepartment(String deptId) {
        return professorRepository.findByDepartment_DeptId(deptId);
    }

    public Optional<Professor> getProfessorById(String id) {
        return professorRepository.findById(id);
    }

    // -------------------------------------------------------------------------
    // CREATE / UPDATE PROFESSOR
    // -------------------------------------------------------------------------

    public Professor saveProfessor(Professor professor) {

        if (professor == null) {
            throw new IllegalArgumentException(
                    "Professor data is required."
            );
        }

        if (professor.getProfessorName() == null ||
                professor.getProfessorName().isBlank()) {

            throw new IllegalArgumentException(
                    "Professor name is required."
            );
        }

        /*
         * OTP login requires every professor account to have
         * a registered phone number.
         */
        if (professor.getPhoneNumber() == null ||
                professor.getPhoneNumber().isBlank()) {

            throw new IllegalArgumentException(
                    "Phone number is required."
            );
        }

        String phoneNumber =
                professor.getPhoneNumber().trim();

        professor.setPhoneNumber(phoneNumber);

        /*
         * One phone number may belong to only ONE CampusHub account.
         *
         * Existing professor is excluded during an update so that
         * the professor can keep their own existing number.
         */
        String professorIdForPhoneCheck =
                professor.getProfId();

        boolean updatingExistingProfessor =
                professorIdForPhoneCheck != null
                        && !professorIdForPhoneCheck.isBlank()
                        && professorRepository.existsById(
                                professorIdForPhoneCheck
                        );

        if (updatingExistingProfessor) {

            if (professorRepository
                    .existsByPhoneNumberAndProfIdNot(
                            phoneNumber,
                            professorIdForPhoneCheck)) {

                throw new IllegalArgumentException(
                        "Phone number is already registered to another professor."
                );
            }

        } else {

            if (professorRepository
                    .existsByPhoneNumber(phoneNumber)) {

                throw new IllegalArgumentException(
                        "Phone number is already registered to another professor."
                );
            }
        }

        /*
         * Check against admins.
         */
        if (adminRepository
                .existsByPhoneNumber(phoneNumber)) {

            throw new IllegalArgumentException(
                    "Phone number is already registered to an admin."
            );
        }

        /*
         * Check against students.
         */
        if (studentRepository
                .existsByPhoneNumber(phoneNumber)) {

            throw new IllegalArgumentException(
                    "Phone number is already registered to a student."
            );
        }

        if (professor.getDepartment() == null ||
                professor.getDepartment().getDeptId() == null ||
                professor.getDepartment().getDeptId().isBlank()) {

            throw new IllegalArgumentException(
                    "Department is required for a professor."
            );
        }

        String deptId =
                professor.getDepartment().getDeptId();

        Department department =
                departmentRepository.findById(deptId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Department not found: " + deptId
                                ));

        professor.setDepartment(department);

        /*
         * Existing professor = update.
         * New professor = generate the ID automatically.
         */
        String professorId =
                professor.getProfId();

        if (professorId != null
                && !professorId.isBlank()
                && professorRepository.existsById(professorId)) {

            Professor existingProfessor =
                    professorRepository.findById(professorId)
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "Professor not found: "
                                                    + professorId
                                    ));

            /*
             * Preserve active/inactive state during ordinary
             * profile updates.
             */
            professor.setActive(
                    existingProfessor.isActive()
            );

        } else {

            /*
             * Ignore any manually supplied ID for a new professor.
             * The system generates the ID automatically.
             */
            professor.setProfId(
                    generateUniqueProfessorId()
            );

            /*
             * New professors are active by default.
             */
            professor.setActive(true);
        }

        return professorRepository.save(professor);
    }

    // -------------------------------------------------------------------------
    // ACTIVATE / DEACTIVATE PROFESSOR
    // -------------------------------------------------------------------------

    public Professor setProfessorActive(
            String id,
            boolean active) {

        Professor professor =
                professorRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Professor not found: " + id
                                ));

        professor.setActive(active);

        return professorRepository.save(professor);
    }

    // -------------------------------------------------------------------------
    // TEACHING ASSIGNMENTS
    // -------------------------------------------------------------------------

    public List<Teaching> getTeachingAssignments(String profId) {

        if (professorRepository.findById(profId).isEmpty()) {
            throw new IllegalArgumentException(
                    "Professor not found: " + profId
            );
        }

        return teachingRepository.findByProfessor_ProfId(profId);
    }

    // -------------------------------------------------------------------------
    // PROFESSOR TIMETABLE
    // -------------------------------------------------------------------------

    public List<ClassSession> getProfessorTimetable(String profId) {

        if (professorRepository.findById(profId).isEmpty()) {
            throw new IllegalArgumentException(
                    "Professor not found: " + profId
            );
        }

        return classSessionRepository
                .findByTeaching_IdProfId(profId);
    }

    // -------------------------------------------------------------------------
    // STUDENTS FOR CLASS SESSION
    // -------------------------------------------------------------------------

    public List<Student> getStudentsForClassSession(
            String profId,
            String sessionId) {

        Professor professor =
                professorRepository.findById(profId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Professor not found: " + profId
                                ));

        ClassSession classSession =
                classSessionRepository.findById(sessionId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Class session not found: " + sessionId
                                ));

        if (classSession.getTeaching() == null ||
                classSession.getTeaching().getProfessor() == null ||
                classSession.getTeaching().getProfessor().getProfId() == null) {

            throw new IllegalStateException(
                    "Class session has no valid teaching assignment."
            );
        }

        String sessionProfessorId =
                classSession.getTeaching()
                        .getProfessor()
                        .getProfId();

        if (!professor.getProfId().equals(sessionProfessorId)) {
            throw new IllegalStateException(
                    "Professor is not assigned to this class session."
            );
        }

        if (classSession.getCourse() == null ||
                classSession.getCourse().getCourseId() == null) {

            throw new IllegalStateException(
                    "Class session course is not set."
            );
        }

        if (classSession.getSection() == null ||
                classSession.getSection().isBlank()) {

            throw new IllegalStateException(
                    "Class session section is not set."
            );
        }

        if (classSession.getSemester() == null) {

            throw new IllegalStateException(
                    "Class session semester is not set."
            );
        }

        return studentRepository
                .findByCourse_CourseIdAndSectionAndSemester(
                        classSession.getCourse().getCourseId(),
                        classSession.getSection(),
                        classSession.getSemester()
                );
    }

    // -------------------------------------------------------------------------
    // MARK ATTENDANCE
    // -------------------------------------------------------------------------

    public Attendance markAttendance(
            String profId,
            String sessionId,
            String studentId,
            String status) {

        Professor professor =
                professorRepository.findById(profId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Professor not found: " + profId
                                ));

        ClassSession classSession =
                classSessionRepository.findById(sessionId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Class session not found: " + sessionId
                                ));

        Student student =
                studentRepository.findById(studentId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Student not found: " + studentId
                                ));

        // Professor must own this class session.
        if (classSession.getTeaching() == null ||
                classSession.getTeaching().getProfessor() == null ||
                classSession.getTeaching().getProfessor().getProfId() == null) {

            throw new IllegalStateException(
                    "Class session has no valid teaching assignment."
            );
        }

        String sessionProfessorId =
                classSession.getTeaching()
                        .getProfessor()
                        .getProfId();

        if (!professor.getProfId().equals(sessionProfessorId)) {

            throw new IllegalStateException(
                    "Professor is not assigned to this class session."
            );
        }

        /*
         * AttendanceService performs the complete validation:
         *
         * Course + Section + Semester must match
         * AND
         * status must be Present or Absent.
         */
        Attendance attendance = new Attendance();

        attendance.setClassSession(classSession);
        attendance.setStudent(student);
        attendance.setStatus(status);

        return attendanceService.saveAttendance(attendance);
    }

    // -------------------------------------------------------------------------
    // SESSION COUNT
    // -------------------------------------------------------------------------

    public long getSessionCountForSubject(
            String profId,
            String subjectId) {

        if (professorRepository.findById(profId).isEmpty()) {
            throw new IllegalArgumentException(
                    "Professor not found: " + profId
            );
        }

        if (subjectId == null || subjectId.isBlank()) {
            throw new IllegalArgumentException(
                    "Subject ID is required."
            );
        }

        return classSessionRepository
                .countByTeaching_IdProfIdAndTeaching_IdSubjectId(
                        profId,
                        subjectId
                );
    }

    // -------------------------------------------------------------------------
    // SUBJECT ATTENDANCE SUMMARY
    // -------------------------------------------------------------------------

    public List<AttendanceSummary> getSubjectAttendanceSummary(
            String profId,
            String subjectId) {

        Professor professor =
                professorRepository.findById(profId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Professor not found: " + profId
                                ));

        List<Teaching> teachingAssignments =
                teachingRepository
                        .findByProfessor_ProfId(professor.getProfId());

        Teaching matchingTeaching = null;

        for (Teaching teaching : teachingAssignments) {

            if (teaching.getSubject() == null ||
                    teaching.getSubject().getSubjectId() == null) {
                continue;
            }

            if (teaching.getSubject()
                    .getSubjectId()
                    .equals(subjectId)) {

                matchingTeaching = teaching;
                break;
            }
        }

        if (matchingTeaching == null) {
            throw new IllegalArgumentException(
                    "Professor is not assigned to this subject."
            );
        }

        List<ClassSession> classSessions =
                classSessionRepository
                        .findByTeaching_IdProfIdAndTeaching_IdSubjectId(
                                profId,
                                subjectId
                        );

        Map<String, Student> students =
                new LinkedHashMap<>();

        for (ClassSession classSession : classSessions) {

            if (classSession.getCourse() == null ||
                    classSession.getCourse().getCourseId() == null ||
                    classSession.getSection() == null ||
                    classSession.getSemester() == null) {
                continue;
            }

            List<Student> sessionStudents =
                    studentRepository
                            .findByCourse_CourseIdAndSectionAndSemester(
                                    classSession.getCourse().getCourseId(),
                                    classSession.getSection(),
                                    classSession.getSemester()
                            );

            for (Student student : sessionStudents) {

                students.put(
                        student.getStudentId(),
                        student
                );
            }
        }

        List<AttendanceSummary> summaries =
                new ArrayList<>();

        for (Student student : students.values()) {

            List<Attendance> attendanceRecords =
                    attendanceService
                            .getAttendanceByStudent(
                                    student.getStudentId()
                            );

            long totalSessions =
                    classSessions.stream()
                            .filter(classSession ->
                                    classSession.getCourse() != null &&
                                    classSession.getCourse().getCourseId() != null &&
                                    classSession.getSection() != null &&
                                    classSession.getSemester() != null &&
                                    student.getCourse() != null &&
                                    student.getCourse().getCourseId() != null &&
                                    student.getCourse().getCourseId()
                                            .equals(
                                                    classSession.getCourse()
                                                            .getCourseId()
                                            ) &&
                                    student.getSection()
                                            .equals(
                                                    classSession.getSection()
                                            ) &&
                                    student.getSemester()
                                            .equals(
                                                    classSession.getSemester()
                                            ))
                            .count();

            long presentSessions =
                    attendanceRecords.stream()
                            .filter(attendance ->
                                    attendance.getClassSession() != null &&
                                    attendance.getClassSession().getSessionId() != null &&
                                    classSessions.stream()
                                            .anyMatch(session ->
                                                    session.getSessionId()
                                                            .equals(
                                                                    attendance
                                                                            .getClassSession()
                                                                            .getSessionId()
                                                            )) &&
                                    attendance.getStatus() != null &&
                                    attendance.getStatus()
                                            .equalsIgnoreCase("Present"))
                            .count();

            long absentSessions =
                    totalSessions - presentSessions;

            double attendancePercentage = 0.0;

            if (totalSessions > 0) {
                attendancePercentage =
                        (presentSessions * 100.0)
                                / totalSessions;
            }

            String subjectName =
                    matchingTeaching.getSubject()
                            .getSubjectName();

            summaries.add(
                    new AttendanceSummary(
                            student.getStudentId(),
                            student.getStudentName(),
                            subjectId,
                            subjectName,
                            totalSessions,
                            presentSessions,
                            absentSessions,
                            attendancePercentage
                    )
            );
        }

        return summaries;
    }

    // -------------------------------------------------------------------------
    // OWN STAFF ATTENDANCE
    // -------------------------------------------------------------------------

    public List<StaffAttendance> getOwnStaffAttendance(
            String profId) {

        if (professorRepository.findById(profId).isEmpty()) {
            throw new IllegalArgumentException(
                    "Professor not found: " + profId
            );
        }

        return staffAttendanceService
                .getStaffAttendancesByProfessor(profId);
    }

    // -------------------------------------------------------------------------
    // DELETE
    // -------------------------------------------------------------------------

    @Transactional
    public void deleteProfessorById(String id) {

        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException(
                    "Professor ID is required."
            );
        }

        if (!professorRepository.existsById(id)) {
            throw new IllegalArgumentException(
                    "Professor not found: " + id
            );
        }

        /*
         * STAFF_ATTENDANCE references PROFESSOR.
         */
        List<StaffAttendance> staffAttendances =
                staffAttendanceService
                        .getStaffAttendancesByProfessor(id);

        for (StaffAttendance attendance : staffAttendances) {

            if (attendance != null
                    && attendance.getAttendanceId() != null
                    && !attendance.getAttendanceId().isBlank()) {

                staffAttendanceService.deleteStaffAttendanceById(
                        attendance.getAttendanceId()
                );
            }
        }

        /*
         * EXAMINATION references PROFESSOR, while STUDENT_MARK
         * references EXAMINATION.
         *
         * ExaminationService.deleteExamination() removes the
         * StudentMark rows first and then removes the examination.
         */
        List<Examination> examinations =
                examinationRepository.findByProfessor_ProfId(id);

        for (Examination examination : examinations) {

            if (examination != null
                    && examination.getExamId() != null
                    && !examination.getExamId().isBlank()) {

                examinationService.deleteExamination(
                        examination.getExamId()
                );
            }
        }

        /*
         * CLASS_SESSION references the composite TEACHING key,
         * while ATTENDANCE references CLASS_SESSION.
         *
         * ClassSessionService.deleteClassSessionById() removes
         * attendance first and then deletes the session.
         */
        List<ClassSession> classSessions =
                classSessionRepository.findByTeaching_IdProfId(id);

        for (ClassSession classSession : classSessions) {

            if (classSession != null
                    && classSession.getSessionId() != null
                    && !classSession.getSessionId().isBlank()) {

                classSessionService.deleteClassSessionById(
                        classSession.getSessionId()
                );
            }
        }

        /*
         * Now remove the professor's teaching assignments.
         */
        List<Teaching> teachingAssignments =
                teachingRepository.findByProfessor_ProfId(id);

        for (Teaching teaching : teachingAssignments) {

            if (teaching != null) {
                teachingRepository.delete(teaching);
            }
        }

        /*
         * All dependent records are now removed, so the
         * PROFESSOR record can be safely deleted.
         */
        professorRepository.deleteById(id);
    }

    // -------------------------------------------------------------------------
    // AUTOMATIC ID GENERATION
    // -------------------------------------------------------------------------

    private String generateUniqueProfessorId() {

        for (int attempt = 0; attempt < 10; attempt++) {

            String generatedId =
                    idGenerator.generateProfessorId();

            if (!professorRepository.existsById(generatedId)) {
                return generatedId;
            }
        }

        throw new IllegalStateException(
                "Unable to generate a unique Professor ID."
        );
    }
}