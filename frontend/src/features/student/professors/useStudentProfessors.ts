import { useQuery } from "@tanstack/react-query";
import { getProfessorsForStudent } from "../../../lib/api/endpoints/students";

export function useStudentProfessors(
  studentId: string,
) {
  return useQuery({
    queryKey: [
      "student-professors",
      studentId,
    ],
    queryFn: () =>
      getProfessorsForStudent(
        studentId,
      ),
    enabled: Boolean(studentId),
  });
}