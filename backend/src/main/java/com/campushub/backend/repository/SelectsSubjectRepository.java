package com.campushub.backend.repository;

import com.campushub.backend.entity.SelectsSubject;
import com.campushub.backend.entity.SelectsSubjectId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SelectsSubjectRepository
        extends JpaRepository<SelectsSubject, SelectsSubjectId> {

    boolean existsBySubject_SubjectId(String subjectId);

    List<SelectsSubject> findByStudent_StudentId(String studentId);

    // Needed when a student is deleted
    long deleteByStudent_StudentId(String studentId);
}