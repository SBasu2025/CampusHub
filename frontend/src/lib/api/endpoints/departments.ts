import { apiClient } from "../client";
import type { Department } from "../types";

/**
 * Get all departments.
 */
export const getDepartments = async (): Promise<Department[]> => {
  const response = await apiClient.get<Department[]>(
    "/api/departments",
  );

  return response.data;
};

/**
 * Get a single department by ID.
 */
export const getDepartmentById = async (
  deptId: string,
): Promise<Department> => {
  const response = await apiClient.get<Department>(
    `/api/departments/${deptId}`,
  );

  return response.data;
};

/**
 * Create a new department.
 *
 * Expected backend body:
 * {
 *   "deptId": "...",
 *   "deptName": "..."
 * }
 */
export const createDepartment = async (
  department: Department,
): Promise<Department> => {
  const response = await apiClient.post<Department>(
    "/api/departments",
    department,
  );

  return response.data;
};

/**
 * Update an existing department.
 *
 * The backend uses the URL ID and only updates deptName.
 */
export const updateDepartment = async (
  deptId: string,
  department: Department,
): Promise<Department> => {
  const response = await apiClient.put<Department>(
    `/api/departments/${deptId}`,
    department,
  );

  return response.data;
};

/**
 * Delete a department.
 *
 * Successful response is HTTP 204 with no response body.
 */
export const deleteDepartment = async (
  deptId: string,
): Promise<void> => {
  await apiClient.delete(`/api/departments/${deptId}`);
};