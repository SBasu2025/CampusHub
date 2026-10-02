package com.campushub.backend.entity;

import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class StudentMarkId implements Serializable {

    private String studentId;
    private String examId;

    public StudentMarkId() {
    }

    public StudentMarkId(String studentId, String examId) {
        this.studentId = studentId;
        this.examId = examId;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getExamId() {
        return examId;
    }

    public void setExamId(String examId) {
        this.examId = examId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (!(o instanceof StudentMarkId)) {
            return false;
        }

        StudentMarkId that = (StudentMarkId) o;

        return Objects.equals(studentId, that.studentId)
                && Objects.equals(examId, that.examId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(studentId, examId);
    }
}