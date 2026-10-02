package com.campushub.backend.controller;

import com.campushub.backend.dto.AttendanceSummary;
import com.campushub.backend.entity.Attendance;
import com.campushub.backend.entity.ClassSession;
import com.campushub.backend.entity.Professor;
import com.campushub.backend.entity.StaffAttendance;
import com.campushub.backend.entity.Student;
import com.campushub.backend.entity.Teaching;
import com.campushub.backend.security.CampusHubAuthorizationService;
import com.campushub.backend.service.ProfessorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/professors")
public class ProfessorController {

    private final ProfessorService professorService;
    private final CampusHubAuthorizationService authorizationService;

    public ProfessorController(
            ProfessorService professorService,
            CampusHubAuthorizationService authorizationService) {

        this.professorService = professorService;
        this.authorizationService = authorizationService;
    }

    // -------------------------------------------------------------------------
    // PROFESSOR LIST
    // -------------------------------------------------------------------------

    @GetMapping
    public List<Professor> getAllProfessors(
            @RequestParam(required = false) String departmentId) {

        if (departmentId != null && !departmentId.isBlank()) {
            return professorService.getProfessorsByDepartment(
                    departmentId
            );
        }

        return professorService.getAllProfessors();
    }

    // -------------------------------------------------------------------------
    // PROFESSOR PROFILE
    // -------------------------------------------------------------------------

