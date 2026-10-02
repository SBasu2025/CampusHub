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

    @Value("${campushub.demo.admin.id:}")
    private String demoAdminId;

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler) throws Exception {

        /*
         * Only protect DELETE requests made to the REST API.
         *
         * The normal Spring Security authorization rules still
         * decide whether an account is allowed to access an endpoint.
         *
         * This interceptor adds one extra restriction:
         *
         *     Demo Admin -> cannot perform DELETE operations.
         */

        if (!demoModeEnabled) {
            return true;
        }

        if (!"DELETE".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String requestUri = request.getRequestURI();

        if (requestUri == null
                || !requestUri.startsWith("/api/")) {

            return true;
        }

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

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

        boolean isDemoAdmin =
                "ADMIN".equals(principal.role())
                        && demoAdminId.equals(principal.id());

        if (!isDemoAdmin) {
            return true;
        }

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
                "{\"message\":\"Demo Admin accounts cannot delete data.\"}"
        );

        return false;
    }
}