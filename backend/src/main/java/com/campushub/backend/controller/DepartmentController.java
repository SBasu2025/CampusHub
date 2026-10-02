package com.campushub.backend.controller;

import com.campushub.backend.entity.Department;
import com.campushub.backend.service.DepartmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    public List<Department> getAllDepartments() {
        return departmentService.getAllDepartments();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Department> getDepartmentById(@PathVariable String id) {
        return departmentService.getDepartmentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Department> createDepartment(
            @RequestBody Department department) {

        Department savedDepartment = departmentService.saveDepartment(department);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedDepartment);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Department> updateDepartment(
            @PathVariable String id,
            @RequestBody Department department) {

        return departmentService.getDepartmentById(id)
                .map(existingDepartment -> {

                    existingDepartment.setDeptName(department.getDeptName());

                    Department updatedDepartment =
                            departmentService.saveDepartment(existingDepartment);

                    return ResponseEntity.ok(updatedDepartment);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteDepartment(@PathVariable String id) {

        if (departmentService.getDepartmentById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            departmentService.deleteDepartmentById(id);

            return ResponseEntity.noContent().build();

        } catch (IllegalStateException e) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(e.getMessage());
        }
    }
}