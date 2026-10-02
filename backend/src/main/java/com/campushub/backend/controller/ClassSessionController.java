package com.campushub.backend.controller;

import com.campushub.backend.entity.ClassSession;
import com.campushub.backend.service.ClassSessionService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/class-sessions")
public class ClassSessionController {

    private final ClassSessionService classSessionService;

    public ClassSessionController(ClassSessionService classSessionService) {
        this.classSessionService = classSessionService;
    }

    @GetMapping
    public List<ClassSession> getAllClassSessions(
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) Integer semester,
            @RequestParam(required = false) String profId) {

        if (courseId != null) {
            return classSessionService.getClassSessionsByCourse(courseId);
        }

        if (section != null) {
            return classSessionService.getClassSessionsBySection(section);
        }

        if (semester != null) {
            return classSessionService.getClassSessionsBySemester(semester);
        }

        if (profId != null) {
            return classSessionService.getClassSessionsByProfessor(profId);
        }

        return classSessionService.getAllClassSessions();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClassSession> getClassSessionById(
            @PathVariable String id) {

        return classSessionService.getClassSessionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ClassSession> createClassSession(
            @RequestBody ClassSession classSession) {

        try {
            ClassSession savedClassSession =
                    classSessionService.saveClassSession(classSession);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(savedClassSession);

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClassSession> updateClassSession(
            @PathVariable String id,
            @RequestParam(required = false) String day,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
            LocalTime startTime,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
            LocalTime endTime) {

        try {
            ClassSession updatedClassSession =
                    classSessionService.updateClassSession(
                            id,
                            day,
                            startTime,
                            endTime
                    );

            return ResponseEntity.ok(updatedClassSession);

        } catch (IllegalArgumentException e) {

            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClassSession(
            @PathVariable String id) {

        if (classSessionService.getClassSessionById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        classSessionService.deleteClassSessionById(id);

        return ResponseEntity.noContent().build();
    }
}