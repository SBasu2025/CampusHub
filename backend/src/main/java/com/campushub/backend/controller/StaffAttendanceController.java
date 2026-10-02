package com.campushub.backend.controller;

import com.campushub.backend.entity.StaffAttendance;
import com.campushub.backend.service.StaffAttendanceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/staff-attendances")
public class StaffAttendanceController {

    private final StaffAttendanceService staffAttendanceService;

    public StaffAttendanceController(
            StaffAttendanceService staffAttendanceService) {

        this.staffAttendanceService = staffAttendanceService;
    }

    // -------------------------------------------------------------------------
    // BASIC RETRIEVAL
    // -------------------------------------------------------------------------

    @GetMapping
    public ResponseEntity<List<StaffAttendance>> getAllStaffAttendances() {

        return ResponseEntity.ok(
                staffAttendanceService.getAllStaffAttendances()
        );
    }

    /*
     * IMPORTANT:
     * attendanceId contains '/'.
     *
     * Example:
     * PROF001/KOL/260901
     *
     * Therefore it must NOT be used as a single @PathVariable segment.
     * It is received as a query parameter instead.
     */
    @GetMapping("/by-id")
    public ResponseEntity<StaffAttendance> getStaffAttendanceById(
            @RequestParam String attendanceId) {

        return staffAttendanceService
                .getStaffAttendanceById(attendanceId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // -------------------------------------------------------------------------
    // PROFESSOR-WISE REPORT
    // -------------------------------------------------------------------------

    @GetMapping("/professor/{profId}")
    public ResponseEntity<?> getStaffAttendancesByProfessor(
            @PathVariable String profId) {

        try {

            return ResponseEntity.ok(
                    staffAttendanceService
                            .getStaffAttendancesByProfessor(profId)
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }

    @GetMapping("/professor/{profId}/report")
    public ResponseEntity<?> getProfessorAttendanceReport(
            @PathVariable String profId) {

        try {

            return ResponseEntity.ok(
                    staffAttendanceService
                            .getProfessorAttendanceReport(profId)
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }

    @GetMapping("/professor/{profId}/date/{day}")
    public ResponseEntity<?> getProfessorAttendanceReportByDate(
            @PathVariable String profId,
            @PathVariable LocalDate day) {

        try {

            return ResponseEntity.ok(
                    staffAttendanceService
                            .getProfessorAttendanceReportByDate(
                                    profId,
                                    day
                            )
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // ADMIN-WISE REPORT
    // -------------------------------------------------------------------------

    @GetMapping("/admin/{adminId}")
    public ResponseEntity<?> getStaffAttendancesByAdmin(
            @PathVariable String adminId) {

        try {

            return ResponseEntity.ok(
                    staffAttendanceService
                            .getStaffAttendancesByAdmin(adminId)
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }

    @GetMapping("/admin/{adminId}/report")
    public ResponseEntity<?> getAdminAttendanceReport(
            @PathVariable String adminId) {

        try {

            return ResponseEntity.ok(
                    staffAttendanceService
                            .getAdminAttendanceReport(adminId)
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }

    @GetMapping("/admin/{adminId}/date/{day}")
    public ResponseEntity<?> getAdminAttendanceReportByDate(
            @PathVariable String adminId,
            @PathVariable LocalDate day) {

        try {

            return ResponseEntity.ok(
                    staffAttendanceService
                            .getAdminAttendanceReportByDate(
                                    adminId,
                                    day
                            )
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // DATE-WISE REPORT
    // -------------------------------------------------------------------------

    @GetMapping("/date/{day}")
    public ResponseEntity<?> getStaffAttendancesByDay(
            @PathVariable LocalDate day) {

        try {

            return ResponseEntity.ok(
                    staffAttendanceService
                            .getStaffAttendancesByDay(day)
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }

    @GetMapping("/date/{day}/report")
    public ResponseEntity<?> getDateAttendanceReport(
            @PathVariable LocalDate day) {

        try {

            return ResponseEntity.ok(
                    staffAttendanceService
                            .getDateAttendanceReport(day)
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // CREATE
    // -------------------------------------------------------------------------

    @PostMapping
    public ResponseEntity<?> createStaffAttendance(
            @RequestBody StaffAttendance staffAttendance) {

        try {

            StaffAttendance savedAttendance =
                    staffAttendanceService
                            .saveStaffAttendance(
                                    staffAttendance
                            );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(savedAttendance);

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------------------------

    /*
     * attendanceId contains '/', so it is passed as a query parameter.
     *
     * Example:
     * PUT /api/staff-attendances/by-id?attendanceId=PROF001/KOL/260901
     */
    @PutMapping("/by-id")
    public ResponseEntity<?> updateStaffAttendance(
            @RequestParam String attendanceId,
            @RequestBody UpdateStaffAttendanceRequest request) {

        try {

            StaffAttendance updatedAttendance =
                    staffAttendanceService
                            .updateStaffAttendance(
                                    attendanceId,
                                    request.status()
                            );

            return ResponseEntity.ok(updatedAttendance);

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // DELETE
    // -------------------------------------------------------------------------

    /*
     * attendanceId contains '/', so it is passed as a query parameter.
     *
     * Example:
     * DELETE /api/staff-attendances/by-id?attendanceId=PROF001/KOL/260901
     */
    @DeleteMapping("/by-id")
    public ResponseEntity<Void> deleteStaffAttendance(
            @RequestParam String attendanceId) {

        try {

            boolean deleted =
                    staffAttendanceService
                            .deleteStaffAttendanceById(
                                    attendanceId
                            );

            if (!deleted) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.noContent().build();

        } catch (IllegalArgumentException e) {

            return ResponseEntity.badRequest().build();
        }
    }

    // -------------------------------------------------------------------------
    // REQUEST DTO
    // -------------------------------------------------------------------------

    public record UpdateStaffAttendanceRequest(
            String status
    ) {
    }
}