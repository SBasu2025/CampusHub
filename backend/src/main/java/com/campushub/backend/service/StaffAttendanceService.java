package com.campushub.backend.service;

import com.campushub.backend.entity.Admin;
import com.campushub.backend.entity.Professor;
import com.campushub.backend.entity.StaffAttendance;
import com.campushub.backend.repository.AdminRepository;
import com.campushub.backend.repository.ProfessorRepository;
import com.campushub.backend.repository.StaffAttendanceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class StaffAttendanceService {

    private static final String CAMPUS = "KOL";

    private static final DateTimeFormatter ID_DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyMMdd");

    private final StaffAttendanceRepository staffAttendanceRepository;
    private final ProfessorRepository professorRepository;
    private final AdminRepository adminRepository;

    public StaffAttendanceService(
            StaffAttendanceRepository staffAttendanceRepository,
            ProfessorRepository professorRepository,
            AdminRepository adminRepository) {

        this.staffAttendanceRepository = staffAttendanceRepository;
        this.professorRepository = professorRepository;
        this.adminRepository = adminRepository;
    }

    // -------------------------------------------------------------------------
    // BASIC RETRIEVAL
    // -------------------------------------------------------------------------

    public List<StaffAttendance> getAllStaffAttendances() {
        return staffAttendanceRepository.findAll();
    }

    public Optional<StaffAttendance> getStaffAttendanceById(
            String attendanceId) {

        if (attendanceId == null || attendanceId.isBlank()) {
            return Optional.empty();
        }

        return staffAttendanceRepository.findById(attendanceId);
    }

    // -------------------------------------------------------------------------
    // PROFESSOR-WISE RETRIEVAL / REPORT
    // -------------------------------------------------------------------------

    public List<StaffAttendance> getStaffAttendancesByProfessor(
            String profId) {

        requireProfessor(profId);

        return staffAttendanceRepository
                .findByProfessor_ProfIdOrderByDayDesc(profId);
    }

    public List<StaffAttendance> getProfessorAttendanceReport(
            String profId) {

        return getStaffAttendancesByProfessor(profId);
    }

    public List<StaffAttendance> getProfessorAttendanceReportByDate(
            String profId,
            LocalDate day) {

        requireProfessor(profId);
        requireDay(day);

        return staffAttendanceRepository
                .findByProfessor_ProfIdAndDayOrderByAttendanceIdAsc(
                        profId,
                        day
                );
    }

    // -------------------------------------------------------------------------
    // ADMIN-WISE RETRIEVAL / REPORT
    // -------------------------------------------------------------------------

    public List<StaffAttendance> getStaffAttendancesByAdmin(
            String adminId) {

        requireAdmin(adminId);

        return staffAttendanceRepository
                .findByAdmin_AdminIdOrderByDayDesc(adminId);
    }

    public List<StaffAttendance> getAdminAttendanceReport(
            String adminId) {

        return getStaffAttendancesByAdmin(adminId);
    }

    public List<StaffAttendance> getAdminAttendanceReportByDate(
            String adminId,
            LocalDate day) {

        requireAdmin(adminId);
        requireDay(day);

        return staffAttendanceRepository
                .findByAdmin_AdminIdAndDayOrderByAttendanceIdAsc(
                        adminId,
                        day
                );
    }

    // -------------------------------------------------------------------------
    // DATE-WISE RETRIEVAL / REPORT
    // -------------------------------------------------------------------------

    public List<StaffAttendance> getStaffAttendancesByDay(
            LocalDate day) {

        requireDay(day);

        return staffAttendanceRepository
                .findByDayOrderByAttendanceIdAsc(day);
    }

    public List<StaffAttendance> getDateAttendanceReport(
            LocalDate day) {

        return getStaffAttendancesByDay(day);
    }

    // -------------------------------------------------------------------------
    // CREATE
    // -------------------------------------------------------------------------

    @Transactional
    public StaffAttendance saveStaffAttendance(
            StaffAttendance staffAttendance) {

        if (staffAttendance == null) {
            throw new IllegalArgumentException(
                    "Staff attendance data is required."
            );
        }

        Professor professor =
                staffAttendance.getProfessor();

        Admin admin =
                staffAttendance.getAdmin();

        /*
         * Exactly one owner must be present.
         */
        if (professor != null && admin != null) {
            throw new IllegalArgumentException(
                    "Staff attendance cannot have both professor and admin."
            );
        }

        if (professor == null && admin == null) {
            throw new IllegalArgumentException(
                    "Staff attendance must have either a professor or an admin."
            );
        }

        LocalDate day =
                staffAttendance.getDay();

        requireDay(day);

        String status =
                validateStatus(
                        staffAttendance.getStatus()
                );

        String staffId;

        if (professor != null) {

            String profId =
                    professor.getProfId();

            if (profId == null || profId.isBlank()) {
                throw new IllegalArgumentException(
                        "Professor ID is required."
                );
            }

            Professor existingProfessor =
                    professorRepository.findById(profId)
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "Professor not found: "
                                                    + profId
                                    )
                            );

            staffAttendance.setProfessor(
                    existingProfessor
            );

            staffAttendance.setAdmin(null);

            staffId = profId;

        } else {

            String adminId =
                    admin.getAdminId();

            if (adminId == null || adminId.isBlank()) {
                throw new IllegalArgumentException(
                        "Admin ID is required."
                );
            }

            Admin existingAdmin =
                    adminRepository.findById(adminId)
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "Admin not found: "
                                                    + adminId
                                    )
                            );

            staffAttendance.setAdmin(
                    existingAdmin
            );

            staffAttendance.setProfessor(null);

            staffId = adminId;
        }

        /*
         * Generate:
         *
         * <PROF_ID or ADMIN_ID>/<CAMPUS>/<YYMMDD>
         */
        String attendanceId =
                generateAttendanceId(
                        staffId,
                        day
                );

        if (staffAttendanceRepository
                .existsById(attendanceId)) {

            throw new IllegalArgumentException(
                    "Staff attendance already exists for "
                            + staffId
                            + " on "
                            + day
            );
        }

        staffAttendance.setAttendanceId(
                attendanceId
        );

        staffAttendance.setStatus(status);

        return staffAttendanceRepository.save(
                staffAttendance
        );
    }

    // -------------------------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------------------------

    @Transactional
    public StaffAttendance updateStaffAttendance(
            String attendanceId,
            String status) {

        if (attendanceId == null
                || attendanceId.isBlank()) {

            throw new IllegalArgumentException(
                    "Attendance ID is required."
            );
        }

        String validatedStatus =
                validateStatus(status);

        StaffAttendance existing =
                staffAttendanceRepository.findById(
                        attendanceId
                ).orElseThrow(() ->
                        new IllegalArgumentException(
                                "Staff attendance not found: "
                                        + attendanceId
                        )
                );

        /*
         * The attendance ID contains the staff ID and date.
         * Therefore, editing the attendance record does not change
         * its identity. The status is the editable attendance value.
         */
        existing.setStatus(
                validatedStatus
        );

        return staffAttendanceRepository.save(
                existing
        );
    }

    // -------------------------------------------------------------------------
    // DELETE
    // -------------------------------------------------------------------------

    @Transactional
    public boolean deleteStaffAttendanceById(
            String attendanceId) {

        if (attendanceId == null
                || attendanceId.isBlank()) {

            throw new IllegalArgumentException(
                    "Attendance ID is required."
            );
        }

        if (!staffAttendanceRepository
                .existsById(attendanceId)) {

            return false;
        }

        staffAttendanceRepository.deleteById(
                attendanceId
        );

        return true;
    }

    // -------------------------------------------------------------------------
    // VALIDATION / HELPERS
    // -------------------------------------------------------------------------

    private Professor requireProfessor(
            String profId) {

        if (profId == null || profId.isBlank()) {
            throw new IllegalArgumentException(
                    "Professor ID is required."
            );
        }

        return professorRepository.findById(profId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Professor not found: "
                                        + profId
                        )
                );
    }

    private Admin requireAdmin(
            String adminId) {

        if (adminId == null || adminId.isBlank()) {
            throw new IllegalArgumentException(
                    "Admin ID is required."
            );
        }

        return adminRepository.findById(adminId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Admin not found: "
                                        + adminId
                        )
                );
    }

    private void requireDay(
            LocalDate day) {

        if (day == null) {
            throw new IllegalArgumentException(
                    "Attendance day is required."
            );
        }
    }

    private String validateStatus(
            String status) {

        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException(
                    "Attendance status is required."
            );
        }

        String normalizedStatus =
                status.trim();

        if (!normalizedStatus.equalsIgnoreCase("Present")
                && !normalizedStatus.equalsIgnoreCase("Absent")) {

            throw new IllegalArgumentException(
                    "Attendance status must be Present or Absent."
            );
        }

        /*
         * Store exactly the same capitalization as the database ENUM.
         */
        if (normalizedStatus.equalsIgnoreCase("Present")) {
            return "Present";
        }

        return "Absent";
    }

    private String generateAttendanceId(
            String staffId,
            LocalDate day) {

        return staffId
                + "/"
                + CAMPUS
                + "/"
                + day.format(ID_DATE_FORMAT);
    }
}