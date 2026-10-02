package com.campushub.backend.controller;

import com.campushub.backend.entity.SelectsSubject;
import com.campushub.backend.entity.SelectsSubjectId;
import com.campushub.backend.service.SelectsSubjectService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/selects-subjects")
public class SelectsSubjectController {

    private final SelectsSubjectService selectsSubjectService;

    public SelectsSubjectController(SelectsSubjectService selectsSubjectService) {
        this.selectsSubjectService = selectsSubjectService;
    }

    @GetMapping
    public List<SelectsSubject> getAllSelectsSubjects() {
        return selectsSubjectService.getAllSelectsSubjects();
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<SelectsSubject>> getSubjectsSelectedByStudent(
            @PathVariable String studentId) {

        try {
            return ResponseEntity.ok(
                    selectsSubjectService.getSubjectsSelectedByStudent(studentId)
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{studentId}/{subjectId}")
    public ResponseEntity<SelectsSubject> getSelectsSubjectById(
            @PathVariable String studentId,
            @PathVariable String subjectId) {

        SelectsSubjectId id =
                new SelectsSubjectId(studentId, subjectId);

        return selectsSubjectService.getSelectsSubjectById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<SelectsSubject> createSelectsSubject(
            @RequestBody SelectsSubject selectsSubject) {

        try {
            SelectsSubject savedSelectsSubject =
                    selectsSubjectService.saveSelectsSubject(selectsSubject);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(savedSelectsSubject);

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

    @DeleteMapping("/{studentId}/{subjectId}")
    public ResponseEntity<String> deleteSelectsSubject(
            @PathVariable String studentId,
            @PathVariable String subjectId) {

        SelectsSubjectId id =
                new SelectsSubjectId(studentId, subjectId);

        if (selectsSubjectService.getSelectsSubjectById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        selectsSubjectService.deleteSelectsSubjectById(id);

        return ResponseEntity.noContent().build();
    }
}