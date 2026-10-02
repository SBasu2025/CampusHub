package com.campushub.backend.service;

import com.campushub.backend.dto.AttendanceSummary;
import com.campushub.backend.entity.Attendance;
import com.campushub.backend.entity.AttendanceId;
import com.campushub.backend.entity.ClassSession;
import com.campushub.backend.entity.Student;
import com.campushub.backend.repository.AttendanceRepository;
import com.campushub.backend.repository.ClassSessionRepository;
import com.campushub.backend.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final ClassSessionRepository classSessionRepository;
    private final StudentRepository studentRepository;

    public AttendanceService(
            AttendanceRepository attendanceRepository,
            ClassSessionRepository classSessionRepository,
            StudentRepository studentRepository) {

        this.attendanceRepository = attendanceRepository;
        this.classSessionRepository = classSessionRepository;
        this.studentRepository = studentRepository;
    }

    public List<Attendance> getAllAttendances() {
        return attendanceRepository.findAll();
    }

    public List<Attendance> getAttendanceByStudent(String studentId) {
        return attendanceRepository.findByStudent_StudentId(studentId);
    }

    public List<Attendance> getAttendanceBySession(String sessionId) {

        if (classSessionRepository.findById(sessionId).isEmpty()) {
            throw new IllegalArgumentException(
                    "Class session not found: " + sessionId
            );
        }

        return attendanceRepository
                .findByClassSession_SessionId(sessionId);
    }

    public List<Attendance> getAttendanceBySubject(String subjectId) {
        return attendanceRepository
                .findByClassSession_Teaching_IdSubjectId(subjectId);
    }

    public List<Attendance> getAttendanceByCourse(String courseId) {
        return attendanceRepository
                .findByClassSession_Course_CourseId(courseId);
    }

    public Optional<Attendance> getAttendanceById(AttendanceId id) {
        return attendanceRepository.findById(id);
    }

    // -------------------------------------------------------------------------
    // STUDENT SUBJECT ATTENDANCE SUMMARY
    // -------------------------------------------------------------------------

    public AttendanceSummary getStudentSubjectAttendanceSummary(
            String studentId,
            String subjectId) {

        Student student =
                studentRepository.findById(studentId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Student not found: " + studentId
                                ));

        if (subjectId == null || subjectId.isBlank()) {
            throw new IllegalArgumentException(
                    "Subject ID is required."
            );
        }

        if (student.getCourse() == null
                || student.getCourse().getCourseId() == null) {

            throw new IllegalStateException(
                    "Student course is not set."
            );
        }

        if (student.getSection() == null
                || student.getSection().isBlank()) {

            throw new IllegalStateException(
                    "Student section is not set."
            );
        }

        if (student.getSemester() == null) {

            throw new IllegalStateException(
                    "Student semester is not set."
            );
        }

        /*
         * Find every class session belonging to this student's:
         *
         * Course + Section + Semester
         */
        List<ClassSession> cohortSessions =
                classSessionRepository
                        .findByCourse_CourseIdAndSectionAndSemester(
                                student.getCourse().getCourseId(),
                                student.getSection(),
                                student.getSemester()
                        );

        /*
         * Keep only sessions for the requested subject.
         */
        Set<String> subjectSessionIds =
                new HashSet<>();

        String subjectName = null;

        for (ClassSession classSession : cohortSessions) {

            if (classSession == null
                    || classSession.getSessionId() == null
                    || classSession.getTeaching() == null
                    || classSession.getTeaching().getSubject() == null) {

                continue;
            }

            if (classSession.getTeaching()
                    .getSubject()
                    .getSubjectId()
                    .equals(subjectId)) {

                subjectSessionIds.add(
                        classSession.getSessionId()
                );

                if (classSession.getTeaching()
                        .getSubject()
                        .getSubjectName() != null) {

                    subjectName =
                            classSession.getTeaching()
                                    .getSubject()
                                    .getSubjectName();
                }
            }
        }

        /*
         * Total sessions = ALL conducted class sessions for this
         * student + subject + section + semester combination.
         *
         * It is NOT based on the number of attendance rows.
         */
        long totalSessions =
                subjectSessionIds.size();

        /*
         * Get all attendance records of the student and count only
         * records belonging to the applicable subject sessions.
         */
        List<Attendance> attendanceRecords =
                attendanceRepository
                        .findByStudent_StudentId(studentId);

        long presentSessions = 0;

        for (Attendance attendance : attendanceRecords) {

            if (attendance == null
                    || attendance.getClassSession() == null
                    || attendance.getClassSession().getSessionId() == null) {

                continue;
            }

            String sessionId =
                    attendance.getClassSession().getSessionId();

            if (!subjectSessionIds.contains(sessionId)) {
                continue;
            }

            if ("Present".equalsIgnoreCase(
                    attendance.getStatus())) {

                presentSessions++;
            }
        }

        long absentSessions =
                totalSessions - presentSessions;

        double attendancePercentage = 0.0;

        if (totalSessions > 0) {
            attendancePercentage =
                    (presentSessions * 100.0)
                            / totalSessions;
        }

        return new AttendanceSummary(
                student.getStudentId(),
                student.getStudentName(),
                subjectId,
                subjectName,
                totalSessions,
                presentSessions,
                absentSessions,
                attendancePercentage
        );
    }

    // -------------------------------------------------------------------------
    // UPDATE ATTENDANCE
    // -------------------------------------------------------------------------

    public Attendance updateAttendance(
            String sessionId,
            String studentId,
            String status) {

        validateStatus(status);

        AttendanceId id =
                new AttendanceId(sessionId, studentId);

        Attendance existingAttendance =
                attendanceRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Attendance record not found."
                                ));

        ClassSession classSession =
                classSessionRepository.findById(sessionId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Class session not found: "
                                                + sessionId
                                ));

        Student student =
                studentRepository.findById(studentId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Student not found: "
                                                + studentId
                                ));

        validateStudentMatchesClassSession(
                student,
                classSession
        );

        existingAttendance.setClassSession(classSession);
        existingAttendance.setStudent(student);
        existingAttendance.setStatus(status);

        return attendanceRepository.save(
                existingAttendance
        );
    }

    // -------------------------------------------------------------------------
    // SAVE ATTENDANCE
    // -------------------------------------------------------------------------

    public Attendance saveAttendance(
            Attendance attendance) {

        if (attendance == null) {
            throw new IllegalArgumentException(
                    "Attendance data is required."
            );
        }

        if (attendance.getClassSession() == null
                || attendance.getClassSession().getSessionId() == null) {

            throw new IllegalArgumentException(
                    "Class session is required for attendance."
            );
        }

        if (attendance.getStudent() == null
                || attendance.getStudent().getStudentId() == null) {

            throw new IllegalArgumentException(
                    "Student is required for attendance."
            );
        }

        validateStatus(
                attendance.getStatus()
        );

        String sessionId =
                attendance.getClassSession().getSessionId();

        String studentId =
                attendance.getStudent().getStudentId();

        ClassSession classSession =
                classSessionRepository.findById(sessionId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Class session not found: "
                                                + sessionId
                                ));

        Student student =
                studentRepository.findById(studentId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Student not found: "
                                                + studentId
                                ));

        /*
         * Student must belong to the same:
         *
         * Course + Section + Semester
         *
         * as the class session.
         */
        validateStudentMatchesClassSession(
                student,
                classSession
        );

        attendance.setClassSession(classSession);
        attendance.setStudent(student);

        attendance.setId(
                new AttendanceId(
                        sessionId,
                        studentId
                )
        );

        return attendanceRepository.save(
                attendance
        );
    }

    // -------------------------------------------------------------------------
    // DELETE
    // -------------------------------------------------------------------------

    public void deleteAttendanceById(AttendanceId id) {
        attendanceRepository.deleteById(id);
    }

    // -------------------------------------------------------------------------
    // VALIDATION HELPERS
    // -------------------------------------------------------------------------

    private void validateStudentMatchesClassSession(
            Student student,
            ClassSession classSession) {

        if (student.getCourse() == null
                || student.getCourse().getCourseId() == null) {

            throw new IllegalStateException(
                    "Student course is not set."
            );
        }

        if (classSession.getCourse() == null
                || classSession.getCourse().getCourseId() == null) {

            throw new IllegalStateException(
                    "Class session course is not set."
            );
        }

        if (student.getSection() == null
                || student.getSection().isBlank()) {

            throw new IllegalStateException(
                    "Student section is not set."
            );
        }

        if (classSession.getSection() == null
                || classSession.getSection().isBlank()) {

            throw new IllegalStateException(
                    "Class session section is not set."
            );
        }

        if (student.getSemester() == null) {

            throw new IllegalStateException(
                    "Student semester is not set."
            );
        }

        if (classSession.getSemester() == null) {

            throw new IllegalStateException(
                    "Class session semester is not set."
            );
        }

        if (!student.getCourse()
                .getCourseId()
                .equals(
                        classSession.getCourse()
                                .getCourseId()
                )) {

            throw new IllegalStateException(
                    "Student does not belong to the course of this class session."
            );
        }

        if (!student.getSection()
                .equals(
                        classSession.getSection()
                )) {

            throw new IllegalStateException(
                    "Student does not belong to the section of this class session."
            );
        }

        if (!student.getSemester()
                .equals(
                        classSession.getSemester()
                )) {

            throw new IllegalStateException(
                    "Student does not belong to the semester of this class session."
            );
        }
    }

    private void validateStatus(String status) {

        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException(
                    "Attendance status is required."
            );
        }

        if (!"Present".equalsIgnoreCase(status)
                && !"Absent".equalsIgnoreCase(status)) {

            throw new IllegalArgumentException(
                    "Attendance status must be Present or Absent."
            );
        }
    }
}