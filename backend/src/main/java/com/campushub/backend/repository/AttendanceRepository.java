package com.campushub.backend.repository;

import com.campushub.backend.entity.Attendance;
import com.campushub.backend.entity.AttendanceId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, AttendanceId> {

    List<Attendance> findByStudent_StudentId(String studentId);

    List<Attendance> findByClassSession_SessionId(String sessionId);

    List<Attendance> findByClassSession_Teaching_IdSubjectId(
            String subjectId
    );

    List<Attendance> findByClassSession_Course_CourseId(
            String courseId
    );

    List<Attendance> findByStudent_StudentIdAndClassSession_Teaching_IdProfIdAndClassSession_Teaching_IdSubjectId(
            String studentId,
            String profId,
            String subjectId
    );

    // Needed when a class session is deleted
    long deleteByClassSession_SessionId(String sessionId);

    // Needed when a student is deleted
    long deleteByStudent_StudentId(String studentId);
}