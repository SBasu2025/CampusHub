package com.campushub.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

@Entity
@Table(name = "ATTENDANCE")
public class Attendance {

    @EmbeddedId
    private AttendanceId id;

    @ManyToOne
    @MapsId("sessionId")
    @JoinColumn(name = "session_id", nullable = false)
    private ClassSession classSession;

    @ManyToOne
    @MapsId("studentId")
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "status")
    private String status;

    public Attendance() {
    }

    public Attendance(AttendanceId id,
                       ClassSession classSession,
                       Student student,
                       String status) {
        this.id = id;
        this.classSession = classSession;
        this.student = student;
        this.status = status;
    }

    public AttendanceId getId() {
        return id;
    }

    public void setId(AttendanceId id) {
        this.id = id;
    }

    public ClassSession getClassSession() {
        return classSession;
    }

    public void setClassSession(ClassSession classSession) {
        this.classSession = classSession;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}