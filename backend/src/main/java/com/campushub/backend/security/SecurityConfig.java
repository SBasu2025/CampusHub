package com.campushub.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    // =========================================================
    // SECURITY CONTEXT REPOSITORY
    // =========================================================

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    // =========================================================
    // PASSWORD ENCODER
    // =========================================================
    //
    // Used by OtpService to BCrypt-hash the generated OTP
    // before storing it in LOGIN_OTP.
    //
    // IMPORTANT:
    // This is NOT a password field for Student/Professor/Admin.
    // It is simply the PasswordEncoder implementation used for
    // secure OTP hashing and verification.
    // =========================================================

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // =========================================================
    // AUTHENTICATION MANAGER
    // =========================================================

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationProvider authenticationProvider) {

        return new ProviderManager(List.of(authenticationProvider));
    }

    // =========================================================
    // CORS CONFIGURATION
    // =========================================================
    //
    // Frontend:
    // http://localhost:5173
    //
    // Backend:
    // http://localhost:8080
    //
    // Authentication uses JSESSIONID cookies, so credentials
    // must be allowed.
    // =========================================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(
                List.of("http://localhost:5173")
        );

        config.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        config.setAllowedHeaders(
                List.of("*")
        );

        // Required because CampusHub authentication uses
        // HttpSession/JSESSIONID cookies.
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                config
        );

        return source;
    }

    // =========================================================
    // SECURITY FILTER CHAIN
    // =========================================================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            SecurityContextRepository securityContextRepository)
            throws Exception {

        http
                // =====================================================
                // CORS
                // =====================================================

                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource()
                        )
                )

                // =====================================================
                // CSRF
                // =====================================================

                .csrf(csrf -> csrf.disable())

                // =====================================================
                // DISABLE FORM LOGIN
                // =====================================================

                .formLogin(formLogin -> formLogin.disable())

                // =====================================================
                // DISABLE HTTP BASIC
                // =====================================================

                .httpBasic(httpBasic -> httpBasic.disable())

                // =====================================================
                // DISABLE SPRING SECURITY LOGOUT
                // =====================================================
                //
                // CampusHub handles logout through AuthController so
                // the persistent USER_SESSION row can also be closed.
                // =====================================================

                .logout(logout -> logout.disable())

                // =====================================================
                // SECURITY CONTEXT
                // =====================================================

                .securityContext(securityContext ->
                        securityContext.securityContextRepository(
                                securityContextRepository
                        )
                )

                // =====================================================
                // SESSION MANAGEMENT
                // =====================================================

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.IF_REQUIRED
                        )
                )

                // =====================================================
                // AUTHORIZATION RULES
                // =====================================================

                .authorizeHttpRequests(auth -> auth

                        // =====================================================
                        // PUBLIC AUTHENTICATION ENDPOINTS
                        // =====================================================

                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/otp/request",
                                "/error"
                        ).permitAll()

                        // =====================================================
                        // ADMIN ONLY
                        // =====================================================

                        .requestMatchers("/api/admins/**")
                        .hasRole("ADMIN")

                        // =====================================================
                        // DEPARTMENT
                        // GET  -> all authenticated roles
                        // POST/PUT/DELETE -> ADMIN
                        // =====================================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/departments/**"
                        ).hasAnyRole("ADMIN", "PROFESSOR", "STUDENT")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/departments/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/departments/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/departments/**"
                        ).hasRole("ADMIN")

                        // =====================================================
                        // COURSE
                        // GET  -> all authenticated roles
                        // POST/PUT/DELETE -> ADMIN
                        // =====================================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/courses/**"
                        ).hasAnyRole("ADMIN", "PROFESSOR", "STUDENT")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/courses/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/courses/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/courses/**"
                        ).hasRole("ADMIN")

                        // =====================================================
                        // SUBJECT
                        // GET  -> all authenticated roles
                        // POST/PUT/DELETE -> ADMIN
                        // =====================================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/subjects/**"
                        ).hasAnyRole("ADMIN", "PROFESSOR", "STUDENT")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/subjects/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/subjects/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/subjects/**"
                        ).hasRole("ADMIN")

                        // =====================================================
                        // PROFESSOR
                        // General professor data -> ADMIN / PROFESSOR
                        // Create/update/delete -> ADMIN
                        // Attendance marking -> PROFESSOR
                        // Status change -> ADMIN
                        // =====================================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/professors/*/sessions/*/attendance"
                        ).hasRole("PROFESSOR")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/professors/**"
                        ).hasAnyRole("ADMIN", "PROFESSOR")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/professors/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/professors/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/professors/*/status"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/professors/**"
                        ).hasRole("ADMIN")

                        // =====================================================
                        // STUDENT
                        // Student list -> ADMIN
                        // Individual student data -> ADMIN / STUDENT
                        // Create/update/delete -> ADMIN
                        // =====================================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/students"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/students/**"
                        ).hasAnyRole("ADMIN", "STUDENT")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/students/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/students/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/students/**"
                        ).hasRole("ADMIN")

                        // =====================================================
                        // TEACHING
                        // Read -> ADMIN / PROFESSOR
                        // Modify -> ADMIN
                        // =====================================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/teachings/**"
                        ).hasAnyRole("ADMIN", "PROFESSOR")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/teachings/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/teachings/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/teachings/**"
                        ).hasRole("ADMIN")

                        // =====================================================
                        // CLASS SESSION
                        // Read -> all authenticated roles
                        // Create/update/delete -> ADMIN ONLY
                        // =====================================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/class-sessions/**"
                        ).hasAnyRole("ADMIN", "PROFESSOR", "STUDENT")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/class-sessions/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/class-sessions/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/class-sessions/**"
                        ).hasRole("ADMIN")

                        // =====================================================
                        // GENERAL STUDENT ATTENDANCE
                        // Read/write -> ADMIN / PROFESSOR
                        // Students use their own StudentController endpoints.
                        // =====================================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/attendances/**"
                        ).hasAnyRole("ADMIN", "PROFESSOR")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/attendances/**"
                        ).hasAnyRole("ADMIN", "PROFESSOR")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/attendances/**"
                        ).hasAnyRole("ADMIN", "PROFESSOR")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/attendances/**"
                        ).hasAnyRole("ADMIN", "PROFESSOR")

                        // =====================================================
                        // SUBJECT SELECTION
                        // Read/write -> ADMIN / STUDENT
                        // =====================================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/selects-subjects/**"
                        ).hasAnyRole("ADMIN", "STUDENT")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/selects-subjects/**"
                        ).hasAnyRole("ADMIN", "STUDENT")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/selects-subjects/**"
                        ).hasAnyRole("ADMIN", "STUDENT")

                        // =====================================================
                        // STAFF ATTENDANCE
                        // Professor-specific read -> ADMIN / PROFESSOR
                        // Everything else -> ADMIN
                        // =====================================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/staff-attendances/professor/**"
                        ).hasAnyRole("ADMIN", "PROFESSOR")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/staff-attendances/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/staff-attendances/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/staff-attendances/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/staff-attendances/**"
                        ).hasRole("ADMIN")

                        // =====================================================
                        // EXAMINATIONS
                        // Read -> ADMIN / PROFESSOR
                        // Configuration/modification -> ADMIN
                        // =====================================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/examinations/**"
                        ).hasAnyRole("ADMIN", "PROFESSOR")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/examinations/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/examinations/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/examinations/**"
                        ).hasRole("ADMIN")

                        // =====================================================
                        // PROFESSOR EXAMINATION AUTHENTICATION
                        // =====================================================

                        .requestMatchers(
                                "/api/examinations/authenticate"
                        ).hasRole("PROFESSOR")

                        // =====================================================
                        // STUDENT MARKS
                        // =====================================================

                        // Student's own marks / SGPA
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/student-marks/student/**"
                        ).hasAnyRole("ADMIN", "STUDENT")

                        // Professor examination workflow
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/student-marks/professor/**"
                        ).hasAnyRole("ADMIN", "PROFESSOR")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/student-marks/exam/**"
                        ).hasAnyRole("ADMIN", "PROFESSOR")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/student-marks/exam/**"
                        ).hasRole("PROFESSOR")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/student-marks/exam/**"
                        ).hasRole("PROFESSOR")

                        // General mark lookup
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/student-marks/**"
                        ).hasRole("ADMIN")

                        // Destructive mark operations
                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/student-marks/**"
                        ).hasRole("ADMIN")

                        // =====================================================
                        // AUTHENTICATED FALLBACK
                        // =====================================================

                        .anyRequest().authenticated()
                );

        return http.build();
    }
}