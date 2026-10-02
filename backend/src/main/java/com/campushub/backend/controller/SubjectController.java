package com.campushub.backend.controller;

import com.campushub.backend.entity.Subject;
import com.campushub.backend.service.SubjectService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    // -------------------------------------------------------------------------
    // RETRIEVAL
    // -------------------------------------------------------------------------

    @GetMapping
    public List<Subject> getAllSubjects(
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) Integer semester) {

        if (courseId != null && !courseId.isBlank()
                && semester != null) {

            return subjectService.getSubjectsByCourseAndSemester(
                    courseId,
                    semester
            );
        }

        if (courseId != null && !courseId.isBlank()) {
            return subjectService.getSubjectsByCourse(courseId);
        }

        return subjectService.getAllSubjects();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Subject> getSubjectById(
            @PathVariable String id) {

        return subjectService.getSubjectById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // -------------------------------------------------------------------------
    // CREATE
    // -------------------------------------------------------------------------

    @PostMapping
    public ResponseEntity<?> createSubject(
            @RequestBody Subject subject) {

        try {

            Subject savedSubject =
                    subjectService.createSubject(subject);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(savedSubject);

        } catch (IllegalStateException e) {

            /*
             * Duplicate Subject ID.
             */
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(e.getMessage());

        } catch (DataIntegrityViolationException e) {

            /*
             * Safety net for a concurrent duplicate-create request.
             */
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("A subject with this ID already exists.");

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------------------------

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSubject(
            @PathVariable String id,
            @RequestBody Subject subject) {

        try {

            Subject updatedSubject =
                    subjectService.updateSubject(
                            id,
                            subject
                    );

            return ResponseEntity.ok(updatedSubject);

        } catch (IllegalArgumentException e) {

            if (e.getMessage() != null
                    && e.getMessage().startsWith("Subject not found:")) {

                return ResponseEntity
                        .notFound()
                        .build();
            }

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());

        } catch (DataIntegrityViolationException e) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(
                            "Unable to update the subject because of a database constraint."
                    );
        }
    }

    // -------------------------------------------------------------------------
    // DELETE
    // -------------------------------------------------------------------------

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteSubject(
            @PathVariable String id) {

        if (subjectService.getSubjectById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {

            subjectService.deleteSubjectById(id);

            return ResponseEntity
                    .noContent()
                    .build();

        } catch (IllegalStateException e) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(e.getMessage());
        }
    }
}