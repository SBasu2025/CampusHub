package com.campushub.backend.controller;

import com.campushub.backend.entity.Teaching;
import com.campushub.backend.entity.TeachingId;
import com.campushub.backend.service.TeachingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teachings")
public class TeachingController {

    private final TeachingService teachingService;

    public TeachingController(TeachingService teachingService) {
        this.teachingService = teachingService;
    }

    @GetMapping
    public List<Teaching> getAllTeachings() {
        return teachingService.getAllTeachings();
    }

    @GetMapping("/professor/{profId}")
    public ResponseEntity<List<Teaching>> getTeachingsByProfessor(
            @PathVariable String profId) {

        return ResponseEntity.ok(
                teachingService.getTeachingsByProfessor(profId)
        );
    }

    @GetMapping("/subject/{subjectId}")
    public ResponseEntity<List<Teaching>> getTeachingsBySubject(
            @PathVariable String subjectId) {

        return ResponseEntity.ok(
                teachingService.getTeachingsBySubject(subjectId)
        );
    }

    @GetMapping("/{profId}/{subjectId}")
    public ResponseEntity<Teaching> getTeachingById(
            @PathVariable String profId,
            @PathVariable String subjectId) {

        TeachingId id = new TeachingId(profId, subjectId);

        return teachingService.getTeachingById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Teaching> createTeaching(
            @RequestBody Teaching teaching) {

        try {
            Teaching savedTeaching =
                    teachingService.saveTeaching(teaching);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(savedTeaching);

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

    @PutMapping("/reassign")
    public ResponseEntity<Teaching> reassignProfessor(
            @RequestParam String oldProfId,
            @RequestParam String subjectId,
            @RequestParam String newProfId) {

        try {
            Teaching reassignedTeaching =
                    teachingService.reassignProfessor(
                            oldProfId,
                            subjectId,
                            newProfId
                    );

            return ResponseEntity.ok(reassignedTeaching);

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

    @DeleteMapping("/{profId}/{subjectId}")
    public ResponseEntity<Void> deleteTeaching(
            @PathVariable String profId,
            @PathVariable String subjectId) {

        TeachingId id = new TeachingId(profId, subjectId);

        if (teachingService.getTeachingById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        teachingService.deleteTeachingById(id);

        return ResponseEntity.noContent().build();
    }
}