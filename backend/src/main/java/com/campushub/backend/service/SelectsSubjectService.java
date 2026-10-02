package com.campushub.backend.service;

import com.campushub.backend.entity.SelectsSubject;
import com.campushub.backend.entity.SelectsSubjectId;
import com.campushub.backend.repository.SelectsSubjectRepository;
import com.campushub.backend.repository.StudentRepository;
import com.campushub.backend.repository.SubjectRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SelectsSubjectService {

    private final SelectsSubjectRepository selectsSubjectRepository;
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;

    public SelectsSubjectService(
            SelectsSubjectRepository selectsSubjectRepository,
            StudentRepository studentRepository,
            SubjectRepository subjectRepository) {

        this.selectsSubjectRepository = selectsSubjectRepository;
        this.studentRepository = studentRepository;
        this.subjectRepository = subjectRepository;
    }

    public List<SelectsSubject> getAllSelectsSubjects() {
        return selectsSubjectRepository.findAll();
    }

    public List<SelectsSubject> getSubjectsSelectedByStudent(String studentId) {

        if (studentRepository.findById(studentId).isEmpty()) {
            throw new IllegalArgumentException(
                    "Student not found: " + studentId
            );
        }

        return selectsSubjectRepository.findByStudent_StudentId(studentId);
    }

    public Optional<SelectsSubject> getSelectsSubjectById(SelectsSubjectId id) {
        return selectsSubjectRepository.findById(id);
    }

    public SelectsSubject saveSelectsSubject(SelectsSubject selectsSubject) {

        if (selectsSubject.getStudent() == null ||
                selectsSubject.getStudent().getStudentId() == null) {

            throw new IllegalArgumentException(
                    "Student is required."
            );
        }

        if (selectsSubject.getSubject() == null ||
                selectsSubject.getSubject().getSubjectId() == null) {

            throw new IllegalArgumentException(
                    "Subject is required."
            );
        }

        String studentId = selectsSubject.getStudent().getStudentId();
        String subjectId = selectsSubject.getSubject().getSubjectId();

        var student = studentRepository.findById(studentId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Student not found: " + studentId
                        ));

        var subject = subjectRepository.findById(subjectId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Subject not found: " + subjectId
                        ));

        /*
         * A student must be enrolled in a course.
         */
        if (student.getCourse() == null ||
                student.getCourse().getCourseId() == null) {

            throw new IllegalStateException(
                    "Student is not enrolled in a course."
            );
        }

        /*
         * A subject must belong to a course.
         */
        if (subject.getCourse() == null ||
                subject.getCourse().getCourseId() == null) {

            throw new IllegalStateException(
                    "Subject is not linked to a course."
            );
        }

        /*
         * ---------------------------------------------------------
         * COURSE MATCH
         * ---------------------------------------------------------
         *
         * A student can select only a subject from the
         * student's enrolled course.
         */
        if (!student.getCourse().getCourseId()
                .equals(subject.getCourse().getCourseId())) {

            throw new IllegalStateException(
                    "Student can select only subjects from the enrolled course."
            );
        }

        /*
         * ---------------------------------------------------------
         * DEPARTMENT MATCH
         * ---------------------------------------------------------
         *
         * Department is derived through the student's course
         * and the subject's course.
         *
         * This additional check prevents inconsistent data if
         * course relationships are ever changed.
         */
        if (student.getCourse().getDepartment() == null ||
                student.getCourse().getDepartment().getDeptId() == null) {

            throw new IllegalStateException(
                    "Student course is not linked to a department."
            );
        }

        if (subject.getCourse().getDepartment() == null ||
                subject.getCourse().getDepartment().getDeptId() == null) {

            throw new IllegalStateException(
                    "Subject course is not linked to a department."
            );
        }

        if (!student.getCourse().getDepartment().getDeptId()
                .equals(subject.getCourse().getDepartment().getDeptId())) {

            throw new IllegalStateException(
                    "Student can select only subjects from the enrolled department."
            );
        }

        /*
         * ---------------------------------------------------------
         * SEMESTER MATCH
         * ---------------------------------------------------------
         *
         * This is the important new restriction.
         *
         * Example:
         *
         * Student:
         *     Course   = CSE01
         *     Dept     = Computer Science
         *     Semester = 2
         *
         * Subject:
         *     Course   = CSE01
         *     Dept     = Computer Science
         *     Semester = 7
         *
         * Result:
         *     REJECT
         */
        if (student.getSemester() == null ||
                subject.getSemester() == null) {

            throw new IllegalStateException(
                    "Student and subject semester must be configured."
            );
        }

        if (!student.getSemester()
                .equals(subject.getSemester())) {

            throw new IllegalStateException(
                    "Student can select only subjects offered for the current semester."
            );
        }

        /*
         * Keep both the embedded ID and the entity relationships
         * synchronized.
         */
        selectsSubject.setId(
                new SelectsSubjectId(studentId, subjectId)
        );

        selectsSubject.setStudent(student);
        selectsSubject.setSubject(subject);

        return selectsSubjectRepository.save(selectsSubject);
    }

    public void deleteSelectsSubjectById(SelectsSubjectId id) {
        selectsSubjectRepository.deleteById(id);
    }
}