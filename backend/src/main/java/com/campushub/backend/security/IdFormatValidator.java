package com.campushub.backend.security;

import java.util.regex.Pattern;

/**
 * Validates the CampusHub role-specific ID format.
 *
 * Student:   STU_   + 3 lowercase + 3 uppercase + 3 digits + 1 special
 * Professor: PROF_  + 3 lowercase + 3 uppercase + 3 digits + 1 special
 * Admin:     ADMIN_ + 3 lowercase + 3 uppercase + 3 digits + 1 special
 */
public final class IdFormatValidator {

    private static final Pattern STUDENT_ID =
            Pattern.compile("^STU_[a-z]{3}[A-Z]{3}[0-9]{3}[^A-Za-z0-9]$");

    private static final Pattern PROFESSOR_ID =
            Pattern.compile("^PROF_[a-z]{3}[A-Z]{3}[0-9]{3}[^A-Za-z0-9]$");

    private static final Pattern ADMIN_ID =
            Pattern.compile("^ADMIN_[a-z]{3}[A-Z]{3}[0-9]{3}[^A-Za-z0-9]$");

    private IdFormatValidator() {
    }

    public static boolean isStudentId(String id) {
        return id != null && STUDENT_ID.matcher(id).matches();
    }

    public static boolean isProfessorId(String id) {
        return id != null && PROFESSOR_ID.matcher(id).matches();
    }

    public static boolean isAdminId(String id) {
        return id != null && ADMIN_ID.matcher(id).matches();
    }

    public static boolean isValid(String id) {
        return isStudentId(id)
                || isProfessorId(id)
                || isAdminId(id);
    }
}