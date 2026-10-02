import { useNavigate } from "react-router-dom";

import ClassSessionAgenda from "../../../components/timetable/ClassSessionAgenda";
import EmptyState from "../../../components/ui/EmptyState";
import Skeleton from "../../../components/ui/Skeleton";
import Card from "../../../components/ui/Card";
import { useAuthStore } from "../../../lib/auth/store";
import { useProfessorTimetable } from "./useProfessorTimetable";

export default function ProfessorTimetable() {
  const user = useAuthStore(
    (state) => state.user,
  );

  const professorId =
    user?.role === "PROFESSOR"
      ? user.id
      : "";

  const query =
    useProfessorTimetable(professorId);

  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="pl-6 sm:pl-8">
        <h1 className="font-heading text-h1 text-heading">
          Timetable
        </h1>

        <p className="mt-1 text-body-sm text-muted">
          Your dated class occurrences,
          arranged chronologically.
        </p>
      </div>

      {query.isLoading ? (
        <Card>
          <Skeleton className="h-96 w-full" />
        </Card>
      ) : query.isError ? (
        <EmptyState
          title="Unable to load timetable"
          description="Please check the backend and try again."
          action={{
            label: "Try again",
            onClick: () =>
              void query.refetch(),
          }}
        />
      ) : (
        <ClassSessionAgenda
          sessions={query.data ?? []}
          onSessionClick={(session) =>
            navigate(
              `/professor/attendance/${session.sessionId}`,
            )
          }
          emptyMessage="No class sessions are scheduled yet."
        />
      )}
    </div>
  );
}