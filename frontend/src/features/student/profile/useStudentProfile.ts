import {
  useQuery,
} from "@tanstack/react-query";

import {
  getStudentById,
} from "../../../lib/api/endpoints/students";

export function useStudentProfile(
  studentId: string,
) {
  return useQuery({
    queryKey: [
      "student-profile",
      studentId,
    ],

    queryFn: () =>
      getStudentById(
        studentId,
      ),

    enabled:
      !!studentId,

    staleTime:
      30_000,
  });
}