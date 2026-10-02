package com.campushub.backend.security;

import com.campushub.backend.entity.Admin;
import com.campushub.backend.entity.Professor;
import com.campushub.backend.entity.Student;
import com.campushub.backend.repository.AdminRepository;
import com.campushub.backend.repository.ProfessorRepository;
import com.campushub.backend.repository.StudentRepository;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * ID-only CampusHub authentication provider.
 *
 * The Spring Security username field contains the CampusHub ID.
 * Credentials are intentionally unused because this application does not
 * have a separate password credential.
 */
@Component
public class CampusHubAuthenticationProvider implements AuthenticationProvider {

    private final StudentRepository studentRepository;
    private final ProfessorRepository professorRepository;
    private final AdminRepository adminRepository;

    public CampusHubAuthenticationProvider(
            StudentRepository studentRepository,
            ProfessorRepository professorRepository,
            AdminRepository adminRepository) {
        this.studentRepository = studentRepository;
        this.professorRepository = professorRepository;
        this.adminRepository = adminRepository;
    }

    @Override
    public Authentication authenticate(Authentication authentication)
            throws AuthenticationException {

        String id = authentication.getName();

        if (id == null || id.isBlank() || !IdFormatValidator.isValid(id)) {
            throw new BadCredentialsException("Invalid CampusHub ID.");
        }

        if (IdFormatValidator.isStudentId(id)) {
            Student student = studentRepository.findById(id)
                    .orElseThrow(() -> new BadCredentialsException("Invalid CampusHub ID."));

            if (!student.isActive()) {
                throw new DisabledException("Student account is inactive.");
            }

            return authenticated(
                    new CampusHubPrincipal(
                            student.getStudentId(),
                            "STUDENT",
                            student.getStudentName()
                    ),
                    "ROLE_STUDENT"
            );
        }

        if (IdFormatValidator.isProfessorId(id)) {
            Professor professor = professorRepository.findById(id)
                    .orElseThrow(() -> new BadCredentialsException("Invalid CampusHub ID."));

            if (!professor.isActive()) {
                throw new DisabledException("Professor account is inactive.");
            }

            return authenticated(
                    new CampusHubPrincipal(
                            professor.getProfId(),
                            "PROFESSOR",
                            professor.getProfessorName()
                    ),
                    "ROLE_PROFESSOR"
            );
        }

        Admin admin = adminRepository.findById(id)
                .orElseThrow(() -> new BadCredentialsException("Invalid CampusHub ID."));

        if (!admin.isActive()) {
            throw new DisabledException("Admin account is inactive.");
        }

        return authenticated(
                new CampusHubPrincipal(
                        admin.getAdminId(),
                        "ADMIN",
                        admin.getAdminName()
                ),
                "ROLE_ADMIN"
        );
    }

    private Authentication authenticated(
            CampusHubPrincipal principal,
            String authority) {

        return UsernamePasswordAuthenticationToken.authenticated(
                principal,
                null,
                List.of(new SimpleGrantedAuthority(authority))
        );
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }
}