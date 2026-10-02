package com.campushub.backend.repository;

import com.campushub.backend.entity.Professor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProfessorRepository
        extends JpaRepository<Professor, String> {

    // ----------------------------------------------------------
    // DEPARTMENT
    // ----------------------------------------------------------

    List<Professor> findByDepartment_DeptId(
            String deptId
    );

    // ----------------------------------------------------------
    // PHONE NUMBER
    // ----------------------------------------------------------

    /*
     * Checks whether a phone number is already assigned
     * to any professor.
     *
     * This is used together with the StudentRepository and
     * AdminRepository checks so that one phone number cannot
     * be assigned to multiple CampusHub accounts.
     */
    boolean existsByPhoneNumber(
            String phoneNumber
    );

    /*
     * Same check for UPDATE operations.
     *
     * The current professor's own ID is excluded, so a professor
     * can keep their existing phone number while updating
     * their profile.
     */
    boolean existsByPhoneNumberAndProfIdNot(
            String phoneNumber,
            String profId
    );
}