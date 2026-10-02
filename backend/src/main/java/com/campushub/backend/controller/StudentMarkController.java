package com.campushub.backend.controller;

import com.campushub.backend.entity.Student;
import com.campushub.backend.entity.StudentMark;
import com.campushub.backend.security.CampusHubPrincipal;
import com.campushub.backend.security.CampusHubAuthorizationService;
import com.campushub.backend.service.StudentMarkService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/student-marks")
public class StudentMarkController {

    private final StudentMarkService studentMarkService;

    private final CampusHubAuthorizationService authorizationService;

    public StudentMarkController(
            StudentMarkService studentMarkService,
            CampusHubAuthorizationService authorizationService) {

        this.studentMarkService =
                studentMarkService;

        this.authorizationService =
                authorizationService;
    }

    // =========================================================
    // BASIC MARK RETRIEVAL
    // =========================================================

    @GetMapping
    public ResponseEntity<List<StudentMark>>
    getAllStudentMarks() {

        return ResponseEntity.ok(
                studentMarkService
                        .getAllStudentMarks()
        );
    }

    // ---------------------------------------------------------
    // GET ONE STUDENT MARK
    // ---------------------------------------------------------

    @GetMapping("/{studentId}/{examId}")
    public ResponseEntity<StudentMark>
    getStudentMarkById(
            @PathVariable String studentId,
            @PathVariable String examId,
            Authentication authentication) {

        authorizationService
                .requireStudentOwnerOrAdmin(
                        studentId,
                        authentication
                );

        return studentMarkService
                .getStudentMarkById(
                        studentId,
                        examId
                )
                .map(
                        ResponseEntity::ok
                )
                .orElse(
                        ResponseEntity
                                .notFound()
                                .build()
                );
    }

