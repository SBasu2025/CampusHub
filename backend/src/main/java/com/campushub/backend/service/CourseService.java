package com.campushub.backend.service;

import com.campushub.backend.entity.Course;
import com.campushub.backend.entity.Department;
import com.campushub.backend.repository.CourseRepository;
import com.campushub.backend.repository.DepartmentRepository;
import com.campushub.backend.repository.StudentRepository;
import com.campushub.backend.repository.SubjectRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final DepartmentRepository departmentRepository;
    private final SubjectRepository subjectRepository;
    private final StudentRepository studentRepository;

    public CourseService(
            CourseRepository courseRepository,
            DepartmentRepository departmentRepository,
            SubjectRepository subjectRepository,
            StudentRepository studentRepository) {

        this.courseRepository = courseRepository;
        this.departmentRepository = departmentRepository;
        this.subjectRepository = subjectRepository;
        this.studentRepository = studentRepository;
    }

    // -------------------------------------------------------------------------
    // RETRIEVAL
    // -------------------------------------------------------------------------

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public List<Course> getCoursesByDepartment(String deptId) {
        return courseRepository.findByDepartment_DeptId(deptId);
    }

    public Optional<Course> getCourseById(String id) {
        return courseRepository.findById(id);
    }

    // -------------------------------------------------------------------------
    // CREATE
    // -------------------------------------------------------------------------

    public Course createCourse(Course course) {

        if (course == null) {
            throw new IllegalArgumentException(
                    "Course data is required."
            );
        }

        if (course.getCourseId() == null
                || course.getCourseId().isBlank()) {

            throw new IllegalArgumentException(
                    "Course ID is required."
            );
        }

        if (course.getCourseName() == null
                || course.getCourseName().isBlank()) {

            throw new IllegalArgumentException(
                    "Course name is required."
            );
        }

        if (course.getDepartment() == null
                || course.getDepartment().getDeptId() == null
                || course.getDepartment().getDeptId().isBlank()) {

            throw new IllegalArgumentException(
                    "Department is required for a course."
            );
        }

        String courseId =
                course.getCourseId().trim();

        course.setCourseId(courseId);

        /*
         * IMPORTANT:
         * Creation must NEVER behave like an update.
         *
         * If this ID already exists, reject the request.
         */
        if (courseRepository.existsById(courseId)) {
            throw new IllegalStateException(
                    "A course with ID '" + courseId + "' already exists."
            );
        }

        String deptId =
                course.getDepartment().getDeptId().trim();

        Department department =
                departmentRepository.findById(deptId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Department not found: " + deptId
                                ));

        course.setDepartment(department);

        return courseRepository.save(course);
    }

    // -------------------------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------------------------

    public Course updateCourse(
            String id,
            Course course) {

        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException(
                    "Course ID is required."
            );
        }

        if (course == null) {
            throw new IllegalArgumentException(
                    "Course data is required."
            );
        }

        String courseId = id.trim();

        Course existingCourse =
                courseRepository.findById(courseId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Course not found: " + courseId
                                ));

        if (course.getCourseName() == null
                || course.getCourseName().isBlank()) {

            throw new IllegalArgumentException(
                    "Course name is required."
            );
        }

        if (course.getDepartment() == null
                || course.getDepartment().getDeptId() == null
                || course.getDepartment().getDeptId().isBlank()) {

            throw new IllegalArgumentException(
                    "Department is required for a course."
            );
        }

        String deptId =
                course.getDepartment().getDeptId().trim();

        Department department =
                departmentRepository.findById(deptId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Department not found: " + deptId
                                ));

        /*
         * Keep the original ID.
         *
         * Course ID is the primary key and should not be
         * changed through the normal edit operation.
         */
        existingCourse.setCourseId(courseId);
        existingCourse.setCourseName(
                course.getCourseName().trim()
        );
        existingCourse.setDepartment(department);

        return courseRepository.save(existingCourse);
    }

    // -------------------------------------------------------------------------
    // DELETE
    // -------------------------------------------------------------------------

    public void deleteCourseById(String id) {

        if (subjectRepository.existsByCourse_CourseId(id)) {
            throw new IllegalStateException(
                    "Cannot delete course because subjects are linked to it."
            );
        }

        if (studentRepository.existsByCourse_CourseId(id)) {
            throw new IllegalStateException(
                    "Cannot delete course because students are linked to it."
            );
        }

        courseRepository.deleteById(id);
    }
}