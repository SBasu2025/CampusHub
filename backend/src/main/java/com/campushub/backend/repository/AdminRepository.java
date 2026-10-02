package com.campushub.backend.repository;

import com.campushub.backend.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminRepository extends JpaRepository<Admin, String> {

    // ----------------------------------------------------------
    // ACTIVE ADMINS
    // ----------------------------------------------------------

    long countByActiveTrue();

    // ----------------------------------------------------------
    // PHONE NUMBER
    // ----------------------------------------------------------

    /*
     * Checks whether this phone number is already assigned
     * to any admin.
     */
    boolean existsByPhoneNumber(
            String phoneNumber
    );

    /*
     * Used when updating an existing admin.
     *
     * The current admin's own ID is excluded from the check,
     * so an admin can keep their existing phone number.
     */
    boolean existsByPhoneNumberAndAdminIdNot(
            String phoneNumber,
            String adminId
    );
}