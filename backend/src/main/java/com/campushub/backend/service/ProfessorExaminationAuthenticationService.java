package com.campushub.backend.service;

import com.campushub.backend.entity.Examination;
import com.campushub.backend.entity.Professor;
import com.campushub.backend.repository.ExaminationRepository;
import com.campushub.backend.repository.ProfessorRepository;
import org.springframework.stereotype.Service;

@Service
public class ProfessorExaminationAuthenticationService {

    private final ProfessorRepository professorRepository;
    private final ExaminationRepository examinationRepository;

    public ProfessorExaminationAuthenticationService(
            ProfessorRepository professorRepository,
            ExaminationRepository examinationRepository) {

        this.professorRepository = professorRepository;
        this.examinationRepository = examinationRepository;
    }

    public Professor authenticate(
            String examId,
            String professorId,
            String professorName) {

        if (examId == null || examId.isBlank()) {
            throw new IllegalArgumentException("Exam ID is required");
        }

        if (professorId == null || professorId.isBlank()) {
            throw new IllegalArgumentException("Professor ID is required");
        }

        if (professorName == null || professorName.isBlank()) {
            throw new IllegalArgumentException("Professor name is required");
        }

        Examination examination = examinationRepository.findById(examId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Examination not found: " + examId
                        ));

        Professor professor = professorRepository.findById(professorId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Professor not found: " + professorId
                        ));

        if (professor.getProfessorName() == null
                || !professor.getProfessorName().trim()
                .equals(professorName.trim())) {

            throw new IllegalArgumentException(
                    "Professor name does not match Professor ID"
            );
        }

        if (examination.getProfessor() == null
                || examination.getProfessor().getProfId() == null
                || !examination.getProfessor().getProfId()
                .equals(professor.getProfId())) {

            throw new IllegalArgumentException(
                    "Professor is not assigned to this examination"
            );
        }

        return professor;
    }
}