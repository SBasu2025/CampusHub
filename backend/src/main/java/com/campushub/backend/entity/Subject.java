package com.campushub.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "SUBJECT")
public class Subject {

    @Id
    @Column(name = "subject_id")
    private String subjectId;

    @Column(name = "subject_name")
    private String subjectName;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    /*
     * Academic semester in which this subject is offered.
     *
     * Example:
     *   DBMS -> Semester 7
     *   Data Structures -> Semester 3
     */
    @Column(name = "semester", nullable = false)
    private Integer semester;

    public Subject() {
    }

    public Subject(
            String subjectId,
            String subjectName,
            Course course,
            Integer semester) {

        this.subjectId = subjectId;
        this.subjectName = subjectName;
        this.course = course;
        this.semester = semester;
    }

    public String getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(String subjectId) {
        this.subjectId = subjectId;
    }

    public String getSubjectName() {
        return subjectName;
    }

    public void setSubjectName(String subjectName) {
        this.subjectName = subjectName;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }
}