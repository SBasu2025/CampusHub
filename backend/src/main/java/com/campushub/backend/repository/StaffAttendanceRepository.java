package com.campushub.backend.repository;

import com.campushub.backend.entity.StaffAttendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface StaffAttendanceRepository
        extends JpaRepository<StaffAttendance, String> {

    // Professor-wise staff attendance
    List<StaffAttendance> findByProfessor_ProfIdOrderByDayDesc(
            String profId
    );

    // Admin-wise staff attendance
    List<StaffAttendance> findByAdmin_AdminIdOrderByDayDesc(
            String adminId
    );

    // Date-wise staff attendance
    List<StaffAttendance> findByDayOrderByAttendanceIdAsc(
            LocalDate day
    );

    // Professor-wise report for a specific date
    List<StaffAttendance> findByProfessor_ProfIdAndDayOrderByAttendanceIdAsc(
            String profId,
            LocalDate day
    );

    // Admin-wise report for a specific date
    List<StaffAttendance> findByAdmin_AdminIdAndDayOrderByAttendanceIdAsc(
            String adminId,
            LocalDate day
    );
}