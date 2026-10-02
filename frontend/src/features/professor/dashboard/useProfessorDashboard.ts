import { useQuery } from "@tanstack/react-query";

import {
  getProfessorById,
  getProfessorSubjects,
  getProfessorTimetable,
  getProfessorStaffAttendance,
} from "../../../lib/api/endpoints/professors";

export function useProfessorDashboard(professorId: string) {
  const profile = useQuery({
    queryKey: ["professor", professorId],
    queryFn: () => getProfessorById(professorId),
    enabled: Boolean(professorId),
  });

  const subjects = useQuery({
    queryKey: ["professor-subjects", professorId],
    queryFn: () => getProfessorSubjects(professorId),
    enabled: Boolean(professorId),
  });

  const timetable = useQuery({
    queryKey: ["professor-timetable", professorId],
    queryFn: () => getProfessorTimetable(professorId),
    enabled: Boolean(professorId),
  });

  const staffAttendance = useQuery({
    queryKey: ["professor-staff-attendance", professorId],
    queryFn: () => getProfessorStaffAttendance(professorId),
    enabled: Boolean(professorId),
  });

  return {
    profile,
    subjects,
    timetable,
    staffAttendance,
    isLoading:
      profile.isLoading ||
      subjects.isLoading ||
      timetable.isLoading ||
      staffAttendance.isLoading,
    isError:
      profile.isError ||
      subjects.isError ||
      timetable.isError ||
      staffAttendance.isError,
    refetchAll: async () => {
      await Promise.all([
        profile.refetch(),
        subjects.refetch(),
        timetable.refetch(),
        staffAttendance.refetch(),
      ]);
    },
  };
}