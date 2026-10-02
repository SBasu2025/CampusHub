import { useQuery } from "@tanstack/react-query";
import { getProfessorTimetable } from "../../../lib/api/endpoints/professors";

export function useProfessorTimetable(
  professorId: string,
) {
  return useQuery({
    queryKey: [
      "professor-timetable",
      professorId,
    ],
    queryFn: () =>
      getProfessorTimetable(professorId),
    enabled: Boolean(professorId),
  });
}