import { apiClient } from "../client";
import type { Course } from "../types";

/**
 * Get all courses.
 *
 * Optional departmentId filters courses by department.
 *
 * GET /api/courses
 * GET /api/courses?departmentId={departmentId}
 */
export const getCourses = async (
  departmentId?: string,
): Promise<Course[]> => {
  const response = await apiClient.get<Course[]>(
    "/api/courses",
    {
      params: departmentId
        ? { departmentId }
        : undefined,
    },
  );

  return response.data;
};

/**
 * Get a single course by ID.
 *
 * GET /api/courses/{id}
 */
export const getCourseById = async (
  courseId: string,
): Promise<Course> => {
  const response = await apiClient.get<Course>(
    `/api/courses/${courseId}`,
  );

  return response.data;
};

/**
 * Create a new course.
 *
 * The backend requires a non-null department.
 *
 * Expected body:
 * {
 *   "courseId": "...",
 *   "courseName": "...",
 *   "department": {
 *     "deptId": "..."
 *   }
 * }
 */
export const createCourse = async (
  course: Course,
): Promise<Course> => {
  const response = await apiClient.post<Course>(
    "/api/courses",
    course,
  );

  return response.data;
};

/**
 * Update an existing course.
 *
 * The backend takes the course ID from the URL and
 * forces the request body's courseId to that same ID.
 */
export const updateCourse = async (
  courseId: string,
  course: Course,
): Promise<Course> => {
  const response = await apiClient.put<Course>(
    `/api/courses/${courseId}`,
    course,
  );

  return response.data;
};

/**
 * Delete a course.
 *
 * The backend returns:
 * 204 No Content -> successful deletion
 * 404            -> course not found
 * 409            -> subjects or students are linked
 */
export const deleteCourse = async (
  courseId: string,
): Promise<void> => {
  await apiClient.delete(`/api/courses/${courseId}`);
};