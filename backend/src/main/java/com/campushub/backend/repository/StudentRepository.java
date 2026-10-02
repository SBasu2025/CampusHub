package com.campushub.backend.repository;

import com.campushub.backend.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StudentRepository
        extends JpaRepository<Student, String> {

    boolean existsByCourse_CourseId(
            String courseId
    );

    List<Student> findByCourse_CourseId(
            String courseId
    );

    List<Student> findBySection(
            String section
    );

    List<Student> findBySemester(
            Integer semester
    );

    // ----------------------------------------------------------
    // PHONE NUMBER
    // ----------------------------------------------------------

    /*
     * Checks whether this phone number already belongs
     * to any student.
     */
    boolean existsByPhoneNumber(
            String phoneNumber
    );

    /*
     * Used when updating an existing student.
     *
     * The current student's own ID is excluded from the check,
     * so the student can keep their existing phone number.
     */
    boolean existsByPhoneNumberAndStudentIdNot(
            String phoneNumber,
            String studentId
    );

    // ----------------------------------------------------------
    // COURSE + SECTION + SEMESTER
    // ----------------------------------------------------------
    //
    // Section comparison is normalized so that:
    //
    //   "A"
    //   "a"
    //   " A "
    //
    // are treated as the same section.
    //
    // Course and semester remain exact restrictions.
    // ----------------------------------------------------------

    @Query("""
            SELECT s
            FROM Student s
            WHERE s.course.courseId = :courseId
              AND LOWER(TRIM(s.section)) = LOWER(TRIM(:section))
              AND s.semester = :semester
            ORDER BY s.studentId ASC
            """)
    List<Student>
    findByCourse_CourseIdAndSectionAndSemester(
            @Param("courseId")
            String courseId,

            @Param("section")
            String section,

            @Param("semester")
            Integer semester
    );

    // ----------------------------------------------------------
    // DISTINCT SECTIONS FOR EXAMINATION WORKFLOW
    // ----------------------------------------------------------

    @Query("""
            SELECT DISTINCT TRIM(s.section)
            FROM Student s
            WHERE s.course.courseId = :courseId
              AND s.semester = :semester
              AND s.section IS NOT NULL
              AND TRIM(s.section) <> ''
            ORDER BY TRIM(s.section) ASC
            """)
    List<String>
    findDistinctSectionsByCourseAndSemester(
            @Param("courseId")
            String courseId,

            @Param("semester")
            Integer semester
    );
}