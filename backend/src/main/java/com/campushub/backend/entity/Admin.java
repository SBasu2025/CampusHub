package com.campushub.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "ADMIN")
public class Admin {

    @Id
    @Column(name = "admin_id", length = 16)
    private String adminId;

    @Column(name = "admin_name", length = 40, nullable = false)
    private String adminName;

    /*
     * Phone number is intentionally nullable.
     *
     * Reason:
     * Existing CampusHub admins may not have a phone number yet.
     * The service layer requires a phone number when creating/updating
     * an account that is intended to use OTP login.
     */
    @Column(name = "phone_number", length = 15)
    private String phoneNumber;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    public Admin() {
    }

    public Admin(
            String adminId,
            String adminName) {

        this.adminId = adminId;
        this.adminName = adminName;
    }

    // -------------------------------------------------------------------------
    // ADMIN ID
    // -------------------------------------------------------------------------

    public String getAdminId() {
        return adminId;
    }

    public void setAdminId(String adminId) {
        this.adminId = adminId;
    }

    // -------------------------------------------------------------------------
    // ADMIN NAME
    // -------------------------------------------------------------------------

    public String getAdminName() {
        return adminName;
    }

    public void setAdminName(String adminName) {
        this.adminName = adminName;
    }

    // -------------------------------------------------------------------------
    // PHONE NUMBER
    // -------------------------------------------------------------------------

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {

        /*
         * Normalize accidental spaces around the phone number.
         *
         * Empty strings are converted to null so that an account
         * without a phone number remains a proper SQL NULL rather
         * than an empty string.
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
    // ACTIVE STATUS
    // -------------------------------------------------------------------------

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}