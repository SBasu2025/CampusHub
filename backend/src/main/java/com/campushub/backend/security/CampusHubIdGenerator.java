package com.campushub.backend.security;

import java.security.SecureRandom;

import org.springframework.stereotype.Component;

@Component
public class CampusHubIdGenerator {

    private static final String LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
    private static final String UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL = "@#$%!&*?";

    private final SecureRandom random = new SecureRandom();

    public String generateStudentId() {
        return generateId("STU_");
    }

    public String generateProfessorId() {
        return generateId("PROF_");
    }

    public String generateAdminId() {
        return generateId("ADMIN_");
    }

    private String generateId(String prefix) {

        StringBuilder id = new StringBuilder(prefix);

        // 3 lowercase letters
        for (int i = 0; i < 3; i++) {
            id.append(randomCharacter(LOWERCASE));
        }

        // 3 uppercase letters
        for (int i = 0; i < 3; i++) {
            id.append(randomCharacter(UPPERCASE));
        }

        // 3 digits
        for (int i = 0; i < 3; i++) {
            id.append(randomCharacter(DIGITS));
        }

        // 1 special symbol
        id.append(randomCharacter(SPECIAL));

        return id.toString();
    }

    private char randomCharacter(String source) {
        return source.charAt(
                random.nextInt(source.length())
        );
    }
}