package com.campushub.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "STAFF_ATTENDANCE")
public class StaffAttendance {

    @Id
    @Column(name = "attendance_id")
    private String attendanceId;

    @ManyToOne
    @JoinColumn(name = "prof_id")
    private Professor professor;

    @ManyToOne
    @JoinColumn(name = "admin_id")
    private Admin admin;

    @Column(name = "day")
    private LocalDate day;

    @Column(name = "status")
    private String status;

    public StaffAttendance() {
    }

    public StaffAttendance(String attendanceId,
                           Professor professor,
                           Admin admin,
                           LocalDate day,
                           String status) {
        this.attendanceId = attendanceId;
        this.professor = professor;
        this.admin = admin;
        this.day = day;
        this.status = status;
    }

    public String getAttendanceId() {
        return attendanceId;
    }

    public void setAttendanceId(String attendanceId) {
        this.attendanceId = attendanceId;
    }

    public Professor getProfessor() {
        return professor;
    }

    public void setProfessor(Professor professor) {
        this.professor = professor;
    }

    public Admin getAdmin() {
        return admin;
    }

    public void setAdmin(Admin admin) {
        this.admin = admin;
    }

    public LocalDate getDay() {
        return day;
    }

    public void setDay(LocalDate day) {
        this.day = day;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}