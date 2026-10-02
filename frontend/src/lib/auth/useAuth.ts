import { useCallback } from "react";
import axios from "axios";

import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  requestOtp as requestOtpRequest,
  type LoginResponse,
  type OtpRequestResponse,
} from "../api/endpoints/auth";

import type { AuthUser } from "../api/types";
import { useAuthStore } from "./store";

// ============================================================
// ERROR MESSAGE HELPERS
// ============================================================

/**
 * Errors that can happen while requesting an OTP.
 *
 * Step 1:
 *   CampusHub ID + registered phone number
 */
const getOtpRequestErrorMessage = (
  error: unknown,
): string => {
  if (!axios.isAxiosError(error)) {
    return "Something went wrong. Please try again.";
  }

  const status = error.response?.status;

  switch (status) {
    case 400:
      return "Please enter your CampusHub ID and phone number.";

    case 401:
      return "We couldn't match that ID with that phone number.";

    case 403:
      return "This account is inactive. Contact your administrator.";

    default:
      return "Something went wrong. Please try again.";
  }
};

/**
 * Errors that can happen while verifying the OTP.
 *
 * Step 2:
 *   CampusHub ID + registered phone number + OTP
 */
const getLoginErrorMessage = (
  error: unknown,
): string => {
  if (!axios.isAxiosError(error)) {
    return "Something went wrong. Please try again.";
  }

  const status = error.response?.status;

  switch (status) {
    case 400:
      return "Please enter the 6-digit code.";

    case 401:
      return "That code is incorrect or has expired.";

    case 403:
      return "This account is inactive. Contact your administrator.";

    default:
      return "Something went wrong. Please try again.";
  }
};

// ============================================================
// REQUEST OTP
// ============================================================

/**
 * Step 1 of CampusHub login.
 *
 * The user supplies:
 *
 *   CampusHub ID
 *   +
 *   registered phone number
 *
 * The backend validates the account and sends a
 * fresh 6-digit OTP.
 */
export const useRequestOtp = () => {

  const requestOtp = useCallback(
    async (
      id: string,
      phoneNumber: string,
    ): Promise<OtpRequestResponse> => {

      const trimmedId =
        id.trim();

      const trimmedPhone =
        phoneNumber.trim();

      if (!trimmedId || !trimmedPhone) {
        throw new Error(
          "Please enter your CampusHub ID and phone number.",
        );
      }

      try {

        return await requestOtpRequest(
          trimmedId,
          trimmedPhone,
        );

      } catch (error) {

        throw new Error(
          getOtpRequestErrorMessage(error),
        );
      }
    },
    [],
  );

  return {
    requestOtp,
  };
};

// ============================================================
// LOGIN / VERIFY OTP
// ============================================================

/**
 * Step 2 of CampusHub login.
 *
 * The user supplies:
 *
 *   CampusHub ID
 *   +
 *   registered phone number
 *   +
 *   6-digit OTP
 *
 * On success:
 *   1. Backend authenticates the user.
 *   2. Spring Security keeps the HTTP session.
 *   3. Backend creates a USER_SESSION record.
 *   4. Frontend stores the authenticated user in Zustand.
 */
export const useLogin = () => {

  const setUser = useAuthStore(
    (state) => state.setUser,
  );

  const login = useCallback(
    async (
      id: string,
      phoneNumber: string,
      otp: string,
    ): Promise<LoginResponse> => {

      const trimmedId =
        id.trim();

      const trimmedPhone =
        phoneNumber.trim();

      const trimmedOtp =
        otp.trim();

      if (!trimmedId || !trimmedPhone) {
        throw new Error(
          "Please enter your CampusHub ID and phone number.",
        );
      }

      if (!trimmedOtp) {
        throw new Error(
          "Please enter the 6-digit code.",
        );
      }

      try {

        const response =
          await loginRequest(
            trimmedId,
            trimmedPhone,
            trimmedOtp,
          );

        /*
         * Keep the existing frontend auth-store shape.
         *
         * phoneNumber and OTP are deliberately NOT stored
         * in Zustand.
         */
        const user: AuthUser = {
          id: response.id,
          role: response.role,
          displayName: response.displayName,
        };

        setUser(user);

        return response;

      } catch (error) {

        throw new Error(
          getLoginErrorMessage(error),
        );
      }
    },
    [setUser],
  );

  return {
    login,
  };
};

// ============================================================
// SESSION HYDRATION
// ============================================================

/**
 * Check for an already-authenticated backend session.
 *
 * GET /api/auth/me
 *
 * 200
 *   -> populate Zustand
 *
 * 401
 *   -> no authenticated session
 *
 * This continues using the existing Spring Security
 * session-cookie authentication.
 */
export const useAuthHydration = () => {

  const setUser = useAuthStore(
    (state) => state.setUser,
  );

  const clearUser = useAuthStore(
    (state) => state.clearUser,
  );

  const setHydrated = useAuthStore(
    (state) => state.setHydrated,
  );

  const hydrate = useCallback(
    async (): Promise<AuthUser | null> => {

      try {

        const user =
          await getCurrentUser();

        setUser(user);

        return user;

      } catch (error) {

        /*
         * A 401 is a normal "not logged in" state.
         */
        if (
          axios.isAxiosError(error) &&
          error.response?.status === 401
        ) {

          clearUser();

          return null;
        }

        /*
         * For any other error, do not leave stale
         * authentication information in the frontend.
         */
        clearUser();

        throw new Error(
          "Unable to verify your CampusHub session.",
        );

      } finally {

        setHydrated(true);
      }
    },
    [
      setUser,
      clearUser,
      setHydrated,
    ],
  );

  return {
    hydrate,
  };
};

// ============================================================
// LOGOUT
// ============================================================

/**
 * Logout from:
 *
 *   1. Backend Spring Security session
 *   2. Persistent USER_SESSION record
 *   3. Frontend Zustand authentication state
 */
export const useLogout = () => {

  const clearUser = useAuthStore(
    (state) => state.clearUser,
  );

  const logout = useCallback(
    async (): Promise<void> => {

      try {

        await logoutRequest();

      } finally {

        /*
         * Always clear the client-side user state,
         * even if the backend request fails.
         */
        clearUser();
      }
    },
    [clearUser],
  );

  return {
    logout,
  };
};

// ============================================================
// COMBINED AUTH HOOK
// ============================================================

/**
 * Main authentication hook used by the application.
 *
 * Exposes:
 *
 *   user
 *   isAuthenticated
 *   isHydrated
 *   requestOtp
 *   login
 *   hydrate
 *   logout
 */
export const useAuth = () => {

  const user = useAuthStore(
    (state) => state.user,
  );

  const isHydrated = useAuthStore(
    (state) => state.isHydrated,
  );

  const { requestOtp } =
    useRequestOtp();

  const { login } =
    useLogin();

  const { hydrate } =
    useAuthHydration();

  const { logout } =
    useLogout();

  return {
    user,

    isAuthenticated:
      user !== null,

    isHydrated,

    requestOtp,

    login,

    hydrate,

    logout,
  };
};