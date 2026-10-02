import { useQuery } from "@tanstack/react-query";
import { getProfessorById } from "../../../lib/api/endpoints/professors";

export function useProfessorProfile(
  professorId: string,
) {
  return useQuery({
    queryKey: ["professor", professorId],
    queryFn: () =>
      getProfessorById(professorId),
    enabled: Boolean(professorId),
  });
}