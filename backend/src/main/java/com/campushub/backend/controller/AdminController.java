package com.campushub.backend.controller;

import com.campushub.backend.dto.DashboardAnalytics;
import com.campushub.backend.entity.Admin;
import com.campushub.backend.entity.Attendance;
import com.campushub.backend.entity.AttendanceId;
import com.campushub.backend.entity.StaffAttendance;
import com.campushub.backend.entity.UserSession;
import com.campushub.backend.security.CampusHubAuthorizationService;
import com.campushub.backend.service.AdminService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admins")
public class AdminController {

    private final AdminService adminService;
    private final CampusHubAuthorizationService authorizationService;

    public AdminController(
            AdminService adminService,
            CampusHubAuthorizationService authorizationService) {

        this.adminService = adminService;
        this.authorizationService = authorizationService;
    }

    // -------------------------------------------------------------------------
    // ADMIN ACCOUNT MANAGEMENT
    // SPECIAL ADMIN ONLY
    // -------------------------------------------------------------------------

    /*
     * Only the Special Admin can view the administrator directory.
     *
     * Ordinary admins cannot retrieve the list of admin accounts
     * or see other admin IDs through this endpoint.
     */
    @GetMapping
    public ResponseEntity<List<Admin>> getAllAdmins(
            Authentication authentication) {

        authorizationService.requireSpecialAdmin(
                authentication
        );

        return ResponseEntity.ok(
                adminService.getAllAdmins()
        );
    }

    /*
     * Only the Special Admin can retrieve another admin's profile.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Admin> getAdminById(
            @PathVariable String id,
            Authentication authentication) {

        authorizationService.requireSpecialAdmin(
                authentication
        );

        return adminService.getAdminById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /*
     * Only the Special Admin can create another admin account.
     *
     * AdminService performs global phone-number uniqueness checking
     * across ADMIN + PROFESSOR + STUDENT.
     */
    @PostMapping
    public ResponseEntity<?> createAdmin(
            @RequestBody Admin admin,
            Authentication authentication) {

        authorizationService.requireSpecialAdmin(
                authentication
        );

        try {

            Admin savedAdmin =
                    adminService.saveAdmin(admin);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(savedAdmin);

        } catch (IllegalArgumentException e) {

            /*
             * Duplicate phone numbers and other validation errors
             * are returned to the frontend as a readable message.
             */
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(e.getMessage());
        }
    }

