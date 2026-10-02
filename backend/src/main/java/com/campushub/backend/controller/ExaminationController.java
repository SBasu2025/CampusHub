package com.campushub.backend.controller;

import com.campushub.backend.entity.Examination;
import com.campushub.backend.service.ExaminationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/examinations")
public class ExaminationController {

    private final ExaminationService examinationService;

    public ExaminationController(
            ExaminationService examinationService) {

        this.examinationService =
                examinationService;
    }

    // =========================================================
    // GET ALL EXAMINATIONS
    // =========================================================

    @GetMapping
    public ResponseEntity<List<Examination>>
    getAllExaminations() {

        return ResponseEntity.ok(
                examinationService
                        .getAllExaminations()
        );
    }

    // =========================================================
    // GET ONE EXAMINATION
    // =========================================================

    @GetMapping("/{examId}")
    public ResponseEntity<Examination>
    getExaminationById(
            @PathVariable String examId) {

        return examinationService
                .getExaminationById(
                        examId
                )
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity.notFound()
                                .build()
                );
    }

    // =========================================================
    // GET EXAMINATIONS BY PROFESSOR
    // =========================================================

    @GetMapping("/professor/{profId}")
    public ResponseEntity<List<Examination>>
    getExaminationsByProfessor(
            @PathVariable String profId) {

        return ResponseEntity.ok(
                examinationService
                        .getExaminationsByProfessor(
                                profId
                        )
        );
    }

    // =========================================================
    // GET EXAMINATIONS BY PROFESSOR + SUBJECT
    // =========================================================

    @GetMapping(
            "/professor/{profId}/subject/{subjectId}"
    )
    public ResponseEntity<List<Examination>>
    getExaminationsByProfessorAndSubject(
            @PathVariable String profId,
            @PathVariable String subjectId) {

        return ResponseEntity.ok(
                examinationService
                        .getExaminationsByProfessorAndSubject(
                                profId,
                                subjectId
                        )
        );
    }

    // =========================================================
    // GET EXAMINATIONS BY SUBJECT + SEMESTER
    // =========================================================

    @GetMapping(
            "/subject/{subjectId}/semester/{semester}"
    )
    public ResponseEntity<List<Examination>>
    getExaminationsBySubjectAndSemester(
            @PathVariable String subjectId,
            @PathVariable Integer semester) {

        return ResponseEntity.ok(
                examinationService
                        .getExaminationsBySubjectAndSemester(
                                subjectId,
                                semester
                        )
        );
    }

    // =========================================================
    // BULK EXAMINATION CONFIGURATION
    // =========================================================
    //
    // ADMIN sends:
    //
    // {
    //   "subjectId": "...",
    //   "semester": 5,
    //   "section": "A",
    //   "numberOfInternals": 2,
    //   "internalMaxMarks": 20,
    //   "finalMaxMarks": 60,
    //   "internalProfessorIds": [
    //       "PROF_...",
    //       "PROF_..."
    //   ],
    //   "finalProfessorId": "PROF_..."
    // }
    //
    // The controller generates all exam IDs.
    //
    // The service creates:
    //
    //   Internal 1
    //   Internal 2
    //   Final
    //
    // for exactly the configured section.
    // =========================================================

    @PostMapping("/configure")
    public ResponseEntity<?> configureExaminations(
            @RequestBody ConfigureExaminationsRequest request) {

        try {

            // -------------------------------------------------
            // BASIC REQUEST VALIDATION
            // -------------------------------------------------

            if (request == null) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                "Examination configuration is required."
                        );
            }

            if (request.numberOfInternals() == null
                    || request.numberOfInternals() <= 0) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                "Number of Internals must be greater than 0."
                        );
            }

            // -------------------------------------------------
            // GENERATE EXAM IDs
            // -------------------------------------------------
            //
            // numberOfInternals + 1
            //
            // = all Internals + Final
            // -------------------------------------------------

            List<String> examIds =
                    generateExamIds(
                            request.numberOfInternals()
                                    + 1
                    );

            // -------------------------------------------------
            // CREATE CONFIGURATION
            // -------------------------------------------------

            List<Examination> examinations =
                    examinationService
                            .configureExaminations(
                                    request.subjectId(),
                                    request.semester(),
                                    request.section(),
                                    request.numberOfInternals(),
                                    request.internalMaxMarks(),
                                    request.finalMaxMarks(),
                                    request.internalProfessorIds(),
                                    request.finalProfessorId(),
                                    examIds
                            );

            return ResponseEntity
                    .status(
                            HttpStatus.CREATED
                    )
                    .body(
                            examinations
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
    // CREATE ONE EXAMINATION
    // =========================================================

    @PostMapping
    public ResponseEntity<?> createExamination(
            @RequestBody Examination examination) {

        try {

            return ResponseEntity
                    .status(
                            HttpStatus.CREATED
                    )
                    .body(
                            examinationService
                                    .saveExamination(
                                            examination
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
    // UPDATE EXAMINATION
    // =========================================================

    @PutMapping("/{examId}")
    public ResponseEntity<?> updateExamination(
            @PathVariable String examId,
            @RequestBody Examination examination) {

        try {

            Examination updated =
                    examinationService
                            .updateExamination(
                                    examId,
                                    examination
                            );

            if (updated == null) {

                return ResponseEntity
                        .notFound()
                        .build();
            }

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
    // DELETE EXAMINATION
    // =========================================================

    @DeleteMapping("/{examId}")
    public ResponseEntity<Void>
    deleteExamination(
            @PathVariable String examId) {

        if (
                !examinationService
                        .deleteExamination(
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

    // =========================================================
    // EXAM ID GENERATION
    // =========================================================

    private List<String> generateExamIds(
            int count) {

        List<String> examIds =
                new ArrayList<>();

        for (
                int i = 0;
                i < count;
                i++
        ) {

            examIds.add(
                    "E"
                            + UUID.randomUUID()
                            .toString()
                            .replace(
                                    "-",
                                    ""
                            )
                            .substring(
                                    0,
                                    9
                            )
            );
        }

        return examIds;
    }

    // =========================================================
    // CONFIGURATION REQUEST
    // =========================================================

    public record ConfigureExaminationsRequest(

            String subjectId,

            Integer semester,

            /**
             * Section configured by the administrator.
             *
             * Example:
             * A
             * B
             * C
             */
            String section,

            Integer numberOfInternals,

            Integer internalMaxMarks,

            Integer finalMaxMarks,

            List<String> internalProfessorIds,

            String finalProfessorId

    ) {
    }
}