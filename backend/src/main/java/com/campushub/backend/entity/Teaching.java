package com.campushub.backend.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

@Entity
@Table(name = "TEACHING")
public class Teaching {

    @EmbeddedId
    private TeachingId id;

    @ManyToOne
    @MapsId("profId")
    @JoinColumn(name = "prof_id", nullable = false)
    private Professor professor;

    @ManyToOne
    @MapsId("subjectId")
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    public Teaching() {
    }

    public Teaching(TeachingId id, Professor professor, Subject subject) {
        this.id = id;
        this.professor = professor;
        this.subject = subject;
    }

    public TeachingId getId() {
        return id;
    }

    public void setId(TeachingId id) {
        this.id = id;
    }

    public Professor getProfessor() {
        return professor;
    }

    public void setProfessor(Professor professor) {
        this.professor = professor;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }
}