package com.campushub.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "STUDENT_MARK")
public class StudentMark {

    @EmbeddedId
    private StudentMarkId id;

    @ManyToOne
    @MapsId("studentId")
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne
    @MapsId("examId")
    @JoinColumn(name = "exam_id", nullable = false)
    private Examination examination;

    @Column(name = "marks_obtained", nullable = false, precision = 5, scale = 2)
    private BigDecimal marksObtained;

    public StudentMark() {
    }

    public StudentMark(
            StudentMarkId id,
            Student student,
            Examination examination,
            BigDecimal marksObtained) {

        this.id = id;
        this.student = student;
        this.examination = examination;
        this.marksObtained = marksObtained;
    }

    public StudentMarkId getId() {
        return id;
    }

    public void setId(StudentMarkId id) {
        this.id = id;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public Examination getExamination() {
        return examination;
    }

    public void setExamination(Examination examination) {
        this.examination = examination;
    }

    public BigDecimal getMarksObtained() {
        return marksObtained;
    }

    public void setMarksObtained(BigDecimal marksObtained) {
        this.marksObtained = marksObtained;
    }
}