package com.campushub.backend.dto;

public record AuthResponse(
        String id,
        String role,
        String displayName,
        String message) {
}