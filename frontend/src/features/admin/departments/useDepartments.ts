import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "../../../lib/api/endpoints/departments";

import type {
  Department,
} from "../../../lib/api/types";

export interface DepartmentInput {
  deptId: string;
  deptName: string;
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
    staleTime: 60_000,
  });
}

export function useCreateDepartment() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      department: DepartmentInput,
    ) =>
      createDepartment(
        department,
      ),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["departments"],
      });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      department,
    }: {
      id: string;
      department: DepartmentInput;
    }) =>
      updateDepartment(
        id,
        department,
      ),

    onSuccess: (
      updatedDepartment: Department,
    ) => {
      queryClient.setQueryData<
        Department[]
      >(
        ["departments"],
        (current) => {
          if (!current) {
            return current;
          }

          return current.map(
            (department) =>
              department.deptId ===
              updatedDepartment.deptId
                ? updatedDepartment
                : department,
          );
        },
      );

      void queryClient.invalidateQueries({
        queryKey: ["departments"],
      });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      deptId: string,
    ) =>
      deleteDepartment(deptId),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["departments"],
      });
    },
  });
}