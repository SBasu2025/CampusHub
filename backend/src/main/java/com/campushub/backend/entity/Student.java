package com.campushub.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "STUDENT")
public class Student {

    @Id
    @Column(name = "student_id", length = 14)
    private String studentId;

    @Column(name = "student_name", length = 70, nullable = false)
    private String studentName;

    /*
     * Kept nullable because existing students may currently
     * have no phone number.
     *
     * Global uniqueness across STUDENT + PROFESSOR + ADMIN
     * is enforced by the service layer.
     */
    @Column(name = "phone_number", length = 15)
    private String phoneNumber;

    @Column(name = "section")
    private String section;

    @Column(name = "semester")
    private Integer semester;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    public Student() {
    }

    public Student(
            String studentId,
            String studentName,
            String section,
            Integer semester,
            Course course) {

        this.studentId = studentId;
        this.studentName = studentName;
        this.section = section;
        this.semester = semester;
        this.course = course;
    }

    // -------------------------------------------------------------------------
    // STUDENT ID
    // -------------------------------------------------------------------------

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    // -------------------------------------------------------------------------
    // STUDENT NAME
    // -------------------------------------------------------------------------

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    // -------------------------------------------------------------------------
    // PHONE NUMBER
    // -------------------------------------------------------------------------

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {

        /*
         * Normalize accidental spaces around the phone number.
         *
         * Empty input becomes NULL instead of an empty string.
         */
        if (phoneNumber == null) {
            this.phoneNumber = null;
            return;
        }

        String normalized =
                phoneNumber.trim();

        this.phoneNumber =
                normalized.isEmpty()
                        ? null
                        : normalized;
    }

    // -------------------------------------------------------------------------
    // SECTION
    // -------------------------------------------------------------------------

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }

    // -------------------------------------------------------------------------
    // SEMESTER
    // -------------------------------------------------------------------------

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }

    // -------------------------------------------------------------------------
    // COURSE
    // -------------------------------------------------------------------------

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    // -------------------------------------------------------------------------
    // ACTIVE STATUS
    // -------------------------------------------------------------------------

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}