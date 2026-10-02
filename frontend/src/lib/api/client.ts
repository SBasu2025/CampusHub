import axios from "axios";
import toast from "react-hot-toast";

import { useAuthStore } from "../auth/store";

// ============================================================
// AXIOS CLIENT
// ============================================================

export const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8080",

  // CampusHub uses Spring Security's JSESSIONID
  // session cookie rather than JWT authentication.
  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// GLOBAL RESPONSE INTERCEPTOR
// ============================================================

apiClient.interceptors.response.use(
  (response) => response,

  (error) => {
    const status =
      error.response?.status;

    const requestUrl =
      error.config?.url ?? "";

    const requestMethod =
      error.config?.method?.toLowerCase() ?? "";

    const isAuthRequest =
      requestUrl.includes(
        "/api/auth/login",
      ) ||
      requestUrl.includes(
        "/api/auth/me",
      ) ||
      requestUrl.includes(
        "/api/auth/logout",
      );

    // ----------------------------------------------------------
    // 401 — UNAUTHENTICATED
    // ----------------------------------------------------------
    //
    // Authentication endpoints handle their own 401 logic.
    //
    // /api/auth/login
    //   401 -> invalid CampusHub ID
    //
    // /api/auth/me
    //   401 -> no active session
    //
    // Protected endpoints:
    //   401 -> clear local auth state and return to login.
    // ----------------------------------------------------------

    if (
      status === 401 &&
      !isAuthRequest
    ) {
      useAuthStore
        .getState()
        .clearUser();

      if (
        window.location.pathname !==
        "/login"
      ) {
        window.location.href =
          "/login";
      }
    }

    // ----------------------------------------------------------
    // 403 — FORBIDDEN
    // ----------------------------------------------------------
    //
    // A 403 means:
    //   authenticated user + insufficient permission
    //
    // Most pages receive their own useful backend error
    // handling. Therefore the generic toast is retained for
    // ordinary 403 responses, but suppressed for the admin
    // DELETE endpoint so AdminAccounts.tsx can display the
    // precise backend message.
    // ----------------------------------------------------------

    const isAdminDeleteRequest =
      requestMethod === "delete" &&
      requestUrl.includes(
        "/api/admins/",
      );

    if (
      status === 403 &&
      !isAuthRequest &&
      !isAdminDeleteRequest
    ) {
      toast.error(
        "You don't have access to this.",
      );
    }

    // ----------------------------------------------------------
    // IMPORTANT
    // ----------------------------------------------------------
    //
    // Never convert the Axios error into a new generic Error.
    //
    // The original error contains:
    //
    // error.response.status
    // error.response.data
    //
    // and the frontend account-management pages use that
    // response.data to display backend messages such as:
    //
    // "Phone number is already registered to a student."
    //
    // Therefore the original error must always continue
    // through the promise chain.
    // ----------------------------------------------------------

    return Promise.reject(error);
  },
);