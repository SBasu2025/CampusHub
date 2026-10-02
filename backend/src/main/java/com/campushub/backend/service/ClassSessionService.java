package com.campushub.backend.service;

import com.campushub.backend.entity.ClassSession;
import com.campushub.backend.entity.Course;
import com.campushub.backend.entity.Teaching;
import com.campushub.backend.entity.TeachingId;
import com.campushub.backend.repository.AttendanceRepository;
import com.campushub.backend.repository.ClassSessionRepository;
import com.campushub.backend.repository.CourseRepository;
import com.campushub.backend.repository.TeachingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class ClassSessionService {

    private final ClassSessionRepository classSessionRepository;
    private final CourseRepository courseRepository;
    private final TeachingRepository teachingRepository;
    private final AttendanceRepository attendanceRepository;

    public ClassSessionService(
            ClassSessionRepository classSessionRepository,
            CourseRepository courseRepository,
            TeachingRepository teachingRepository,
            AttendanceRepository attendanceRepository) {

        this.classSessionRepository = classSessionRepository;
        this.courseRepository = courseRepository;
        this.teachingRepository = teachingRepository;
        this.attendanceRepository = attendanceRepository;
    }

    // -------------------------------------------------------------------------
    // RETRIEVAL
    // -------------------------------------------------------------------------

    public List<ClassSession> getAllClassSessions() {
        return classSessionRepository.findAll();
    }

    public List<ClassSession> getClassSessionsByCourse(String courseId) {
        return classSessionRepository.findByCourse_CourseId(courseId);
    }

    public List<ClassSession> getClassSessionsBySection(String section) {
        return classSessionRepository.findBySection(section);
    }

    public List<ClassSession> getClassSessionsBySemester(Integer semester) {
        return classSessionRepository.findBySemester(semester);
    }

    public List<ClassSession> getClassSessionsByProfessor(String profId) {
        return classSessionRepository.findByTeaching_IdProfId(profId);
    }

    public Optional<ClassSession> getClassSessionById(String id) {
        return classSessionRepository.findById(id);
    }

    // -------------------------------------------------------------------------
    // CREATE
    // -------------------------------------------------------------------------

    public ClassSession saveClassSession(
            ClassSession classSession) {

        if (classSession == null) {
            throw new IllegalArgumentException(
                    "Class session data is required."
            );
        }

        if (classSession.getCourse() == null ||
                classSession.getCourse().getCourseId() == null ||
                classSession.getCourse().getCourseId().isBlank()) {

            throw new IllegalArgumentException(
                    "Course is required for a class session."
            );
        }

        if (classSession.getTeaching() == null ||
                classSession.getTeaching().getId() == null) {

            throw new IllegalArgumentException(
                    "Teaching assignment is required for a class session."
            );
        }

        validateSessionTimes(
                classSession.getStartTime(),
                classSession.getEndTime()
        );

        validateRequiredSessionFields(classSession);

        String courseId =
                classSession.getCourse().getCourseId();

        TeachingId teachingId =
                classSession.getTeaching().getId();

        Course course =
                courseRepository.findById(courseId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Course not found: " + courseId
                                ));

        Teaching teaching =
                teachingRepository.findById(teachingId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Teaching assignment not found."
                                ));

        /*
         * Critical integrity check:
         *
         * The subject being taught by this Teaching record must belong
         * to the same course as the ClassSession.
         */
        if (teaching.getSubject() == null ||
                teaching.getSubject().getCourse() == null ||
                teaching.getSubject().getCourse().getCourseId() == null) {

            throw new IllegalStateException(
                    "Teaching assignment has no valid subject/course."
            );
        }

        String teachingCourseId =
                teaching.getSubject()
                        .getCourse()
                        .getCourseId();

        if (!courseId.equals(teachingCourseId)) {

            throw new IllegalArgumentException(
                    "Teaching assignment does not belong to the selected course."
            );
        }

        classSession.setCourse(course);
        classSession.setTeaching(teaching);

        return classSessionRepository.save(classSession);
    }

    // -------------------------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------------------------

    @Transactional
    public ClassSession updateClassSession(
            String id,
            String day,
            LocalTime startTime,
            LocalTime endTime) {

        ClassSession existingSession =
                classSessionRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Class session not found: " + id
                                ));

        /*
         * Calculate the values that will actually exist after the update.
         * This prevents invalid combinations such as:
         *
         * existing start = 10:00
         * new end         = 09:00
         */
        LocalTime finalStartTime =
                startTime != null
                        ? startTime
                        : existingSession.getStartTime();

        LocalTime finalEndTime =
                endTime != null
                        ? endTime
                        : existingSession.getEndTime();

        validateSessionTimes(
                finalStartTime,
                finalEndTime
        );

        if (day != null) {

            if (day.isBlank()) {
                throw new IllegalArgumentException(
                        "Day cannot be blank."
                );
            }

            existingSession.setDay(day);
        }

        if (startTime != null) {
            existingSession.setStartTime(startTime);
        }

        if (endTime != null) {
            existingSession.setEndTime(endTime);
        }

        return classSessionRepository.save(existingSession);
    }

    // -------------------------------------------------------------------------
    // DELETE
    // -------------------------------------------------------------------------

    @Transactional
    public void deleteClassSessionById(String id) {

        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException(
                    "Class session ID is required."
            );
        }

        if (!classSessionRepository.existsById(id)) {
            throw new IllegalArgumentException(
                    "Class session not found: " + id
            );
        }

        /*
         * ATTENDANCE has a foreign key to CLASS_SESSION.
         *
         * Therefore attendance records must be removed first.
         */
        attendanceRepository.deleteByClassSession_SessionId(id);

        /*
         * Now the class session can safely be deleted.
         */
        classSessionRepository.deleteById(id);
    }

    // -------------------------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------------------------

    private void validateRequiredSessionFields(
            ClassSession classSession) {

        if (classSession.getSemester() == null ||
                classSession.getSemester() <= 0) {

            throw new IllegalArgumentException(
                    "Semester must be greater than 0."
            );
        }

        if (classSession.getSection() == null ||
                classSession.getSection().isBlank()) {

            throw new IllegalArgumentException(
                    "Section is required."
            );
        }

        if (classSession.getDay() == null ||
                classSession.getDay().isBlank()) {

            throw new IllegalArgumentException(
                    "Day is required."
            );
        }

        if (classSession.getStartTime() == null) {

            throw new IllegalArgumentException(
                    "Start time is required."
            );
        }

        if (classSession.getEndTime() == null) {

            throw new IllegalArgumentException(
                    "End time is required."
            );
        }
    }

    private void validateSessionTimes(
            LocalTime startTime,
            LocalTime endTime) {

        if (startTime == null || endTime == null) {
            throw new IllegalArgumentException(
                    "Start time and end time are required."
            );
        }

        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException(
                    "Start time must be before end time."
            );
        }
    }
}