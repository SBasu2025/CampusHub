package com.campushub.backend.dto;

public class AttendanceSummary {

    private String studentId;
    private String studentName;
    private String subjectId;
    private String subjectName;

    private long totalSessions;
    private long presentSessions;
    private long absentSessions;
    private double attendancePercentage;

    public AttendanceSummary() {
    }

    public AttendanceSummary(
            String studentId,
            String studentName,
            String subjectId,
            String subjectName,
            long totalSessions,
            long presentSessions,
            long absentSessions,
            double attendancePercentage) {

        this.studentId = studentId;
        this.studentName = studentName;
        this.subjectId = subjectId;
        this.subjectName = subjectName;
        this.totalSessions = totalSessions;
        this.presentSessions = presentSessions;
        this.absentSessions = absentSessions;
        this.attendancePercentage = attendancePercentage;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
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

    public long getTotalSessions() {
        return totalSessions;
    }

    public void setTotalSessions(long totalSessions) {
        this.totalSessions = totalSessions;
    }

    public long getPresentSessions() {
        return presentSessions;
    }

    public void setPresentSessions(long presentSessions) {
        this.presentSessions = presentSessions;
    }

    public long getAbsentSessions() {
        return absentSessions;
    }

    public void setAbsentSessions(long absentSessions) {
        this.absentSessions = absentSessions;
    }

    public double getAttendancePercentage() {
        return attendancePercentage;
    }

    public void setAttendancePercentage(double attendancePercentage) {
        this.attendancePercentage = attendancePercentage;
    }
}