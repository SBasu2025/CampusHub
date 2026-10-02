import { CalendarCheck2 } from "lucide-react";

import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import Skeleton from "../../../components/ui/Skeleton";
import StatusPill from "../../../components/ui/StatusPill";
import { useAuthStore } from "../../../lib/auth/store";
import { useProfessorStaffAttendance } from "./useProfessorStaffAttendance";

export default function ProfessorStaffAttendance() {
  const user = useAuthStore(
    (state) => state.user,
  );

  const professorId =
    user?.role === "PROFESSOR"
      ? user.id
      : "";

  const query =
    useProfessorStaffAttendance(
      professorId,
    );

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="pl-6 sm:pl-8">
        <h1 className="font-heading text-h1 text-heading">
          Staff Attendance
        </h1>

        <p className="mt-1 text-body-sm text-muted">
          Marked by your administrator.
        </p>
      </div>

      {query.isLoading ? (
        <Card>
          <div className="space-y-3">
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-14 w-full"
              />
            ))}
          </div>
        </Card>
      ) : query.isError ? (
        <EmptyState
          title="Unable to load staff attendance"
          description="Please check the backend and try again."
          action={{
            label: "Try again",
            onClick: () =>
              void query.refetch(),
          }}
        />
      ) : (
        (query.data ?? []).length ===
        0 ? (
          <EmptyState
            icon={
              <CalendarCheck2 className="h-6 w-6" />
            }
            title="No staff attendance records"
            description="Your administrator has not recorded any staff attendance yet."
          />
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="divide-y divide-neutral-100">
              {[
                ...(query.data ?? []),
              ]
                .sort((a, b) =>
                  b.day.localeCompare(
                    a.day,
                  ),
                )
                .map((row) => (
                  <div
                    key={row.attendanceId}
                    className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-heading text-body-sm font-semibold text-heading">
                        {row.day}
                      </p>

                      <p className="mt-1 font-mono text-[11px] text-muted">
                        {
                          row.attendanceId
                        }
                      </p>
                    </div>

                    <StatusPill
                      status={row.status}
                    />
                  </div>
                ))}
            </div>
          </Card>
        )
      )}
    </div>
  );
}