    /*
     * Only the Special Admin can update another admin.
     *
     * AdminService performs the global phone-number uniqueness
     * check across ADMIN + PROFESSOR + STUDENT.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateAdmin(
            @PathVariable String id,
            @RequestBody Admin admin,
            Authentication authentication) {

        authorizationService.requireSpecialAdmin(
                authentication
        );

        return adminService.getAdminById(id)
                .map(existingAdmin -> {

                    existingAdmin.setAdminName(
                            admin.getAdminName()
                    );

                    existingAdmin.setPhoneNumber(
                            admin.getPhoneNumber()
                    );

                    try {

                        Admin updatedAdmin =
                                adminService.saveAdmin(
                                        existingAdmin
                                );

                        return ResponseEntity
                                .ok()
                                .body(updatedAdmin);

                    } catch (IllegalArgumentException e) {

                        return ResponseEntity
                                .status(HttpStatus.CONFLICT)
                                .body(e.getMessage());
                    }
                })
                .orElse(
                        ResponseEntity
                                .notFound()
                                .build()
                );
    }

    /*
     * Only the Special Admin can activate/deactivate another admin.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateAdminStatus(
            @PathVariable String id,
            @RequestParam boolean active,
            Authentication authentication) {

        authorizationService.requireSpecialAdmin(
                authentication
        );

        try {

            return ResponseEntity.ok(
                    adminService.setAdminActive(
                            id,
                            active
                    )
            );

        } catch (IllegalArgumentException e) {

            /*
             * IMPORTANT:
             *
             * ResponseEntity.notFound() returns a HeadersBuilder,
             * which does not support .body().
             *
             * Therefore status(HttpStatus.NOT_FOUND) is used here
             * when we want to return the exception message.
             */
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }

    /*
     * Only the Special Admin can delete another admin.
     *
     * AdminService handles:
     * - Special Admin self-delete protection
     * - STAFF_ATTENDANCE cleanup
     * - final ADMIN deletion
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAdmin(
            @PathVariable String id,
            Authentication authentication) {

        authorizationService.requireSpecialAdmin(
                authentication
        );

        if (adminService.getAdminById(id).isEmpty()) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Admin not found: " + id);
        }

        try {

            adminService.deleteAdminById(
                    id
            );

            return ResponseEntity
                    .noContent()
                    .build();

        } catch (IllegalArgumentException e) {

            String message = e.getMessage();

            /*
             * Special Admin self-delete is a protected operation.
             */
            if (message != null
                    && message.contains(
                            "Special Admin account cannot be deleted")) {

                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(message);
            }

            return ResponseEntity
                    .badRequest()
                    .body(message);

        } catch (IllegalStateException e) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // DASHBOARD ANALYTICS
    // ALL ADMINS
    // -------------------------------------------------------------------------

    @GetMapping("/dashboard/analytics")
    public ResponseEntity<DashboardAnalytics>
    getDashboardAnalytics() {

        return ResponseEntity.ok(
                adminService.getDashboardAnalytics()
        );
    }

    // -------------------------------------------------------------------------
    // LOGIN SESSIONS
    // ALL ADMINS
    // -------------------------------------------------------------------------

    /*
     * Returns all persistent login sessions when no userId is supplied.
     *
     * GET /api/admins/sessions
     *
     * Returns sessions belonging to one account when userId is supplied.
     *
     * GET /api/admins/sessions?userId=...
     */
    @GetMapping("/sessions")
    public ResponseEntity<List<UserSession>> getAllSessions(
            @RequestParam(required = false) String userId) {

        if (userId != null && !userId.isBlank()) {

            return ResponseEntity.ok(
                    adminService.getSessionsForUser(
                            userId.trim()
                    )
            );
        }

        return ResponseEntity.ok(
                adminService.getAllSessions()
        );
    }

    // -------------------------------------------------------------------------
    // ATTENDANCE OVERSIGHT
    // ALL ADMINS
    // -------------------------------------------------------------------------

    @GetMapping("/attendance/session/{sessionId}")
    public ResponseEntity<List<Attendance>>
    getAttendanceBySession(
            @PathVariable String sessionId) {

        try {

            return ResponseEntity.ok(
                    adminService.getAttendanceBySession(
                            sessionId
                    )
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .notFound()
                    .build();
        }
    }

    @GetMapping("/attendance/subject/{subjectId}")
    public ResponseEntity<List<Attendance>>
    getAttendanceBySubject(
            @PathVariable String subjectId) {

        return ResponseEntity.ok(
                adminService.getAttendanceBySubject(
                        subjectId
                )
        );
    }

    @GetMapping("/attendance/course/{courseId}")
    public ResponseEntity<List<Attendance>>
    getAttendanceByCourse(
            @PathVariable String courseId) {

        return ResponseEntity.ok(
                adminService.getAttendanceByCourse(
                        courseId
                )
        );
    }

    @GetMapping("/attendance/student/{studentId}")
    public ResponseEntity<List<Attendance>>
    getAttendanceByStudent(
            @PathVariable String studentId) {

        return ResponseEntity.ok(
                adminService.getAttendanceByStudent(
                        studentId
                )
        );
    }

    @GetMapping("/attendance/{sessionId}/{studentId}")
    public ResponseEntity<Attendance>
    getAttendanceById(
            @PathVariable String sessionId,
            @PathVariable String studentId) {

        AttendanceId id =
                new AttendanceId(
                        sessionId,
                        studentId
                );

        return adminService.getAttendanceById(id)
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity
                                .notFound()
                                .build()
                );
    }

    @PutMapping("/attendance/{sessionId}/{studentId}")
    public ResponseEntity<Attendance>
    correctAttendance(
            @PathVariable String sessionId,
            @PathVariable String studentId,
            @RequestParam String status) {

        try {

            Attendance correctedAttendance =
                    adminService.correctAttendance(
                            sessionId,
                            studentId,
                            status
                    );

            return ResponseEntity.ok(
                    correctedAttendance
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .notFound()
                    .build();
        }
    }

    // -------------------------------------------------------------------------
    // STAFF ATTENDANCE
    // ALL ADMINS
    // -------------------------------------------------------------------------

    @GetMapping("/staff-attendance")
    public ResponseEntity<List<StaffAttendance>>
    getStaffAttendance(
            @RequestParam(required = false) String profId,
            @RequestParam(required = false) String adminId,
            @RequestParam(required = false)
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate day) {

        if (profId != null) {

            return ResponseEntity.ok(
                    adminService.getStaffAttendancesByProfessor(
                            profId
                    )
            );
        }

        if (adminId != null) {

            return ResponseEntity.ok(
                    adminService.getStaffAttendancesByAdmin(
                            adminId
                    )
            );
        }

        if (day != null) {

            return ResponseEntity.ok(
                    adminService.getStaffAttendancesByDay(
                            day
                    )
            );
        }

        return ResponseEntity.ok(
                adminService.getAllStaffAttendances()
        );
    }

    @PostMapping("/staff-attendance")
    public ResponseEntity<StaffAttendance>
    markStaffAttendance(
            @RequestBody StaffAttendance staffAttendance) {

        try {

            StaffAttendance savedAttendance =
                    adminService.markStaffAttendance(
                            staffAttendance
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(savedAttendance);

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .build();

        } catch (IllegalStateException e) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .build();
        }
    }
}