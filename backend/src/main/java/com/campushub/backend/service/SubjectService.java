package com.campushub.backend.service;

import com.campushub.backend.entity.Course;
import com.campushub.backend.entity.Subject;
import com.campushub.backend.repository.CourseRepository;
import com.campushub.backend.repository.SelectsSubjectRepository;
import com.campushub.backend.repository.SubjectRepository;
import com.campushub.backend.repository.TeachingRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final CourseRepository courseRepository;
    private final TeachingRepository teachingRepository;
    private final SelectsSubjectRepository selectsSubjectRepository;

    public SubjectService(
            SubjectRepository subjectRepository,
            CourseRepository courseRepository,
            TeachingRepository teachingRepository,
            SelectsSubjectRepository selectsSubjectRepository) {

        this.subjectRepository = subjectRepository;
        this.courseRepository = courseRepository;
        this.teachingRepository = teachingRepository;
        this.selectsSubjectRepository = selectsSubjectRepository;
    }

    // -------------------------------------------------------------------------
    // RETRIEVAL
    // -------------------------------------------------------------------------

    public List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }

    public List<Subject> getSubjectsByCourse(String courseId) {
        return subjectRepository.findByCourse_CourseId(courseId);
    }

    // NEW: retrieve subjects for a specific course and semester
    public List<Subject> getSubjectsByCourseAndSemester(
            String courseId,
            Integer semester) {

        return subjectRepository
                .findByCourse_CourseIdAndSemester(
                        courseId,
                        semester
                );
    }

    public Optional<Subject> getSubjectById(String id) {
        return subjectRepository.findById(id);
    }

    // -------------------------------------------------------------------------
    // CREATE
    // -------------------------------------------------------------------------

    public Subject createSubject(Subject subject) {

        if (subject == null) {
            throw new IllegalArgumentException(
                    "Subject data is required."
            );
        }

        if (subject.getSubjectId() == null
                || subject.getSubjectId().isBlank()) {

            throw new IllegalArgumentException(
                    "Subject ID is required."
            );
        }

        if (subject.getSubjectName() == null
                || subject.getSubjectName().isBlank()) {

            throw new IllegalArgumentException(
                    "Subject name is required."
            );
        }

        if (subject.getCourse() == null
                || subject.getCourse().getCourseId() == null
                || subject.getCourse().getCourseId().isBlank()) {

            throw new IllegalArgumentException(
                    "Course is required for a subject."
            );
        }

        // NEW: semester is required
        if (subject.getSemester() == null) {
            throw new IllegalArgumentException(
                    "Semester is required for a subject."
            );
        }

        // NEW: semester must be between 1 and 8
        if (subject.getSemester() < 1
                || subject.getSemester() > 8) {

            throw new IllegalArgumentException(
                    "Semester must be between 1 and 8."
            );
        }

        String subjectId =
                subject.getSubjectId().trim();

        subject.setSubjectId(subjectId);

        /*
         * IMPORTANT:
         * POST is a CREATE operation.
         *
         * Never allow an existing Subject ID to become an
         * accidental update through repository.save().
         */
        if (subjectRepository.existsById(subjectId)) {
            throw new IllegalStateException(
                    "A subject with ID '" + subjectId + "' already exists."
            );
        }

        String courseId =
                subject.getCourse().getCourseId().trim();

        Course course =
                courseRepository.findById(courseId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Course not found: " + courseId
                                ));

        subject.setCourse(course);

        return subjectRepository.save(subject);
    }

    // -------------------------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------------------------

    public Subject updateSubject(
            String id,
            Subject subject) {

        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException(
                    "Subject ID is required."
            );
        }

        if (subject == null) {
            throw new IllegalArgumentException(
                    "Subject data is required."
            );
        }

        String subjectId =
                id.trim();

        Subject existingSubject =
                subjectRepository.findById(subjectId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Subject not found: " + subjectId
                                ));

        if (subject.getSubjectName() == null
                || subject.getSubjectName().isBlank()) {

            throw new IllegalArgumentException(
                    "Subject name is required."
            );
        }

        if (subject.getCourse() == null
                || subject.getCourse().getCourseId() == null
                || subject.getCourse().getCourseId().isBlank()) {

            throw new IllegalArgumentException(
                    "Course is required for a subject."
            );
        }

        // NEW: semester is required
        if (subject.getSemester() == null) {
            throw new IllegalArgumentException(
                    "Semester is required for a subject."
            );
        }

        // NEW: semester must be between 1 and 8
        if (subject.getSemester() < 1
                || subject.getSemester() > 8) {

            throw new IllegalArgumentException(
                    "Semester must be between 1 and 8."
            );
        }

        String courseId =
                subject.getCourse().getCourseId().trim();

        Course course =
                courseRepository.findById(courseId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Course not found: " + courseId
                                ));

        /*
         * Keep the ID from the URL.
         *
         * The normal edit operation should not rename a
         * Subject primary key.
         */
        existingSubject.setSubjectId(subjectId);

        existingSubject.setSubjectName(
                subject.getSubjectName().trim()
        );

        existingSubject.setCourse(course);

        // NEW: update the semester
        existingSubject.setSemester(
                subject.getSemester()
        );

        return subjectRepository.save(existingSubject);
    }

    // -------------------------------------------------------------------------
    // DELETE
    // -------------------------------------------------------------------------

    public void deleteSubjectById(String id) {

        if (teachingRepository.existsBySubject_SubjectId(id)) {
            throw new IllegalStateException(
                    "Cannot delete subject because a teaching assignment is linked to it."
            );
        }

        if (selectsSubjectRepository.existsBySubject_SubjectId(id)) {
            throw new IllegalStateException(
                    "Cannot delete subject because students have selected it."
            );
        }

        subjectRepository.deleteById(id);
    }
}