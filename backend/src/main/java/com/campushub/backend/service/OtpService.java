package com.campushub.backend.service;

import com.campushub.backend.entity.LoginOtp;
import com.campushub.backend.repository.LoginOtpRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class OtpService {

    private static final Duration OTP_VALIDITY =
            Duration.ofMinutes(5);

    private static final int MAX_VERIFY_ATTEMPTS = 5;

    private final LoginOtpRepository loginOtpRepository;
    private final PasswordEncoder passwordEncoder;
    private final SmsSender smsSender;

    private final SecureRandom random = new SecureRandom();

    /*
     * =========================================================
     * PUBLIC DEMO OTP CONFIGURATION
     * =========================================================
     *
     * These values come from application.properties.
     *
     * The fixed demo OTP is NOT accepted globally.
     * It is used only when:
     *
     *   1. Demo mode is enabled
     *   2. The role matches
     *   3. The ID matches
     *   4. The phone number matches
     *
     * Normal accounts continue to receive a random OTP.
     */
    @Value("${campushub.demo.enabled:false}")
    private boolean demoModeEnabled;

    @Value("${campushub.demo.otp:123456}")
    private String demoOtp;

    @Value("${campushub.demo.admin.id:}")
    private String demoAdminId;

    @Value("${campushub.demo.admin.phone:}")
    private String demoAdminPhone;

    @Value("${campushub.demo.professor.id:}")
    private String demoProfessorId;

    @Value("${campushub.demo.professor.phone:}")
    private String demoProfessorPhone;

    @Value("${campushub.demo.student.id:}")
    private String demoStudentId;

    @Value("${campushub.demo.student.phone:}")
    private String demoStudentPhone;

    public OtpService(
            LoginOtpRepository loginOtpRepository,
            PasswordEncoder passwordEncoder,
            SmsSender smsSender) {

        this.loginOtpRepository = loginOtpRepository;
        this.passwordEncoder = passwordEncoder;
        this.smsSender = smsSender;
    }

    // =========================================================
    // GENERATE + SEND OTP
    // =========================================================

    public void generateAndSendOtp(
            String targetId,
            String role,
            String phoneNumber) {

        /*
         * For the three configured public demo accounts,
         * use the fixed demo OTP.
         *
         * For every other account, generate a secure random
         * six-digit OTP.
         */
        String code;

        if (isConfiguredDemoAccount(
                targetId,
                role,
                phoneNumber)) {

            code = demoOtp;

        } else {

            code = generateSixDigitCode();
        }

        LocalDateTime generatedAt = LocalDateTime.now();

        LoginOtp otp = new LoginOtp();

        otp.setTargetId(targetId);
        otp.setRole(role);
        otp.setPhoneNumber(phoneNumber);

        /*
         * Store only the BCrypt hash.
         *
         * Even the fixed demo OTP is NOT stored as plaintext
         * in LOGIN_OTP.
         */
        otp.setOtpHash(
                passwordEncoder.encode(code)
        );

        otp.setGeneratedAt(generatedAt);

        otp.setExpiresAt(
                generatedAt.plus(OTP_VALIDITY)
        );

        otp.setConsumed(false);
        otp.setAttemptCount(0);

        loginOtpRepository.save(otp);

        /*
         * The current development sender prints the OTP to the
         * Spring Boot console.
         *
         * Later, if we add real SMS, this same service can use
         * another SmsSender implementation without changing the
         * verification logic.
         */
        smsSender.sendOtp(
                phoneNumber,
                code
        );
    }

    // =========================================================
    // VERIFY OTP
    // =========================================================

    public void verifyOtp(
            String targetId,
            String suppliedCode) {

        if (suppliedCode == null || suppliedCode.isBlank()) {
            throw new IllegalArgumentException(
                    "OTP is required."
            );
        }

        LoginOtp otp = loginOtpRepository
                .findTopByTargetIdOrderByGeneratedAtDesc(targetId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "No OTP was requested for this ID."
                        )
                );

        // -----------------------------------------------------
        // ALREADY CONSUMED
        // -----------------------------------------------------

        if (otp.isConsumed()) {
            throw new IllegalArgumentException(
                    "This code has already been used. Request a new one."
            );
        }

        // -----------------------------------------------------
        // EXPIRED
        // -----------------------------------------------------

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException(
                    "This code has expired. Request a new one."
            );
        }

        // -----------------------------------------------------
        // MAXIMUM ATTEMPTS
        // -----------------------------------------------------

        if (otp.getAttemptCount() >= MAX_VERIFY_ATTEMPTS) {
            throw new IllegalArgumentException(
                    "Too many incorrect attempts. Request a new code."
            );
        }

        // -----------------------------------------------------
        // VERIFY HASH
        // -----------------------------------------------------

        if (!passwordEncoder.matches(
                suppliedCode.trim(),
                otp.getOtpHash())) {

            otp.setAttemptCount(
                    otp.getAttemptCount() + 1
            );

            loginOtpRepository.save(otp);

            throw new IllegalArgumentException(
                    "Incorrect code."
            );
        }

        // -----------------------------------------------------
        // SUCCESS
        // -----------------------------------------------------

        otp.setConsumed(true);

        loginOtpRepository.save(otp);
    }

    // =========================================================
    // CHECK PUBLIC DEMO ACCOUNT
    // =========================================================

    private boolean isConfiguredDemoAccount(
            String targetId,
            String role,
            String phoneNumber) {

        if (!demoModeEnabled) {
            return false;
        }

        if (targetId == null
                || role == null
                || phoneNumber == null) {

            return false;
        }

        String normalizedRole =
                role.trim().toUpperCase(Locale.ROOT);

        String normalizedId =
                targetId.trim();

        String normalizedPhone =
                phoneNumber.trim();

        return switch (normalizedRole) {

            case "ADMIN" ->
                    demoAdminId.equals(normalizedId)
                            && demoAdminPhone.equals(normalizedPhone);

            case "PROFESSOR" ->
                    demoProfessorId.equals(normalizedId)
                            && demoProfessorPhone.equals(normalizedPhone);

            case "STUDENT" ->
                    demoStudentId.equals(normalizedId)
                            && demoStudentPhone.equals(normalizedPhone);

            default ->
                    false;
        };
    }

    // =========================================================
    // GENERATE SIX-DIGIT OTP
    // =========================================================

    private String generateSixDigitCode() {

        int number =
                random.nextInt(1_000_000);

        return String.format(
                "%06d",
                number
        );
    }
}