    // ---------------------------------------------------------
    // GET ALL MARKS FOR ONE STUDENT
    // ---------------------------------------------------------

    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getMarksForStudent(
            @PathVariable String studentId,
            Authentication authentication) {

        authorizationService
                .requireStudentOwnerOrAdmin(
                        studentId,
                        authentication
                );

        try {

            return ResponseEntity.ok(
                    studentMarkService
                            .getMarksForStudent(
                                    studentId
                            )
            );

        } catch (
                IllegalArgumentException e
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );
        }
    }

    // ---------------------------------------------------------
    // GET ALL MARKS FOR ONE EXAMINATION
    // ---------------------------------------------------------
    //
    // IMPORTANT:
    //
    // No professorId parameter is required.
    //
    // CampusHubAuthorizationService checks the authenticated
    // professor against the examination.
    // ---------------------------------------------------------

    @GetMapping("/exam/{examId}")
    public ResponseEntity<?> getMarksForExamination(
            @PathVariable String examId,
            Authentication authentication) {

        authorizationService
                .requireExamProfessorOrAdmin(
                        examId,
                        authentication
                );

        try {

            return ResponseEntity.ok(
                    studentMarkService
                            .getMarksForExamination(
                                    examId
                            )
            );

        } catch (
                IllegalArgumentException e
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );
        }
    }

    // =========================================================
    // PROFESSOR EXAMINATION WORKFLOW
    // =========================================================

    /**
     * Get every examination assigned to the authenticated
     * professor.
     *
     * The professorId remains in the route because the frontend
     * uses it to retrieve the logged-in professor's examination
     * list.
     *
     * The authorization service ensures the route professorId
     * matches the authenticated principal.
     */
    @GetMapping(
            "/professor/{professorId}/examinations"
    )
    public ResponseEntity<?> getExaminationsForProfessor(
            @PathVariable String professorId,
            Authentication authentication) {

        authorizationService
                .requireProfessorOwnerOrAdmin(
                        professorId,
                        authentication
                );

        try {

            return ResponseEntity.ok(
                    studentMarkService
                            .getExaminationsForProfessor(
                                    professorId
                            )
            );

        } catch (
                IllegalArgumentException e
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );
        }
    }

    /**
     * Get examinations for the authenticated professor and
     * selected subject.
     *
     * The professor's name is NOT accepted.
     */
    @GetMapping(
            "/professor/{professorId}/subject/{subjectId}/examinations"
    )
    public ResponseEntity<?> getExaminationsForProfessorAndSubject(
            @PathVariable String professorId,
            @PathVariable String subjectId,
            Authentication authentication) {

        authorizationService
                .requireProfessorOwnerOrAdmin(
                        professorId,
                        authentication
                );

        try {

            return ResponseEntity.ok(
                    studentMarkService
                            .getExaminationsForProfessorAndSubject(
                                    professorId,
                                    subjectId
                            )
            );

        } catch (
                IllegalArgumentException e
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );
        }
    }

    // =========================================================
    // EXAMINATION SECTION
    // =========================================================
    //
    // The professor no longer chooses a section.
    //
    // The section is already stored on Examination by the admin.
    //
    // This endpoint is retained for compatibility with the old
    // API surface, but it no longer accepts professorId or
    // professorName as query parameters.
    // =========================================================

    @GetMapping(
            "/exam/{examId}/sections"
    )
    public ResponseEntity<?> getSectionsForExamination(
            @PathVariable String examId,
            Authentication authentication) {

        authorizationService
                .requireExamProfessorOrAdmin(
                        examId,
                        authentication
                );

        try {

            String professorId =
                    getAuthenticatedProfessorId(
                            authentication
                    );

            return ResponseEntity.ok(
                    studentMarkService
                            .getSectionsForExamination(
                                    examId,
                                    professorId
                            )
            );

        } catch (
                IllegalArgumentException e
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );
        }
    }

    // =========================================================
    // STUDENTS FOR EXAMINATION SECTION
    // =========================================================
    //
    // IMPORTANT:
    //
    // The request no longer contains:
    //
    //   professorId
    //   professorName
    //
    // The authenticated professor is read from Spring Security.
    //
    // The service then verifies:
    //
    //   authenticated professor
    //   +
    //   examination
    //   +
    //   examination section
    //   +
    //   examination course
    //   +
    //   examination semester
    // =========================================================

    @GetMapping(
            "/exam/{examId}/section/{section}/students"
    )
    public ResponseEntity<?> getStudentsForExamination(
            @PathVariable String examId,
            @PathVariable String section,
            Authentication authentication) {

        authorizationService
                .requireExamProfessorOrAdmin(
                        examId,
                        authentication
                );

        try {

            String professorId =
                    getAuthenticatedProfessorId(
                            authentication
                    );

            List<Student> students =
                    studentMarkService
                            .getStudentsForExamination(
                                    examId,
                                    section,
                                    professorId
                            );

            return ResponseEntity.ok(
                    students
            );

        } catch (
                IllegalArgumentException e
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );
        }
    }

    // =========================================================
    // SINGLE MARK ENTRY
    // =========================================================
    //
    // No professorId.
    // No professorName.
    //
    // The authenticated professor is used.
    // =========================================================

    @PostMapping(
            "/exam/{examId}/section/{section}/student/{studentId}"
    )
    public ResponseEntity<?> createMarkForSection(
            @PathVariable String examId,
            @PathVariable String section,
            @PathVariable String studentId,
            @RequestBody MarkRequest request,
            Authentication authentication) {

        authorizationService
                .requireExamProfessorOrAdmin(
                        examId,
                        authentication
                );

        try {

            String professorId =
                    getAuthenticatedProfessorId(
                            authentication
                    );

            StudentMark saved =
                    studentMarkService
                            .saveMarkForSection(
                                    examId,
                                    studentId,
                                    section,
                                    professorId,
                                    request.marksObtained()
                            );

            return ResponseEntity
                    .status(
                            HttpStatus.CREATED
                    )
                    .body(
                            saved
                    );

        } catch (
                IllegalArgumentException e
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );
        }
    }

    // =========================================================
    // BATCH MARK ENTRY FOR SECTION
    // =========================================================
    //
    // No professorId.
    // No professorName.
    //
    // The authenticated professor is used.
    // =========================================================

    @PostMapping(
            "/exam/{examId}/section/{section}"
    )
    public ResponseEntity<?> createMarksForSection(
            @PathVariable String examId,
            @PathVariable String section,
            @RequestBody List<StudentMarkService.MarkEntry> entries,
            Authentication authentication) {

        authorizationService
                .requireExamProfessorOrAdmin(
                        examId,
                        authentication
                );

        try {

            String professorId =
                    getAuthenticatedProfessorId(
                            authentication
                    );

            List<StudentMark> saved =
                    studentMarkService
                            .saveMarksForSection(
                                    examId,
                                    section,
                                    professorId,
                                    entries
                            );

            return ResponseEntity
                    .status(
                            HttpStatus.CREATED
                    )
                    .body(
                            saved
                    );

        } catch (
                IllegalArgumentException e
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );
        }
    }

    // =========================================================
    // MARK UPDATE
    // =========================================================
    //
    // No professorId.
    // No professorName.
    // =========================================================

    @PutMapping(
            "/exam/{examId}/section/{section}/student/{studentId}"
    )
    public ResponseEntity<?> updateMarkForSection(
            @PathVariable String examId,
            @PathVariable String section,
            @PathVariable String studentId,
            @RequestBody MarkRequest request,
            Authentication authentication) {

        authorizationService
                .requireExamProfessorOrAdmin(
                        examId,
                        authentication
                );

        try {

            String professorId =
                    getAuthenticatedProfessorId(
                            authentication
                    );

            StudentMark updated =
                    studentMarkService
                            .updateMarkForSection(
                                    examId,
                                    studentId,
                                    section,
                                    professorId,
                                    request.marksObtained()
                            );

            return ResponseEntity.ok(
                    updated
            );

        } catch (
                IllegalArgumentException e
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );
        }
    }

    // =========================================================
    // STUDENT MARKS DASHBOARD
    // =========================================================

    @GetMapping(
            "/student/{studentId}/semester/{semester}/subject/{subjectId}"
    )
    public ResponseEntity<?> getStudentSubjectMarks(
            @PathVariable String studentId,
            @PathVariable Integer semester,
            @PathVariable String subjectId,
            Authentication authentication) {

        authorizationService
                .requireStudentOwnerOrAdmin(
                        studentId,
                        authentication
                );

        try {

            return ResponseEntity.ok(
                    studentMarkService
                            .getStudentSubjectMarks(
                                    studentId,
                                    subjectId,
                                    semester
                            )
            );

        } catch (
                IllegalArgumentException e
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );
        }
    }

    // =========================================================
    // SEMESTER SGPA
    // =========================================================

    @GetMapping(
            "/student/{studentId}/semester/{semester}/sgpa"
    )
    public ResponseEntity<?> getSemesterSGPA(
            @PathVariable String studentId,
            @PathVariable Integer semester,
            Authentication authentication) {

        authorizationService
                .requireStudentOwnerOrAdmin(
                        studentId,
                        authentication
                );

        try {

            return ResponseEntity.ok(
                    studentMarkService
                            .calculateSemesterSGPA(
                                    studentId,
                                    semester
                            )
            );

        } catch (
                IllegalArgumentException e
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );
        }
    }

    // =========================================================
    // DELETION
    // =========================================================

    @DeleteMapping(
            "/{studentId}/{examId}"
    )
    public ResponseEntity<Void> deleteStudentMark(
            @PathVariable String studentId,
            @PathVariable String examId) {

        if (
                !studentMarkService
                        .deleteStudentMark(
                                studentId,
                                examId
                        )
        ) {

            return ResponseEntity
                    .notFound()
                    .build();
        }

        return ResponseEntity
                .noContent()
                .build();
    }

    @DeleteMapping(
            "/exam/{examId}"
    )
    public ResponseEntity<?> deleteMarksForExamination(
            @PathVariable String examId) {

        try {

            long deleted =
                    studentMarkService
                            .deleteMarksForExamination(
                                    examId
                            );

            return ResponseEntity.ok(
                    deleted
            );

        } catch (
                IllegalArgumentException e
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );
        }
    }

    @DeleteMapping(
            "/student/{studentId}"
    )
    public ResponseEntity<?> deleteMarksForStudent(
            @PathVariable String studentId) {

        try {

            long deleted =
                    studentMarkService
                            .deleteMarksForStudent(
                                    studentId
                            );

            return ResponseEntity.ok(
                    deleted
            );

        } catch (
                IllegalArgumentException e
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );
        }
    }

    // =========================================================
    // AUTHENTICATED PROFESSOR HELPER
    // =========================================================

    /**
     * Gets the professor ID from the authenticated
     * Spring Security principal.
     *
     * This is the key part of requirement #3.
     *
     * The professor does not type:
     *
     *   professorId
     *   professorName
     *
     * again after login.
     */
    private String getAuthenticatedProfessorId(
            Authentication authentication) {

        if (
                authentication == null
                        || !authentication.isAuthenticated()
        ) {
            throw new IllegalArgumentException(
                    "Authenticated professor is required"
            );
        }

        Object principal =
                authentication.getPrincipal();

        if (
                !(principal
                        instanceof CampusHubPrincipal)
        ) {
            throw new IllegalArgumentException(
                    "Authenticated CampusHub professor could not be resolved"
            );
        }

        CampusHubPrincipal campusHubPrincipal =
                (CampusHubPrincipal) principal;

        if (
                !"PROFESSOR".equals(
                        campusHubPrincipal.role()
                )
        ) {
            throw new IllegalArgumentException(
                    "Only authenticated professors can perform this operation"
            );
        }

        if (
                campusHubPrincipal.id() == null
                        || campusHubPrincipal.id().isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Authenticated professor ID is unavailable"
            );
        }

        return campusHubPrincipal.id();
    }

    // =========================================================
    // REQUEST DTO
    // =========================================================

    public record MarkRequest(
            BigDecimal marksObtained
    ) {
    }
}