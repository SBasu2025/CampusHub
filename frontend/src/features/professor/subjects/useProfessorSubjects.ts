import {
    useQueries,
    useQuery,
  } from "@tanstack/react-query";

  import {
    getProfessorSubjectAttendance,
    getProfessorSubjects,
    getSessionCountForSubject,
  } from "../../../lib/api/endpoints/professors";

  export function useProfessorSubjects(
    professorId: string,
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

    const queries = (
      subjects.data ?? []
    ).map((teaching) => {
      const subjectId =
        teaching.subject.subjectId;

      return {
        queryKey: [
          "professor-subject-stat",
          professorId,
          subjectId,
        ],
        queryFn: async () => {
          const [
            sessionCount,
            attendance,
          ] = await Promise.all([
            getSessionCountForSubject(
              professorId,
              subjectId,
            ),
            getProfessorSubjectAttendance(
              professorId,
              subjectId,
            ),
          ]);

          return {
            sessionCount,
            attendance,
          };
        },
        enabled: Boolean(
          professorId && subjectId,
        ),
        staleTime: 60_000,
      };
    });

    const stats = useQueries({
      queries,
    });

    return {
      subjects,
      stats,
    };
  }