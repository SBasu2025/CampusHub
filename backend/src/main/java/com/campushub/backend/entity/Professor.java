package com.campushub.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "PROFESSOR")
public class Professor {

    @Id
    @Column(name = "prof_id", length = 15)
    private String profId;

    @Column(name = "professor_name", length = 70, nullable = false)
    private String professorName;

    /*
     * Kept nullable because existing professors may currently
     * have no phone number.
     *
     * Global uniqueness is enforced by the service layer across
     * ADMIN + PROFESSOR + STUDENT.
     */
    @Column(name = "phone_number", length = 15)
    private String phoneNumber;

    @ManyToOne
    @JoinColumn(name = "dept_id", nullable = false)
    private Department department;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    public Professor() {
    }

    public Professor(
            String profId,
            String professorName,
            Department department) {

        this.profId = profId;
        this.professorName = professorName;
        this.department = department;
    }

    // -------------------------------------------------------------------------
    // PROFESSOR ID
    // -------------------------------------------------------------------------

    public String getProfId() {
        return profId;
    }

    public void setProfId(String profId) {
        this.profId = profId;
    }

    // -------------------------------------------------------------------------
    // PROFESSOR NAME
    // -------------------------------------------------------------------------

    public String getProfessorName() {
        return professorName;
    }

    public void setProfessorName(String professorName) {
        this.professorName = professorName;
    }

    // -------------------------------------------------------------------------
    // PHONE NUMBER
    // -------------------------------------------------------------------------

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {

        /*
         * Normalize accidental spaces around the number.
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
    // DEPARTMENT
    // -------------------------------------------------------------------------

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
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