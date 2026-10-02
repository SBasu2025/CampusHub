import { useQuery } from "@tanstack/react-query";
import { getStudentTimetable } from "../../../lib/api/endpoints/students";

export function useStudentTimetable(
  studentId: string,
) {
  return useQuery({
    queryKey: [
      "student-timetable",
      studentId,
    ],
    queryFn: () =>
      getStudentTimetable(studentId),
    enabled: Boolean(studentId),
  });
}