import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createAdmin,
  deleteAdmin,
  getAdminById,
  getAdmins,
  setAdminActive,
  updateAdmin,
} from "../../../lib/api/endpoints/admins";

import type { Admin } from "../../../lib/api/types";

export function useAdmins(enabled = true) {
  return useQuery({
    queryKey: ["admins"],
    queryFn: getAdmins,
    enabled,
    staleTime: 30_000,
  });
}

export function useAdmin(adminId: string) {
  return useQuery({
    queryKey: ["admin", adminId],
    queryFn: () => getAdminById(adminId),
    enabled: Boolean(adminId),
    staleTime: 30_000,
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      request: Parameters<typeof createAdmin>[0],
    ) => createAdmin(request),

    onSuccess: (admin: Admin) => {
      queryClient.setQueryData(
        ["admin", admin.adminId],
        admin,
      );

      void queryClient.invalidateQueries({
        queryKey: ["admins"],
      });
    },
  });
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      adminId,
      request,
    }: {
      adminId: string;
      request: Parameters<typeof updateAdmin>[1];
    }) =>
      updateAdmin(
        adminId,
        request,
      ),

    onSuccess: (admin: Admin) => {
      queryClient.setQueryData(
        ["admin", admin.adminId],
        admin,
      );

      void queryClient.invalidateQueries({
        queryKey: ["admins"],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "admin",
          admin.adminId,
        ],
      });
    },
  });
}

export function useSetAdminActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      adminId,
      active,
    }: {
      adminId: string;
      active: boolean;
    }) =>
      setAdminActive(
        adminId,
        active,
      ),

    onSuccess: (admin: Admin) => {
      queryClient.setQueryData(
        ["admin", admin.adminId],
        admin,
      );

      void queryClient.invalidateQueries({
        queryKey: ["admins"],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "admin",
          admin.adminId,
        ],
      });
    },
  });
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adminId: string) =>
      deleteAdmin(adminId),

    onSuccess: (
      _data,
      adminId,
    ) => {
      queryClient.removeQueries({
        queryKey: [
          "admin",
          adminId,
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: ["admins"],
      });
    },
  });
}