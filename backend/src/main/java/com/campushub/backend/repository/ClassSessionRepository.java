package com.campushub.backend.repository;

import com.campushub.backend.entity.ClassSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClassSessionRepository extends JpaRepository<ClassSession, String> {

    List<ClassSession> findByCourse_CourseId(String courseId);

    List<ClassSession> findBySection(String section);

    List<ClassSession> findBySemester(Integer semester);

    List<ClassSession> findByCourse_CourseIdAndSectionAndSemester(
            String courseId,
            String section,
            Integer semester
    );

    List<ClassSession> findByTeaching_IdProfId(String profId);

    List<ClassSession> findByTeaching_IdProfIdAndTeaching_IdSubjectId(
            String profId,
            String subjectId
    );

    long countByTeaching_IdProfIdAndTeaching_IdSubjectId(
            String profId,
            String subjectId
    );
}