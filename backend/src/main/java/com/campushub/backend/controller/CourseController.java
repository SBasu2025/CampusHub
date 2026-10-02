package com.campushub.backend.controller;

import com.campushub.backend.entity.Course;
import com.campushub.backend.service.CourseService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    public List<Course> getAllCourses(
            @RequestParam(required = false) String departmentId) {

        if (departmentId != null) {
            return courseService.getCoursesByDepartment(departmentId);
        }

        return courseService.getAllCourses();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourseById(
            @PathVariable String id) {

        return courseService.getCourseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // -------------------------------------------------------------------------
    // CREATE
    // -------------------------------------------------------------------------

    @PostMapping
    public ResponseEntity<?> createCourse(
            @RequestBody Course course) {

        try {

            Course savedCourse =
                    courseService.createCourse(course);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(savedCourse);

        } catch (IllegalStateException e) {

            /*
             * Duplicate Course ID.
             */
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(e.getMessage());

        } catch (DataIntegrityViolationException e) {

            /*
             * Safety net for a race condition where two requests
             * attempt to create the same Course ID simultaneously.
             */
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("A course with this ID already exists.");

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
    public ResponseEntity<?> updateCourse(
            @PathVariable String id,
            @RequestBody Course course) {

        try {

            Course updatedCourse =
                    courseService.updateCourse(
                            id,
                            course
                    );

            return ResponseEntity.ok(updatedCourse);

        } catch (IllegalArgumentException e) {

            if (e.getMessage() != null
                    && e.getMessage().startsWith("Course not found:")) {

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
                    .body("Unable to update the course because of a database constraint.");
        }
    }

    // -------------------------------------------------------------------------
    // DELETE
    // -------------------------------------------------------------------------

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteCourse(
            @PathVariable String id) {

        if (courseService.getCourseById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {

            courseService.deleteCourseById(id);

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