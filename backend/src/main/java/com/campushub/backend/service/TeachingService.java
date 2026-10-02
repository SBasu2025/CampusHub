package com.campushub.backend.service;

import com.campushub.backend.entity.Professor;
import com.campushub.backend.entity.Subject;
import com.campushub.backend.entity.Teaching;
import com.campushub.backend.entity.TeachingId;
import com.campushub.backend.entity.ClassSession;
import com.campushub.backend.repository.ClassSessionRepository;
import com.campushub.backend.repository.ProfessorRepository;
import com.campushub.backend.repository.SubjectRepository;
import com.campushub.backend.repository.TeachingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class TeachingService {

    private final TeachingRepository teachingRepository;
    private final ProfessorRepository professorRepository;
    private final SubjectRepository subjectRepository;
    private final ClassSessionRepository classSessionRepository;

    public TeachingService(TeachingRepository teachingRepository,
                           ProfessorRepository professorRepository,
                           SubjectRepository subjectRepository,
                           ClassSessionRepository classSessionRepository) {

        this.teachingRepository = teachingRepository;
        this.professorRepository = professorRepository;
        this.subjectRepository = subjectRepository;
        this.classSessionRepository = classSessionRepository;
    }

    public List<Teaching> getAllTeachings() {
        return teachingRepository.findAll();
    }

    public List<Teaching> getTeachingsByProfessor(String profId) {
        return teachingRepository.findByProfessor_ProfId(profId);
    }

    public List<Teaching> getTeachingsBySubject(String subjectId) {
        return teachingRepository.findBySubject_SubjectId(subjectId);
    }

    public Optional<Teaching> getTeachingById(TeachingId id) {
        return teachingRepository.findById(id);
    }

    public Teaching saveTeaching(Teaching teaching) {

        if (teaching.getProfessor() == null ||
                teaching.getProfessor().getProfId() == null) {

            throw new IllegalArgumentException(
                    "Professor is required for a teaching assignment."
            );
        }

        if (teaching.getSubject() == null ||
                teaching.getSubject().getSubjectId() == null) {

            throw new IllegalArgumentException(
                    "Subject is required for a teaching assignment."
            );
        }

        String profId = teaching.getProfessor().getProfId();
        String subjectId = teaching.getSubject().getSubjectId();

        Professor professor = professorRepository.findById(profId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Professor not found: " + profId
                        ));

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Subject not found: " + subjectId
                        ));

        TeachingId teachingId = new TeachingId(profId, subjectId);

        if (teachingRepository.existsById(teachingId)) {
            throw new IllegalStateException(
                    "Teaching assignment already exists."
            );
        }

        teaching.setProfessor(professor);
        teaching.setSubject(subject);
        teaching.setId(teachingId);

        return teachingRepository.save(teaching);
    }

    @Transactional
    public Teaching reassignProfessor(String oldProfId,
                                      String subjectId,
                                      String newProfId) {

        if (oldProfId.equals(newProfId)) {
            throw new IllegalArgumentException(
                    "New professor must be different from the current professor."
            );
        }

        TeachingId oldTeachingId =
                new TeachingId(oldProfId, subjectId);

        Teaching oldTeaching = teachingRepository.findById(oldTeachingId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Teaching assignment not found."
                        ));

        Professor newProfessor = professorRepository.findById(newProfId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "New professor not found: " + newProfId
                        ));

        TeachingId newTeachingId =
                new TeachingId(newProfId, subjectId);

        if (teachingRepository.existsById(newTeachingId)) {
            throw new IllegalStateException(
                    "The subject is already assigned to the new professor."
            );
        }

        Teaching newTeaching = new Teaching(
                newTeachingId,
                newProfessor,
                oldTeaching.getSubject()
        );

        teachingRepository.save(newTeaching);

        List<ClassSession> classSessions =
                classSessionRepository
                        .findByTeaching_IdProfIdAndTeaching_IdSubjectId(
                                oldProfId,
                                subjectId
                        );

        for (ClassSession classSession : classSessions) {
            classSession.setTeaching(newTeaching);
            classSessionRepository.save(classSession);
        }

        teachingRepository.delete(oldTeaching);

        return newTeaching;
    }

    public void deleteTeachingById(TeachingId id) {
        teachingRepository.deleteById(id);
    }
}