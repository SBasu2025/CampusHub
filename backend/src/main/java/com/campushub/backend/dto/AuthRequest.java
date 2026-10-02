package com.campushub.backend.dto;

public record AuthRequest(
        String id,
        String phoneNumber,
        String otp
) {
}