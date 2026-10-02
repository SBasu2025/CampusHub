package com.campushub.backend.controller;

import com.campushub.backend.dto.AuthRequest;
import com.campushub.backend.dto.AuthResponse;
import com.campushub.backend.dto.OtpRequest;
import com.campushub.backend.dto.OtpRequestResponse;
import com.campushub.backend.entity.Admin;
import com.campushub.backend.entity.Professor;
import com.campushub.backend.entity.Student;
import com.campushub.backend.repository.AdminRepository;
import com.campushub.backend.repository.ProfessorRepository;
import com.campushub.backend.repository.StudentRepository;
import com.campushub.backend.security.CampusHubPrincipal;
import com.campushub.backend.security.IdFormatValidator;
import com.campushub.backend.service.OtpService;
import com.campushub.backend.service.UserSessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String SESSION_ATTRIBUTE = "CAMPUSHUB_SESSION_ID";

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final StudentRepository studentRepository;
    private final ProfessorRepository professorRepository;
    private final AdminRepository adminRepository;
    private final OtpService otpService;
    private final UserSessionService userSessionService;

    public AuthController(
            AuthenticationManager authenticationManager,
            SecurityContextRepository securityContextRepository,
            StudentRepository studentRepository,
            ProfessorRepository professorRepository,
            AdminRepository adminRepository,
            OtpService otpService,
            UserSessionService userSessionService) {

        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.studentRepository = studentRepository;
        this.professorRepository = professorRepository;
        this.adminRepository = adminRepository;
        this.otpService = otpService;
        this.userSessionService = userSessionService;
    }

    // =====================================================
    // STEP 1: REQUEST OTP
    // =====================================================

    @PostMapping("/otp/request")
    public ResponseEntity<OtpRequestResponse> requestOtp(
            @RequestBody OtpRequest request) {

        if (request == null
                || request.id() == null
                || request.id().isBlank()
                || request.phoneNumber() == null
                || request.phoneNumber().isBlank()) {

            return ResponseEntity.badRequest().build();
        }

        String id = request.id().trim();
        String phoneNumber = request.phoneNumber().trim();

        MatchedAccount account = matchAccount(id, phoneNumber);

        if (account == null) {
            /*
             * Use the same generic response whether:
             * - the ID does not exist
             * - the ID format is invalid
             * - the phone number does not match
             *
             * This avoids revealing which part of the credentials
             * was incorrect.
             */
            return ResponseEntity.status(401).build();
        }

        if (!account.active()) {
            return ResponseEntity.status(403).build();
        }

        otpService.generateAndSendOtp(
                account.id(),
                account.role(),
                phoneNumber
        );

        return ResponseEntity.ok(
                new OtpRequestResponse(
                        "A 6-digit code was sent to your phone.",
                        300L
                )
        );
    }

    // =====================================================
    // STEP 2: VERIFY OTP + LOG IN
    // =====================================================

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @RequestBody AuthRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        if (request == null
                || request.id() == null
                || request.id().isBlank()
                || request.phoneNumber() == null
                || request.phoneNumber().isBlank()
                || request.otp() == null
                || request.otp().isBlank()) {

            return ResponseEntity.badRequest().build();
        }

        String id = request.id().trim();
        String phoneNumber = request.phoneNumber().trim();

        MatchedAccount account = matchAccount(id, phoneNumber);

        if (account == null) {
            return ResponseEntity.status(401).build();
        }

        if (!account.active()) {
            return ResponseEntity.status(403).build();
        }

        try {
            otpService.verifyOtp(
                    account.id(),
                    request.otp().trim()
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).build();
        }

        Authentication authentication;

        try {
            /*
             * The OTP has already verified the user's ID + phone.
             * The existing CampusHubAuthenticationProvider is still
             * responsible for resolving the account and its role.
             */
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            id,
                            null
                    )
            );

        } catch (DisabledException e) {
            return ResponseEntity.status(403).build();

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).build();
        }

        /*
         * Store the authenticated principal in the same
         * SecurityContextRepository used by the existing application.
         */
        SecurityContext context =
                SecurityContextHolder.createEmptyContext();

        context.setAuthentication(authentication);

        SecurityContextHolder.setContext(context);

        securityContextRepository.saveContext(
                context,
                httpRequest,
                httpResponse
        );

        CampusHubPrincipal principal =
                (CampusHubPrincipal) authentication.getPrincipal();

        /*
         * Create a separate persistent CampusHub session record.
         * This records the login independently of Spring Security's
         * own HttpSession.
         */
        var session = userSessionService.startSession(
                principal.id(),
                principal.role(),
                phoneNumber
        );

        /*
         * Store our persistent session ID inside the HTTP session
         * so logout can find the correct USER_SESSION row later.
         */
        httpRequest.getSession(true)
                .setAttribute(
                        SESSION_ATTRIBUTE,
                        session.getSessionId()
                );

        return ResponseEntity.ok(
                new AuthResponse(
                        principal.id(),
                        principal.role(),
                        principal.displayName(),
                        "Login successful."
                )
        );
    }

    // =====================================================
    // CURRENT USER
    // =====================================================

    @GetMapping("/me")
    public ResponseEntity<?> currentUser(
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()) {

            return ResponseEntity.status(401).build();
        }

        CampusHubPrincipal principal =
                (CampusHubPrincipal) authentication.getPrincipal();

        return ResponseEntity.ok(
                Map.of(
                        "id", principal.id(),
                        "role", principal.role(),
                        "displayName", principal.displayName()
                )
        );
    }

    // =====================================================
    // LOGOUT
    // =====================================================

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            HttpServletRequest request,
            HttpServletResponse response) {

        /*
         * Find the current HTTP session without creating a new one.
         */
        var session = request.getSession(false);

        if (session != null) {

            Object sessionId =
                    session.getAttribute(SESSION_ATTRIBUTE);

            if (sessionId instanceof String sessionIdString) {

                /*
                 * Close the persistent CampusHub session by setting
                 * logout_time, but do not modify an already-closed
                 * session.
                 */
                userSessionService.endSession(sessionIdString);
            }
        }

        /*
         * Clear the Spring Security authentication.
         */
        SecurityContextHolder.clearContext();

        /*
         * Persist the empty SecurityContext so the authenticated
         * state is removed from the HTTP session.
         */
        securityContextRepository.saveContext(
                SecurityContextHolder.createEmptyContext(),
                request,
                response
        );

        /*
         * Finally invalidate the actual HTTP session.
         */
        if (session != null) {
            session.invalidate();
        }

        return ResponseEntity.noContent().build();
    }

    // =====================================================
    // ID + PHONE MATCHING
    // =====================================================

    private record MatchedAccount(
            String id,
            String role,
            boolean active) {
    }

    private MatchedAccount matchAccount(
            String id,
            String phoneNumber) {

        /*
         * Reject IDs that do not follow the CampusHub ID format.
         */
        if (!IdFormatValidator.isValid(id)) {
            return null;
        }

        // -----------------------------------------------------
        // STUDENT
        // -----------------------------------------------------

        if (IdFormatValidator.isStudentId(id)) {

            Student student =
                    studentRepository
                            .findById(id)
                            .orElse(null);

            if (student == null
                    || !phoneNumber.equals(
                            student.getPhoneNumber())) {

                return null;
            }

            return new MatchedAccount(
                    student.getStudentId(),
                    "STUDENT",
                    student.isActive()
            );
        }

        // -----------------------------------------------------
        // PROFESSOR
        // -----------------------------------------------------

        if (IdFormatValidator.isProfessorId(id)) {

            Professor professor =
                    professorRepository
                            .findById(id)
                            .orElse(null);

            if (professor == null
                    || !phoneNumber.equals(
                            professor.getPhoneNumber())) {

                return null;
            }

            return new MatchedAccount(
                    professor.getProfId(),
                    "PROFESSOR",
                    professor.isActive()
            );
        }

        // -----------------------------------------------------
        // ADMIN
        // -----------------------------------------------------

        Admin admin =
                adminRepository
                        .findById(id)
                        .orElse(null);

        if (admin == null
                || !phoneNumber.equals(
                        admin.getPhoneNumber())) {

            return null;
        }

        return new MatchedAccount(
                admin.getAdminId(),
                "ADMIN",
                admin.isActive()
        );
    }
}