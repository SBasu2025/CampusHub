package com.campushub.backend.service;

import com.campushub.backend.dto.DashboardAnalytics;
import com.campushub.backend.entity.Admin;
import com.campushub.backend.entity.Attendance;
import com.campushub.backend.entity.AttendanceId;
import com.campushub.backend.entity.StaffAttendance;
import com.campushub.backend.entity.UserSession;
import com.campushub.backend.repository.AdminRepository;
import com.campushub.backend.repository.AttendanceRepository;
import com.campushub.backend.repository.CourseRepository;
import com.campushub.backend.repository.DepartmentRepository;
import com.campushub.backend.repository.ProfessorRepository;
import com.campushub.backend.repository.StudentRepository;
import com.campushub.backend.repository.SubjectRepository;
import com.campushub.backend.security.CampusHubIdGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class AdminService {

    private final AdminRepository adminRepository;
    private final AttendanceService attendanceService;
    private final StaffAttendanceService staffAttendanceService;
    private final AttendanceRepository attendanceRepository;
    private final ProfessorRepository professorRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final SubjectRepository subjectRepository;
    private final DepartmentRepository departmentRepository;
    private final UserSessionService userSessionService;
    private final CampusHubIdGenerator idGenerator;

    /*
     * The Special Admin ID is supplied through environment-backed
     * Spring configuration.
     *
     * The real value is therefore NOT hard-coded in source code.
     */
    @Value("${campushub.demo.special-admin.id:}")
    private String specialAdminId;

    public AdminService(
            AdminRepository adminRepository,
            AttendanceService attendanceService,
            StaffAttendanceService staffAttendanceService,
            AttendanceRepository attendanceRepository,
            ProfessorRepository professorRepository,
            StudentRepository studentRepository,
            CourseRepository courseRepository,
            SubjectRepository subjectRepository,
            DepartmentRepository departmentRepository,
            UserSessionService userSessionService,
            CampusHubIdGenerator idGenerator) {

        this.adminRepository = adminRepository;
        this.attendanceService = attendanceService;
        this.staffAttendanceService = staffAttendanceService;
        this.attendanceRepository = attendanceRepository;
        this.professorRepository = professorRepository;
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.subjectRepository = subjectRepository;
        this.departmentRepository = departmentRepository;
        this.userSessionService = userSessionService;
        this.idGenerator = idGenerator;
    }

    // -------------------------------------------------------------------------
    // ADMIN RETRIEVAL
    // -------------------------------------------------------------------------

    public List<Admin> getAllAdmins() {
        return adminRepository.findAll();
    }

    public Optional<Admin> getAdminById(String id) {
        return adminRepository.findById(id);
    }

    // -------------------------------------------------------------------------
    // CREATE / UPDATE ADMIN
    // -------------------------------------------------------------------------

    public Admin saveAdmin(Admin admin) {

        if (admin == null) {
            throw new IllegalArgumentException(
                    "Admin data is required."
            );
        }

        if (admin.getAdminName() == null
                || admin.getAdminName().isBlank()) {

            throw new IllegalArgumentException(
                    "Admin name is required."
            );
        }

        /*
         * OTP login requires every admin account to have
         * a registered phone number.
         */
        if (admin.getPhoneNumber() == null
                || admin.getPhoneNumber().isBlank()) {

            throw new IllegalArgumentException(
                    "Phone number is required."
            );
        }

        /*
         * Normalize accidental spaces around the phone number
         * before performing uniqueness checks.
         */
        String phoneNumber =
                admin.getPhoneNumber().trim();

        admin.setPhoneNumber(phoneNumber);

        /*
         * Existing admin = update.
         * New admin = generate the ID automatically.
         */
        String adminId = admin.getAdminId();

        boolean updatingExistingAdmin =
                adminId != null
                        && !adminId.isBlank()
                        && adminRepository.existsById(adminId);

        // ---------------------------------------------------------------------
        // GLOBAL PHONE NUMBER UNIQUENESS
        // ---------------------------------------------------------------------
        //
        // The same phone number cannot be used by:
        //
        // ADMIN
        // PROFESSOR
        // STUDENT
        //
        // During an admin update, the current admin's own number
        // is excluded from the ADMIN-table check.
        // ---------------------------------------------------------------------

        if (updatingExistingAdmin) {

            if (adminRepository
                    .existsByPhoneNumberAndAdminIdNot(
                            phoneNumber,
                            adminId
                    )) {

                throw new IllegalArgumentException(
                        "Phone number is already registered to another admin."
                );
            }

        } else {

            if (adminRepository
                    .existsByPhoneNumber(phoneNumber)) {

                throw new IllegalArgumentException(
                        "Phone number is already registered to another admin."
                );
            }
        }

        /*
         * Cross-table check:
         * a phone number already belonging to a professor
         * cannot be assigned to an admin.
         */
        if (professorRepository
                .existsByPhoneNumber(phoneNumber)) {

            throw new IllegalArgumentException(
                    "Phone number is already registered to a professor."
            );
        }

        /*
         * Cross-table check:
         * a phone number already belonging to a student
         * cannot be assigned to an admin.
         */
        if (studentRepository
                .existsByPhoneNumber(phoneNumber)) {

            throw new IllegalArgumentException(
                    "Phone number is already registered to a student."
            );
        }

        // ---------------------------------------------------------------------
        // EXISTING ADMIN / NEW ADMIN
        // ---------------------------------------------------------------------

        if (updatingExistingAdmin) {

            Admin existingAdmin =
                    adminRepository.findById(adminId)
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "Admin not found: "
                                                    + adminId
                                    ));

            /*
             * Preserve active/inactive state during normal
             * profile updates.
             */
            admin.setActive(
                    existingAdmin.isActive()
            );

        } else {

            /*
             * Any manually supplied ID for a NEW admin is ignored.
             * The system generates the ID automatically.
             */
            admin.setAdminId(
                    generateUniqueAdminId()
            );

            /*
             * New admins are active by default.
             */
            admin.setActive(true);
        }

        return adminRepository.save(admin);
    }

    // -------------------------------------------------------------------------
    // ACTIVATE / DEACTIVATE ADMIN
    // -------------------------------------------------------------------------

    public Admin setAdminActive(
            String id,
            boolean active) {

        Admin admin =
                adminRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Admin not found: " + id
                                ));

        admin.setActive(active);

        return adminRepository.save(admin);
    }

    // -------------------------------------------------------------------------
    // DASHBOARD ANALYTICS
    // -------------------------------------------------------------------------

    public DashboardAnalytics getDashboardAnalytics() {

        List<Attendance> attendanceRecords =
                attendanceRepository.findAll();

        long totalAttendanceRecords =
                attendanceRecords.size();

        long presentAttendanceRecords =
                attendanceRecords.stream()
                        .filter(attendance ->
                                "Present".equalsIgnoreCase(
                                        attendance.getStatus()
                                ))
                        .count();

        long absentAttendanceRecords =
                attendanceRecords.stream()
                        .filter(attendance ->
                                "Absent".equalsIgnoreCase(
                                        attendance.getStatus()
                                ))
                        .count();

        double attendancePercentage =
                totalAttendanceRecords == 0
                        ? 0.0
                        : (presentAttendanceRecords * 100.0)
                        / totalAttendanceRecords;

        long totalStudents =
                studentRepository.count();

        long activeStudents =
                studentRepository.findAll()
                        .stream()
                        .filter(student -> student.isActive())
                        .count();

        long totalProfessors =
                professorRepository.count();

        long activeProfessors =
                professorRepository.findAll()
                        .stream()
                        .filter(professor -> professor.isActive())
                        .count();

        long totalCourses =
                courseRepository.count();

        long totalSubjects =
                subjectRepository.count();

        long totalDepartments =
                departmentRepository.count();

        long totalAdmins =
                adminRepository.count();

        long activeAdmins =
                adminRepository.countByActiveTrue();

        return new DashboardAnalytics(
                totalStudents,
                activeStudents,
                totalProfessors,
                activeProfessors,
                totalCourses,
                totalSubjects,
                totalDepartments,
                totalAdmins,
                activeAdmins,
                totalAttendanceRecords,
                presentAttendanceRecords,
                absentAttendanceRecords,
                attendancePercentage
        );
    }

    // -------------------------------------------------------------------------
    // DELETE ADMIN
    // -------------------------------------------------------------------------

    @Transactional
    public void deleteAdminById(String id) {

        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException(
                    "Admin ID is required."
            );
        }

        /*
         * The configured Special Admin is the protected root
         * administrator for CampusHub.
         *
         * The Special Admin may delete other administrator accounts,
         * but this account itself must never be deleted.
         *
         * The actual Special Admin ID comes from Spring configuration,
         * so it is not hard-coded in the public source tree.
         */
        if (specialAdminId != null
                && !specialAdminId.isBlank()
                && specialAdminId.equals(id)) {

            throw new IllegalArgumentException(
                    "The Special Admin account cannot be deleted."
            );
        }

        if (!adminRepository.existsById(id)) {
            throw new IllegalArgumentException(
                    "Admin not found: " + id
            );
        }

        /*
         * STAFF_ATTENDANCE contains a foreign key:
         *
         * STAFF_ATTENDANCE.admin_id -> ADMIN.admin_id
         *
         * Therefore all staff-attendance rows owned by this admin
         * must be deleted before deleting the ADMIN record.
         */
        List<StaffAttendance> adminAttendance =
                staffAttendanceService
                        .getStaffAttendancesByAdmin(id);

        for (StaffAttendance attendance :
                adminAttendance) {

            if (attendance == null) {
                continue;
            }

            String attendanceId =
                    attendance.getAttendanceId();

            if (attendanceId == null
                    || attendanceId.isBlank()) {
                continue;
            }

            staffAttendanceService
                    .deleteStaffAttendanceById(
                            attendanceId
                    );
        }

        /*
         * USER_SESSION does NOT contain a foreign key to ADMIN
         * in your current schema, so no session deletion is required
         * here.
         */

        /*
         * STAFF_ATTENDANCE no longer references this admin,
         * so the ADMIN row can now be safely deleted.
         */
        adminRepository.deleteById(id);
    }

    // -------------------------------------------------------------------------
    // ATTENDANCE OVERSIGHT
    // -------------------------------------------------------------------------

    public List<Attendance> getAttendanceBySession(
            String sessionId) {

        return attendanceService.getAttendanceBySession(
                sessionId
        );
    }

    public List<Attendance> getAttendanceBySubject(
            String subjectId) {

        return attendanceService.getAttendanceBySubject(
                subjectId
        );
    }

    public List<Attendance> getAttendanceByCourse(
            String courseId) {

        return attendanceService.getAttendanceByCourse(
                courseId
        );
    }

    public List<Attendance> getAttendanceByStudent(
            String studentId) {

        return attendanceService.getAttendanceByStudent(
                studentId
        );
    }

    public Optional<Attendance> getAttendanceById(
            AttendanceId id) {

        return attendanceService.getAttendanceById(id);
    }

    public Attendance correctAttendance(
            String sessionId,
            String studentId,
            String status) {

        return attendanceService.updateAttendance(
                sessionId,
                studentId,
                status
        );
    }

    // -------------------------------------------------------------------------
    // STAFF ATTENDANCE
    // -------------------------------------------------------------------------

    public List<StaffAttendance> getAllStaffAttendances() {
        return staffAttendanceService.getAllStaffAttendances();
    }

    public List<StaffAttendance> getStaffAttendancesByProfessor(
            String profId) {

        return staffAttendanceService
                .getStaffAttendancesByProfessor(profId);
    }

    public List<StaffAttendance> getStaffAttendancesByAdmin(
            String adminId) {

        return staffAttendanceService
                .getStaffAttendancesByAdmin(adminId);
    }

    public List<StaffAttendance> getStaffAttendancesByDay(
            LocalDate day) {

        return staffAttendanceService
                .getStaffAttendancesByDay(day);
    }

    public StaffAttendance markStaffAttendance(
            StaffAttendance staffAttendance) {

        return staffAttendanceService
                .saveStaffAttendance(staffAttendance);
    }

    // -------------------------------------------------------------------------
    // LOGIN SESSIONS
    // -------------------------------------------------------------------------

    public List<UserSession> getAllSessions() {
        return userSessionService.getAllSessions();
    }

    public List<UserSession> getSessionsForUser(
            String userId) {

        return userSessionService.getSessionsForUser(
                userId
        );
    }

    // -------------------------------------------------------------------------
    // AUTOMATIC ID GENERATION
    // -------------------------------------------------------------------------

    private String generateUniqueAdminId() {

        for (int attempt = 0; attempt < 10; attempt++) {

            String generatedId =
                    idGenerator.generateAdminId();

            if (!adminRepository.existsById(generatedId)) {
                return generatedId;
            }
        }

        throw new IllegalStateException(
                "Unable to generate a unique Admin ID."
        );
    }
}