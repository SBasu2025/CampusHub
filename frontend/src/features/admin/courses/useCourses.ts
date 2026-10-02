import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createCourse,
  deleteCourse,
  getCourses,
  updateCourse,
} from "../../../lib/api/endpoints/courses";

import type {
  Course,
} from "../../../lib/api/types";

// ============================================================
// COURSES
// ============================================================

export function useCourses(
  departmentId?: string,
) {
  return useQuery({
    queryKey: [
      "courses",
      departmentId ?? "",
    ],

    queryFn: () =>
      getCourses(
        departmentId ||
          undefined,
      ),

    staleTime: 60_000,
  });
}

// ============================================================
// CREATE COURSE
// ============================================================

export function useCreateCourse() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      course: Course,
    ) =>
      createCourse(
        course,
      ),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [
          "courses",
        ],
      });

      // ClassSession contains Course
      // in its nested response.
      void queryClient.invalidateQueries({
        queryKey: [
          "class-sessions",
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "student-timetable",
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "professor-timetable",
        ],
      });
    },
  });
}

// ============================================================
// UPDATE COURSE
// ============================================================

export function useUpdateCourse() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      course,
    }: {
      id: string;

      course: Course;
    }) =>
      updateCourse(
        id,
        course,
      ),

    onSuccess: (
      updatedCourse: Course,
    ) => {
      queryClient.setQueryData<
        Course[]
      >(
        [
          "courses",
          "",
        ],
        (current) => {
          if (!current) {
            return current;
          }

          return current.map(
            (course) =>
              course.courseId ===
              updatedCourse.courseId
                ? updatedCourse
                : course,
          );
        },
      );

      void queryClient.invalidateQueries({
        queryKey: [
          "courses",
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "class-sessions",
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "student-timetable",
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "professor-timetable",
        ],
      });
    },
  });
}

// ============================================================
// DELETE COURSE
// ============================================================

export function useDeleteCourse() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      courseId: string,
    ) =>
      deleteCourse(
        courseId,
      ),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [
          "courses",
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "class-sessions",
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "student-timetable",
        ],
      });

      void queryClient.invalidateQueries({
        queryKey: [
          "professor-timetable",
        ],
      });
    },
  });
}