package com.campushub.backend.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

@Entity
@Table(name = "SELECTS_SUBJECT")
public class SelectsSubject {

    @EmbeddedId
    private SelectsSubjectId id;

    @ManyToOne
    @MapsId("studentId")
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne
    @MapsId("subjectId")
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    public SelectsSubject() {
    }

    public SelectsSubject(SelectsSubjectId id,
                          Student student,
                          Subject subject) {
        this.id = id;
        this.student = student;
        this.subject = subject;
    }

    public SelectsSubjectId getId() {
        return id;
    }

    public void setId(SelectsSubjectId id) {
        this.id = id;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }
}