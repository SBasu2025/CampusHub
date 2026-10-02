package com.campushub.backend.security;

import com.campushub.backend.entity.Examination;
import com.campushub.backend.repository.ExaminationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class CampusHubAuthorizationService {

    /*
     * The Special Admin ID is supplied through configuration
     * rather than being hard-coded in the public source code.
     *
     * Local environment:
     *   CAMPUSHUB_DEMO_SPECIAL_ADMIN_ID
     *
     * Production / Render:
     *   CAMPUSHUB_DEMO_SPECIAL_ADMIN_ID
     *
     * This keeps the privileged account identifier out of
     * application source code.
     */
    @Value("${campushub.demo.special-admin.id:}")
    private String specialAdminId;

    private final ExaminationRepository examinationRepository;

    public CampusHubAuthorizationService(
            ExaminationRepository examinationRepository) {

        this.examinationRepository = examinationRepository;
    }

    /**
     * Allows:
     * - ADMIN to access any student resource.
     * - STUDENT to access only their own student resource.
     *
     * IMPORTANT:
     * Every ADMIN remains authorized here.
     * This method is NOT restricted to the Special Admin.
     */
    public void requireStudentOwnerOrAdmin(
            String studentId,
            Authentication authentication) {

        CampusHubPrincipal principal =
                getPrincipal(authentication);

        if ("ADMIN".equals(principal.role())) {
            return;
        }

        if (!"STUDENT".equals(principal.role())
                || !principal.id().equals(studentId)) {

            throw forbidden();
        }
    }

    /**
     * Allows:
     * - ADMIN to access any professor resource.
     * - PROFESSOR to access only their own professor resource.
     *
     * IMPORTANT:
     * Every ADMIN remains authorized here.
     * This method is NOT restricted to the Special Admin.
     */
    public void requireProfessorOwnerOrAdmin(
            String professorId,
            Authentication authentication) {

        CampusHubPrincipal principal =
                getPrincipal(authentication);

        if ("ADMIN".equals(principal.role())) {
            return;
        }

        if (!"PROFESSOR".equals(principal.role())
                || !principal.id().equals(professorId)) {

            throw forbidden();
        }
    }

    /**
     * Allows:
     * - ADMIN to access a professor resource.
     * - PROFESSOR only when both supplied IDs belong to
     *   the authenticated professor.
     */
    public void requireProfessorOwnerOrAdmin(
            String professorId,
            String authenticatedProfessorId,
            Authentication authentication) {

        CampusHubPrincipal principal =
                getPrincipal(authentication);

        if ("ADMIN".equals(principal.role())) {
            return;
        }

        if (!"PROFESSOR".equals(principal.role())
                || !principal.id().equals(professorId)
                || !principal.id().equals(authenticatedProfessorId)) {

            throw forbidden();
        }
    }

    /**
     * Allows:
     * - ADMIN to access any examination.
     * - PROFESSOR only if that professor owns the examination.
     */
    public void requireExamProfessorOrAdmin(
            String examId,
            Authentication authentication) {

        CampusHubPrincipal principal =
                getPrincipal(authentication);

        if ("ADMIN".equals(principal.role())) {
            return;
        }

        if (!"PROFESSOR".equals(principal.role())) {
            throw forbidden();
        }

        Examination examination =
                examinationRepository.findById(examId)
                        .orElseThrow(this::forbidden);

        if (examination.getProfessor() == null
                || !principal.id().equals(
                examination.getProfessor().getProfId())) {

            throw forbidden();
        }
    }

    /**
     * Allows ONLY the configured Special Admin to perform
     * Special-Admin-only operations.
     */
    public void requireSpecialAdmin(
            Authentication authentication) {

        CampusHubPrincipal principal =
                getPrincipal(authentication);

        if (!"ADMIN".equals(principal.role())
                || specialAdminId == null
                || specialAdminId.isBlank()
                || !specialAdminId.equals(principal.id())) {

            throw forbidden();
        }
    }

    /**
     * Returns true when the authenticated account is the
     * configured Special Admin.
     */
    public boolean isSpecialAdmin(
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal()
                instanceof CampusHubPrincipal principal)) {

            return false;
        }

        return "ADMIN".equals(principal.role())
                && specialAdminId != null
                && !specialAdminId.isBlank()
                && specialAdminId.equals(principal.id());
    }

    /**
     * Gets the authenticated CampusHub principal.
     */
    private CampusHubPrincipal getPrincipal(
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal()
                instanceof CampusHubPrincipal principal)) {

            throw forbidden();
        }

        return principal;
    }

    private ResponseStatusException forbidden() {

        return new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You are not authorized to access this resource."
        );
    }
}