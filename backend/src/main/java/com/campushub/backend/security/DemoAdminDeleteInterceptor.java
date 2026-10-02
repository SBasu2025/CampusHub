package com.campushub.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class DemoAdminDeleteInterceptor implements HandlerInterceptor {

    @Value("${campushub.demo.enabled:false}")
    private boolean demoModeEnabled;

    private final CampusHubAuthorizationService authorizationService;

    public DemoAdminDeleteInterceptor(
            CampusHubAuthorizationService authorizationService) {

        this.authorizationService =
                authorizationService;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler) throws Exception {

        /*
         * =====================================================
         * DEMO MODE DELETE POLICY
         * =====================================================
         *
         * When demo mode is OFF:
         *
         *     Preserve the normal CampusHub authorization rules.
         *
         * When demo mode is ON:
         *
         *     Special Admin
         *         -> DELETE allowed
         *
         *     Every other ADMIN
         *         -> DELETE forbidden
         *
         *     Non-ADMIN users
         *         -> leave normal Spring Security rules untouched
         *
         * This means the public demo admin can safely explore
         * the administrative features without being able to
         * permanently delete CampusHub data.
         *
         * The restriction is enforced server-side, so a user
         * cannot bypass it merely by calling the DELETE endpoint
         * directly from the browser or an API client.
         */

        if (!demoModeEnabled) {
            return true;
        }

        /*
         * Only protect DELETE requests.
         */
        if (!"DELETE".equalsIgnoreCase(
                request.getMethod())) {

            return true;
        }

        String requestUri =
                request.getRequestURI();

        /*
         * Only protect REST API DELETE requests.
         *
         * Non-API requests are left untouched.
         */
        if (requestUri == null
                || !requestUri.startsWith("/api/")) {

            return true;
        }

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        /*
         * If there is no authenticated user,
         * let the normal Spring Security chain
         * handle the request.
         */
        if (authentication == null
                || !authentication.isAuthenticated()) {

            return true;
        }

        Object principalObject =
                authentication.getPrincipal();

        if (!(principalObject
                instanceof CampusHubPrincipal principal)) {

            return true;
        }

        /*
         * Only impose this extra restriction on ADMIN accounts.
         *
         * Professors/students continue to be governed by the
         * normal endpoint-specific Spring Security rules.
         */
        if (!"ADMIN".equals(
                principal.role())) {

            return true;
        }

        /*
         * The Special Admin is exempt from the demo-mode
         * delete restriction.
         *
         * IMPORTANT:
         * We intentionally ask CampusHubAuthorizationService
         * whether this account is the Special Admin instead
         * of hard-coding the Special Admin ID here.
         *
         * The actual Special Admin ID therefore remains supplied
         * through environment configuration.
         */
        if (authorizationService.isSpecialAdmin(
                authentication)) {

            return true;
        }

        /*
         * Every ordinary ADMIN is blocked from DELETE while
         * demo mode is enabled.
         */
        response.setStatus(
                HttpServletResponse.SC_FORBIDDEN
        );

        response.setContentType(
                "application/json"
        );

        response.setCharacterEncoding(
                "UTF-8"
        );

        response.getWriter().write(
                "{\"message\":\"Administrator delete operations are disabled in public demo mode.\"}"
        );

        return false;
    }
}