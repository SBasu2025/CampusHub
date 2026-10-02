package com.campushub.backend.entity;

import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class SelectsSubjectId implements Serializable {

    private String studentId;
    private String subjectId;

    public SelectsSubjectId() {
    }

    public SelectsSubjectId(String studentId, String subjectId) {
        this.studentId = studentId;
        this.subjectId = subjectId;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(String subjectId) {
        this.subjectId = subjectId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (!(o instanceof SelectsSubjectId)) {
            return false;
        }

        SelectsSubjectId that = (SelectsSubjectId) o;

        return Objects.equals(studentId, that.studentId)
                && Objects.equals(subjectId, that.subjectId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(studentId, subjectId);
    }
}