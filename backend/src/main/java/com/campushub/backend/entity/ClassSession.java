package com.campushub.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinColumns;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalTime;

@Entity
@Table(name = "CLASS_SESSION")
public class ClassSession {

    @Id
    @Column(name = "session_id")
    private String sessionId;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne
    @JoinColumns({
        @JoinColumn(name = "prof_id", referencedColumnName = "prof_id", nullable = false),
        @JoinColumn(name = "subject_id", referencedColumnName = "subject_id", nullable = false)
    })
    private Teaching teaching;

    @Column(name = "semester")
    private Integer semester;

    @Column(name = "section")
    private String section;

    @Column(name = "day")
    private String day;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    public ClassSession() {
    }

    public ClassSession(String sessionId,
                        Course course,
                        Teaching teaching,
                        Integer semester,
                        String section,
                        String day,
                        LocalTime startTime,
                        LocalTime endTime) {
        this.sessionId = sessionId;
        this.course = course;
        this.teaching = teaching;
        this.semester = semester;
        this.section = section;
        this.day = day;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public Teaching getTeaching() {
        return teaching;
    }

    public void setTeaching(Teaching teaching) {
        this.teaching = teaching;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }

    public String getDay() {
        return day;
    }

    public void setDay(String day) {
        this.day = day;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }
}