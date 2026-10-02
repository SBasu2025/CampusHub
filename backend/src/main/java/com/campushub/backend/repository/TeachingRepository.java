package com.campushub.backend.repository;

import com.campushub.backend.entity.Teaching;
import com.campushub.backend.entity.TeachingId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeachingRepository extends JpaRepository<Teaching, TeachingId> {

    boolean existsBySubject_SubjectId(String subjectId);

    List<Teaching> findByProfessor_ProfId(String profId);

    List<Teaching> findBySubject_SubjectId(String subjectId);
}