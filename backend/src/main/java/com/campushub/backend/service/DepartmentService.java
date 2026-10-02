package com.campushub.backend.service;

import com.campushub.backend.entity.Department;
import com.campushub.backend.repository.CourseRepository;
import com.campushub.backend.repository.DepartmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;

    public DepartmentService(DepartmentRepository departmentRepository,
                             CourseRepository courseRepository) {
        this.departmentRepository = departmentRepository;
        this.courseRepository = courseRepository;
    }

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public Optional<Department> getDepartmentById(String id) {
        return departmentRepository.findById(id);
    }

    public Department saveDepartment(Department department) {
        return departmentRepository.save(department);
    }

    public void deleteDepartmentById(String id) {

        if (courseRepository.existsByDepartment_DeptId(id)) {
            throw new IllegalStateException(
                    "Cannot delete department because courses are linked to it."
            );
        }

        departmentRepository.deleteById(id);
    }
}