    @GetMapping("/{id}")
    public ResponseEntity<Professor> getProfessorById(
            @PathVariable String id,
            Authentication authentication) {

        authorizationService.requireProfessorOwnerOrAdmin(
                id,
                authentication
        );

        return professorService.getProfessorById(id)
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity
                                .notFound()
                                .build()
                );
    }

    // -------------------------------------------------------------------------
    // PROFESSOR SUBJECTS
    // -------------------------------------------------------------------------

    @GetMapping("/{id}/subjects")
    public ResponseEntity<List<Teaching>> getTeachingAssignments(
            @PathVariable String id,
            Authentication authentication) {

        authorizationService.requireProfessorOwnerOrAdmin(
                id,
                authentication
        );

        try {
            return ResponseEntity.ok(
                    professorService.getTeachingAssignments(id)
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .notFound()
                    .build();
        }
    }

    // -------------------------------------------------------------------------
    // PROFESSOR TIMETABLE
    // -------------------------------------------------------------------------

    @GetMapping("/{id}/timetable")
    public ResponseEntity<List<ClassSession>> getProfessorTimetable(
            @PathVariable String id,
            Authentication authentication) {

        authorizationService.requireProfessorOwnerOrAdmin(
                id,
                authentication
        );

        try {
            return ResponseEntity.ok(
                    professorService.getProfessorTimetable(id)
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .notFound()
                    .build();
        }
    }

    // -------------------------------------------------------------------------
    // PROFESSOR STAFF ATTENDANCE
    // -------------------------------------------------------------------------

    @GetMapping("/{id}/staff-attendance")
    public ResponseEntity<List<StaffAttendance>> getOwnStaffAttendance(
            @PathVariable String id,
            Authentication authentication) {

        authorizationService.requireProfessorOwnerOrAdmin(
                id,
                authentication
        );

        try {
            return ResponseEntity.ok(
                    professorService.getOwnStaffAttendance(id)
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .notFound()
                    .build();
        }
    }

    // -------------------------------------------------------------------------
    // STUDENTS FOR CLASS SESSION
    // -------------------------------------------------------------------------

    @GetMapping("/{id}/sessions/{sessionId}/students")
    public ResponseEntity<List<Student>> getStudentsForClassSession(
            @PathVariable String id,
            @PathVariable String sessionId,
            Authentication authentication) {

        authorizationService.requireProfessorOwnerOrAdmin(
                id,
                authentication
        );

        try {
            return ResponseEntity.ok(
                    professorService.getStudentsForClassSession(
                            id,
                            sessionId
                    )
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .notFound()
                    .build();

        } catch (IllegalStateException e) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .build();
        }
    }

    // -------------------------------------------------------------------------
    // SESSION COUNT
    // -------------------------------------------------------------------------

    @GetMapping("/{id}/subjects/{subjectId}/session-count")
    public ResponseEntity<Long> getSessionCountForSubject(
            @PathVariable String id,
            @PathVariable String subjectId,
            Authentication authentication) {

        authorizationService.requireProfessorOwnerOrAdmin(
                id,
                authentication
        );

        try {
            return ResponseEntity.ok(
                    professorService.getSessionCountForSubject(
                            id,
                            subjectId
                    )
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .notFound()
                    .build();
        }
    }

    // -------------------------------------------------------------------------
    // SUBJECT ATTENDANCE SUMMARY
    // -------------------------------------------------------------------------

    @GetMapping("/{id}/subjects/{subjectId}/attendance")
    public ResponseEntity<List<AttendanceSummary>>
    getSubjectAttendanceSummary(
            @PathVariable String id,
            @PathVariable String subjectId,
            Authentication authentication) {

        authorizationService.requireProfessorOwnerOrAdmin(
                id,
                authentication
        );

        try {
            return ResponseEntity.ok(
                    professorService.getSubjectAttendanceSummary(
                            id,
                            subjectId
                    )
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .notFound()
                    .build();

        } catch (IllegalStateException e) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .build();
        }
    }

    // -------------------------------------------------------------------------
    // CREATE PROFESSOR
    // -------------------------------------------------------------------------

    @PostMapping
    public ResponseEntity<?> createProfessor(
            @RequestBody Professor professor) {

        try {

            Professor savedProfessor =
                    professorService.saveProfessor(
                            professor
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(savedProfessor);

        } catch (IllegalArgumentException e) {

            /*
             * Includes global phone-number conflicts:
             *
             * ADMIN
             * PROFESSOR
             * STUDENT
             */
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // UPDATE PROFESSOR
    // -------------------------------------------------------------------------

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProfessor(
            @PathVariable String id,
            @RequestBody Professor professor) {

        if (professorService.getProfessorById(id).isEmpty()) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Professor not found: " + id);
        }

        /*
         * URL ID is authoritative.
         */
        professor.setProfId(id);

        try {

            Professor updatedProfessor =
                    professorService.saveProfessor(
                            professor
                    );

            return ResponseEntity.ok(
                    updatedProfessor
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // MARK ATTENDANCE
    // -------------------------------------------------------------------------

    @PostMapping("/{profId}/sessions/{sessionId}/attendance")
    public ResponseEntity<Attendance> markAttendance(
            @PathVariable String profId,
            @PathVariable String sessionId,
            @RequestParam String studentId,
            @RequestParam String status,
            Authentication authentication) {

        authorizationService.requireProfessorOwnerOrAdmin(
                profId,
                authentication
        );

        try {

            Attendance attendance =
                    professorService.markAttendance(
                            profId,
                            sessionId,
                            studentId,
                            status
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(attendance);

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

    // -------------------------------------------------------------------------
    // ACTIVATE / DEACTIVATE PROFESSOR
    // -------------------------------------------------------------------------

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> setProfessorActive(
            @PathVariable String id,
            @RequestParam boolean active) {

        try {

            Professor updatedProfessor =
                    professorService.setProfessorActive(
                            id,
                            active
                    );

            return ResponseEntity.ok(
                    updatedProfessor
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // DELETE PROFESSOR — SAFE QUERY-PARAMETER ENDPOINT
    // -------------------------------------------------------------------------
    //
    // DELETE /api/professors/delete?id={professorId}
    //
    // This endpoint is intentionally used for IDs containing
    // URL-reserved characters such as:
    //
    // %
    // #
    // ?
    // &
    //
    // The ID is transported as a query parameter instead of
    // being part of the URL path.
    // -------------------------------------------------------------------------

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteProfessorByQueryId(
            @RequestParam String id) {

        if (id == null || id.isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body("Professor ID is required.");
        }

        if (professorService.getProfessorById(id).isEmpty()) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Professor not found: " + id);
        }

        try {

            professorService.deleteProfessorById(id);

            return ResponseEntity
                    .noContent()
                    .build();

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());

        } catch (IllegalStateException e) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // DELETE PROFESSOR — ORIGINAL PATH ENDPOINT
    // -------------------------------------------------------------------------
    //
    // Kept for backwards compatibility with any existing caller.
    // The frontend will use /delete?id=... instead.
    // -------------------------------------------------------------------------

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProfessor(
            @PathVariable String id) {

        if (professorService.getProfessorById(id).isEmpty()) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Professor not found: " + id);
        }

        try {

            professorService.deleteProfessorById(id);

            return ResponseEntity
                    .noContent()
                    .build();

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());

        } catch (IllegalStateException e) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(e.getMessage());
        }
    }
}