package com.campushub.backend.security;

/**
 * Authenticated CampusHub identity carried in Spring Security's context.
 * The ID is the credential; no separate password is used.
 */
public record CampusHubPrincipal(
        String id,
        String role,
        String displayName) {
}