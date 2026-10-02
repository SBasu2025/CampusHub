package com.campushub.backend.repository;

import com.campushub.backend.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubjectRepository extends JpaRepository<Subject, String> {

    boolean existsByCourse_CourseId(String courseId);

    List<Subject> findByCourse_CourseId(String courseId);

    // Get subjects belonging to a specific course and semester
    List<Subject> findByCourse_CourseIdAndSemester(String courseId, Integer semester);
}