package com.campushub.backend.controller;

import com.campushub.backend.entity.Student;
import com.campushub.backend.security.CampusHubAuthorizationService;
import com.campushub.backend.service.StudentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;
    private final CampusHubAuthorizationService authorizationService;

    public StudentController(
            StudentService studentService,
            CampusHubAuthorizationService authorizationService) {

        this.studentService = studentService;
        this.authorizationService = authorizationService;
    }

    // -------------------------------------------------------------------------
    // STUDENT RETRIEVAL / FILTERING
    // -------------------------------------------------------------------------

    @GetMapping
    public ResponseEntity<?> getStudents(
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) Integer semester) {

        try {

            if (courseId != null
                    && section != null
                    && semester != null) {

                return ResponseEntity.ok(
                        studentService
                                .getStudentsByCourseSectionSemester(
                                        courseId,
                                        section,
                                        semester
                                )
                );
            }

            if (courseId != null) {

                return ResponseEntity.ok(
                        studentService.getStudentsByCourse(
                                courseId
                        )
                );
            }

            if (section != null) {

                return ResponseEntity.ok(
                        studentService.getStudentsBySection(
                                section
                        )
                );
            }

            if (semester != null) {

                return ResponseEntity.ok(
                        studentService.getStudentsBySemester(
                                semester
                        )
                );
            }

            return ResponseEntity.ok(
                    studentService.getAllStudents()
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // STUDENT PROFILE
    // -------------------------------------------------------------------------

    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(
            @PathVariable String id,
            Authentication authentication) {

        authorizationService.requireStudentOwnerOrAdmin(
                id,
                authentication
        );

        return studentService.getStudentById(id)
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity
                                .notFound()
                                .build()
                );
    }

    // -------------------------------------------------------------------------
    // TIMETABLE
    // -------------------------------------------------------------------------

    @GetMapping("/{id}/timetable")
    public ResponseEntity<?> getStudentTimetable(
            @PathVariable String id,
            Authentication authentication) {

        authorizationService.requireStudentOwnerOrAdmin(
                id,
                authentication
        );

        try {

            return ResponseEntity.ok(
                    studentService.getStudentTimetable(id)
            );

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
    // ATTENDANCE
    // -------------------------------------------------------------------------

    @GetMapping("/{id}/attendance")
    public ResponseEntity<?> getStudentAttendance(
            @PathVariable String id,
            Authentication authentication) {

        authorizationService.requireStudentOwnerOrAdmin(
                id,
                authentication
        );

        try {

            return ResponseEntity.ok(
                    studentService.getStudentAttendance(id)
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }

    @GetMapping("/{id}/attendance/subject/{subjectId}")
    public ResponseEntity<?> getStudentSubjectAttendance(
            @PathVariable String id,
            @PathVariable String subjectId,
            Authentication authentication) {

        authorizationService.requireStudentOwnerOrAdmin(
                id,
                authentication
        );

        try {

            return ResponseEntity.ok(
                    studentService.getStudentSubjectAttendance(
                            id,
                            subjectId
                    )
            );

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
    // SELECTED SUBJECTS
    // -------------------------------------------------------------------------

    @GetMapping("/{id}/selected-subjects")
    public ResponseEntity<?> getStudentSelectedSubjects(
            @PathVariable String id,
            Authentication authentication) {

        authorizationService.requireStudentOwnerOrAdmin(
                id,
                authentication
        );

        try {

            return ResponseEntity.ok(
                    studentService.getStudentSelectedSubjects(id)
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // PROFESSORS
    // -------------------------------------------------------------------------

    @GetMapping("/{id}/professors")
    public ResponseEntity<?> getProfessorsForStudent(
            @PathVariable String id,
            Authentication authentication) {

        authorizationService.requireStudentOwnerOrAdmin(
                id,
                authentication
        );

        try {

            return ResponseEntity.ok(
                    studentService.getProfessorsForStudent(id)
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // CREATE STUDENT
    // ALL ADMINS
    // -------------------------------------------------------------------------

    @PostMapping
    public ResponseEntity<?> createStudent(
            @RequestBody Student student) {

        try {

            Student savedStudent =
                    studentService.saveStudent(student);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(savedStudent);

        } catch (IllegalArgumentException e) {

            /*
             * StudentService performs the global phone-number
             * uniqueness checks against:
             *
             * STUDENT
             * PROFESSOR
             * ADMIN
             *
             * Return the actual message to the frontend.
             */
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(e.getMessage());

        } catch (IllegalStateException e) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // UPDATE STUDENT
    // ALL ADMINS
    // -------------------------------------------------------------------------

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStudent(
            @PathVariable String id,
            @RequestBody Student student) {

        if (studentService.getStudentById(id).isEmpty()) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Student not found: " + id);
        }

        /*
         * The path variable is authoritative.
         * Prevent a different ID in the request body from
         * changing which student account is updated.
         */
        student.setStudentId(id);

        try {

            Student updatedStudent =
                    studentService.saveStudent(student);

            return ResponseEntity.ok(
                    updatedStudent
            );

        } catch (IllegalArgumentException e) {

            /*
             * Includes duplicate phone numbers belonging to:
             *
             * another student
             * professor
             * admin
             */
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(e.getMessage());

        } catch (IllegalStateException e) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // PROMOTION
    // ALL ADMINS
    // -------------------------------------------------------------------------

    @PutMapping("/{id}/promote")
    public ResponseEntity<?> promoteStudent(
            @PathVariable String id) {

        try {

            Student promotedStudent =
                    studentService.promoteStudent(id);

            return ResponseEntity.ok(
                    promotedStudent
            );

        } catch (IllegalArgumentException e) {

            /*
             * If the student does not exist, return 404.
             * Otherwise return the validation message, e.g.
             * Semester 8 cannot be promoted further.
             */
            if (studentService.getStudentById(id).isEmpty()) {

                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .build();
            }

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
    // ACTIVATE / DEACTIVATE STUDENT
    // ALL ADMINS
    // -------------------------------------------------------------------------

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> setStudentActive(
            @PathVariable String id,
            @RequestParam boolean active) {

        try {

            Student updatedStudent =
                    studentService.setStudentActive(
                            id,
                            active
                    );

            return ResponseEntity.ok(
                    updatedStudent
            );

        } catch (IllegalArgumentException e) {

            if (studentService.getStudentById(id).isEmpty()) {

                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .build();
            }

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // DELETE STUDENT
    // ALL ADMINS
    // -------------------------------------------------------------------------

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStudent(
            @PathVariable String id) {

        if (studentService.getStudentById(id).isEmpty()) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Student not found: " + id);
        }

        try {

            studentService.deleteStudentById(id);

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