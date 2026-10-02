import { useQuery } from "@tanstack/react-query";

import {
  getProfessorSubjectAttendance,
  getProfessorSubjects,
} from "../../../lib/api/endpoints/professors";

export function useProfessorStudents(
  professorId: string,
  subjectId: string,
) {
  const subjects = useQuery({
    queryKey: [
      "professor-subjects",
      professorId,
    ],
    queryFn: () =>
      getProfessorSubjects(professorId),
    enabled: Boolean(professorId),
  });

  const attendance = useQuery({
    queryKey: [
      "professor-subject-attendance",
      professorId,
      subjectId,
    ],
    queryFn: () =>
      getProfessorSubjectAttendance(
        professorId,
        subjectId,
      ),
    enabled: Boolean(
      professorId && subjectId,
    ),
  });

  return {
    subjects,
    attendance,
  };
}