import { useQuery } from "@tanstack/react-query";
import { getProfessorStaffAttendance } from "../../../lib/api/endpoints/professors";

export function useProfessorStaffAttendance(
  professorId: string,
) {
  return useQuery({
    queryKey: [
      "professor-staff-attendance",
      professorId,
    ],
    queryFn: () =>
      getProfessorStaffAttendance(
        professorId,
      ),
    enabled: Boolean(professorId),
  });
}