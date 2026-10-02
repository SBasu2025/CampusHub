package com.campushub.backend.repository;

import com.campushub.backend.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, String> {

    boolean existsByDepartment_DeptId(String deptId);

    List<Course> findByDepartment_DeptId(String deptId);
}