package com.campushub.backend.repository;

import com.campushub.backend.entity.ExamType;
import com.campushub.backend.entity.StudentMark;
import com.campushub.backend.entity.StudentMarkId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentMarkRepository
        extends JpaRepository<StudentMark, StudentMarkId> {

    // All marks of a student across all semesters and subjects
    List<StudentMark> findByStudent_StudentId(String studentId);

    // All marks belonging to one examination
    List<StudentMark> findByExamination_ExamIdOrderByStudent_StudentIdAsc(
            String examId
    );

    // Marks of one examination for one selected section
    List<StudentMark> findByExamination_ExamIdAndStudent_SectionOrderByStudent_StudentIdAsc(
            String examId,
            String section
    );

    // One student's mark for one examination
    Optional<StudentMark> findByStudent_StudentIdAndExamination_ExamId(
            String studentId,
            String examId
    );

    // All marks of one student for one subject in one semester
    List<StudentMark>
    findByStudent_StudentIdAndExamination_Subject_SubjectIdAndExamination_Semester(
            String studentId,
            String subjectId,
            Integer semester
    );

    // All marks of one student for one semester
    List<StudentMark>
    findByStudent_StudentIdAndExamination_Semester(
            String studentId,
            Integer semester
    );

    // All marks of one student for one subject across semesters
    List<StudentMark>
    findByStudent_StudentIdAndExamination_Subject_SubjectId(
            String studentId,
            String subjectId
    );

    // All marks for one subject and semester
    List<StudentMark>
    findByExamination_Subject_SubjectIdAndExamination_Semester(
            String subjectId,
            Integer semester
    );

    // Filter marks by exam type for calculation/retrieval
    List<StudentMark>
    findByStudent_StudentIdAndExamination_Subject_SubjectIdAndExamination_SemesterAndExamination_ExamType(
            String studentId,
            String subjectId,
            Integer semester,
            ExamType examType
    );

    // Convenient existence check
    boolean existsByStudent_StudentIdAndExamination_ExamId(
            String studentId,
            String examId
    );

    // Needed when an examination is deleted
    long deleteByExamination_ExamId(String examId);

    // Needed when a student is deleted
    long deleteByStudent_StudentId(String studentId);
}