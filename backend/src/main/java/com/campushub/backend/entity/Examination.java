package com.campushub.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;

import java.sql.Types;

@Entity
@Table(name = "EXAMINATION")
public class Examination {

    @Id
    @Column(name = "exam_id")
    private String examId;

    @ManyToOne
    @JoinColumn(
            name = "subject_id",
            nullable = false
    )
    private Subject subject;

    @Column(
            name = "semester",
            nullable = false
    )
    private Integer semester;

    /**
     * Section assigned by the administrator for this
     * particular examination.
     *
     * Example:
     * A
     * B
     * CSE-A
     *
     * This is the authoritative section used by the
     * professor marks workflow.
     */
    @Column(
            name = "section",
            nullable = false,
            length = 10
    )
    private String section;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(Types.VARCHAR)
    @Column(
            name = "exam_type",
            nullable = false,
            length = 10
    )
    private ExamType examType;

    @Column(
            name = "internal_number"
    )
    private Integer internalNumber;

    @Column(
            name = "max_marks",
            nullable = false
    )
    private Integer maxMarks;

    @ManyToOne
    @JoinColumn(
            name = "prof_id",
            nullable = false
    )
    private Professor professor;

    // =========================================================
    // CONSTRUCTORS
    // =========================================================

    public Examination() {
    }

    public Examination(
            String examId,
            Subject subject,
            Integer semester,
            String section,
            ExamType examType,
            Integer internalNumber,
            Integer maxMarks,
            Professor professor) {

        this.examId = examId;
        this.subject = subject;
        this.semester = semester;
        this.section = section;
        this.examType = examType;
        this.internalNumber = internalNumber;
        this.maxMarks = maxMarks;
        this.professor = professor;
    }

    // =========================================================
    // GETTERS / SETTERS
    // =========================================================

    public String getExamId() {
        return examId;
    }

    public void setExamId(
            String examId) {

        this.examId = examId;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(
            Subject subject) {

        this.subject = subject;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(
            Integer semester) {

        this.semester = semester;
    }

    public String getSection() {
        return section;
    }

    public void setSection(
            String section) {

        this.section = section;
    }

    public ExamType getExamType() {
        return examType;
    }

    public void setExamType(
            ExamType examType) {

        this.examType = examType;
    }

    public Integer getInternalNumber() {
        return internalNumber;
    }

    public void setInternalNumber(
            Integer internalNumber) {

        this.internalNumber = internalNumber;
    }

    public Integer getMaxMarks() {
        return maxMarks;
    }

    public void setMaxMarks(
            Integer maxMarks) {

        this.maxMarks = maxMarks;
    }

    public Professor getProfessor() {
        return professor;
    }

    public void setProfessor(
            Professor professor) {

        this.professor = professor;
    }
}