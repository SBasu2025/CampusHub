package com.campushub.backend.entity;

import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class AttendanceId implements Serializable {

    private String sessionId;
    private String studentId;

    public AttendanceId() {
    }

    public AttendanceId(String sessionId, String studentId) {
        this.sessionId = sessionId;
        this.studentId = studentId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AttendanceId)) return false;
        AttendanceId that = (AttendanceId) o;
        return Objects.equals(sessionId, that.sessionId)
                && Objects.equals(studentId, that.studentId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(sessionId, studentId);
    }
}