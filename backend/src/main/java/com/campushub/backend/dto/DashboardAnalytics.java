package com.campushub.backend.dto;

public record DashboardAnalytics(
        long totalStudents,
        long activeStudents,
        long totalProfessors,
        long activeProfessors,
        long totalCourses,
        long totalSubjects,
        long totalDepartments,
        long totalAdmins,
        long activeAdmins,
        long totalAttendanceRecords,
        long presentAttendanceRecords,
        long absentAttendanceRecords,
        double attendancePercentage
) {
}