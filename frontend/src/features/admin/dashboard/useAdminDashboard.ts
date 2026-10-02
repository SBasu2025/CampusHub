import {
  useQuery,
} from "@tanstack/react-query";

import {
  getDashboardAnalytics,
} from "../../../lib/api/endpoints/admins";

// ============================================================
// ADMIN DASHBOARD QUERY
// ============================================================

export function useAdminDashboard() {
  return useQuery({
    // IMPORTANT:
    // This key must match the key invalidated by mutations
    // that change dashboard analytics.
    queryKey: [
      "admin-dashboard-analytics",
    ],

    queryFn:
      getDashboardAnalytics,

    // Dashboard analytics do not need
    // second-by-second polling.
    staleTime: 60_000,

    // Re-check stale dashboard data
    // when the user returns to the tab.
    refetchOnWindowFocus: true,
  });
}