package com.campushub.backend.controller;

import com.campushub.backend.entity.Professor;
import com.campushub.backend.service.ProfessorExaminationAuthenticationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/examinations/authenticate")
public class ProfessorExaminationAuthenticationController {

    private final ProfessorExaminationAuthenticationService
            authenticationService;

    public ProfessorExaminationAuthenticationController(
            ProfessorExaminationAuthenticationService authenticationService) {

        this.authenticationService = authenticationService;
    }

    @PostMapping
    public ResponseEntity<?> authenticateProfessor(
            @RequestBody AuthenticationRequest request) {

        try {

            Professor professor =
                    authenticationService.authenticate(
                            request.examId(),
                            request.professorId(),
                            request.professorName()
                    );

            return ResponseEntity.ok(
                    new AuthenticationResponse(
                            true,
                            "Professor authenticated successfully",
                            professor.getProfId(),
                            professor.getProfessorName(),
                            request.examId()
                    )
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            new AuthenticationResponse(
                                    false,
                                    e.getMessage(),
                                    null,
                                    null,
                                    request.examId()
                            )
                    );
        }
    }

    public record AuthenticationRequest(
            String examId,
            String professorId,
            String professorName
    ) {
    }

    public record AuthenticationResponse(
            boolean authenticated,
            String message,
            String professorId,
            String professorName,
            String examId
    ) {
    }
}