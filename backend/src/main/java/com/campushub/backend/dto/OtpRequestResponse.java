package com.campushub.backend.dto;

public record OtpRequestResponse(
        String message,
        long expiresInSeconds
) {
}