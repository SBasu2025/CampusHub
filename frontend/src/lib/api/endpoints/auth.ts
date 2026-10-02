import { apiClient } from "../client";
import type { AuthUser } from "../types";

// ============================================================
// LOGIN REQUEST
// ============================================================

export interface LoginRequest {
  id: string;
  phoneNumber: string;
  otp: string;
}

// ============================================================
// LOGIN RESPONSE
// ============================================================

export interface LoginResponse extends AuthUser {
  message: string;
}

// ============================================================
// OTP REQUEST
// ============================================================

export interface OtpRequest {
  id: string;
  phoneNumber: string;
}

// ============================================================
// OTP REQUEST RESPONSE
// ============================================================

export interface OtpRequestResponse {
  message: string;
  expiresInSeconds: number;
}

// ============================================================
// REQUEST OTP
// ============================================================
//
// Step 1:
//
//   CampusHub ID + registered phone number
//
// Backend:
//
//   POST /api/auth/otp/request
//
// The backend checks the ID + phone number combination,
// generates a fresh 6-digit OTP, hashes it, stores it,
// and sends it through SmsSender.
// ============================================================

export const requestOtp = async (
  id: string,
  phoneNumber: string,
): Promise<OtpRequestResponse> => {

  const response =
    await apiClient.post<OtpRequestResponse>(
      "/api/auth/otp/request",
      {
        id,
        phoneNumber,
      },
    );

  return response.data;
};

// ============================================================
// LOGIN / VERIFY OTP
// ============================================================
//
// Step 2:
//
//   CampusHub ID
//   + registered phone number
//   + 6-digit OTP
//
// Backend:
//
//   POST /api/auth/login
//
// On success:
//
//   - Spring Security session is created
//   - USER_SESSION row is created
//   - authenticated user is returned
// ============================================================

export const login = async (
  id: string,
  phoneNumber: string,
  otp: string,
): Promise<LoginResponse> => {

  const response =
    await apiClient.post<LoginResponse>(
      "/api/auth/login",
      {
        id,
        phoneNumber,
        otp,
      },
    );

  return response.data;
};

// ============================================================
// CURRENT USER
// ============================================================
//
// Restores the authenticated user from the existing
// Spring Security HTTP session.
//
// GET /api/auth/me
// ============================================================

export const getCurrentUser = async (): Promise<AuthUser> => {

  const response =
    await apiClient.get<AuthUser>(
      "/api/auth/me",
    );

  return response.data;
};

// ============================================================
// LOGOUT
// ============================================================
//
// Ends the Spring Security session.
//
// The backend also closes the matching persistent
// USER_SESSION row by setting logout_time.
// ============================================================

export const logout = async (): Promise<void> => {

  await apiClient.post(
    "/api/auth/logout",
  );
};