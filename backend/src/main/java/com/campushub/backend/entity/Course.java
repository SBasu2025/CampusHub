package com.campushub.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "COURSE")
public class Course {

    @Id
    @Column(name = "course_id", length = 20)
    private String courseId;

    @Column(name = "course_name", length = 60, nullable = false)
    private String courseName;

    @ManyToOne
    @JoinColumn(name = "dept_id", nullable = false)
    private Department department;

    public Course() {
    }

    public Course(
            String courseId,
            String courseName,
            Department department) {

        this.courseId = courseId;
        this.courseName = courseName;
        this.department = department;
    }

    public String getCourseId() {
        return courseId;
    }

    public void setCourseId(String courseId) {
        this.courseId = courseId;
    }

    public String getCourseName() {
        return courseName;
    }

    public void setCourseName(String courseName) {
        this.courseName = courseName;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }
}