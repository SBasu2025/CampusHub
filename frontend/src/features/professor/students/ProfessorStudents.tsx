import {
  useMemo,
  useState,
} from "react";

import { Users } from "lucide-react";

import AttendanceDonutChart from "../../../components/charts/AttendanceDonutChart";
import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import StatusPill from "../../../components/ui/StatusPill";
import { Select } from "../../../components/ui/Select";
import { toAttendanceDonutData } from "../../../lib/utils/charts";
import { useAuthStore } from "../../../lib/auth/store";
import { useProfessorStudents } from "./useProfessorStudents";

export default function ProfessorStudents() {
  const user = useAuthStore(
    (state) => state.user,
  );

  const professorId =
    user?.role === "PROFESSOR"
      ? user.id
      : "";

  const [
    subjectId,
    setSubjectId,
  ] = useState("");

  const {
    subjects,
    attendance,
  } =
    useProfessorStudents(
      professorId,
      subjectId,
    );

  const totals = useMemo(() => {
    const rows =
      attendance.data ?? [];

    const totalSessions =
      rows.reduce(
        (sum, row) =>
          sum +
          row.totalSessions,
        0,
      );

    const presentSessions =
      rows.reduce(
        (sum, row) =>
          sum +
          row.presentSessions,
        0,
      );

    const absentSessions =
      Math.max(
        totalSessions -
          presentSessions,
        0,
      );

    return {
      totalSessions,
      presentSessions,
      absentSessions,
      percentage: totalSessions
        ? Math.round(
            (presentSessions /
              totalSessions) *
              100,
          )
        : 0,
    };
  }, [
    attendance.data,
  ]);

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="pl-6 sm:pl-8">
        <h1 className="font-heading text-h1 text-heading">
          My Students
        </h1>

        <p className="mt-1 text-body-sm text-muted">
          Review class-wide attendance and
          each student's attendance record by
          subject.
        </p>
      </div>

      <Card>
        <Select
          label="Subject"
          value={subjectId}
          onChange={(event) =>
            setSubjectId(
              event.target.value,
            )
          }
          options={[
            {
              value: "",
              label: "Select a subject",
            },
            ...(subjects.data ?? []).map(
              (item) => ({
                value:
                  item.subject.subjectId,
                label: `${item.subject.subjectName} — ${item.subject.course.courseName}`,
              }),
            ),
          ]}
        />
      </Card>

      {!subjectId ? (
        <EmptyState
          icon={
            <Users className="h-6 w-6" />
          }
          title="Choose a subject"
          description="Select one of your teaching assignments to view the class attendance breakdown."
        />
      ) : attendance.isLoading ? (
        <Card>
          <div className="h-72 animate-pulse rounded-lg bg-neutral-100" />
        </Card>
      ) : attendance.isError ? (
        <EmptyState
          title="Unable to load class attendance"
          description="Please check the backend and try again."
          action={{
            label: "Try again",
            onClick: () =>
              void attendance.refetch(),
          }}
        />
      ) : (
        <div className="space-y-6">
          <Card>
            <div className="flex flex-col items-center gap-6 md:flex-row">
              <AttendanceDonutChart
                data={toAttendanceDonutData(
                  totals.presentSessions,
                  totals.absentSessions,
                )}
                percentage={
                  totals.percentage
                }
                caption="Class attendance"
                size="lg"
              />

              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:max-w-md">
                <div className="rounded-lg bg-neutral-50 p-4">
                  <p className="text-caption text-muted">
                    Students
                  </p>

                  <p className="mt-2 font-heading text-2xl font-bold text-heading tabular-nums">
                    {attendance.data
                      ?.length ?? 0}
                  </p>
                </div>

                <div className="rounded-lg bg-primary-50 p-4">
                  <p className="text-caption text-muted">
                    Present
                  </p>

                  <p className="mt-2 font-heading text-2xl font-bold text-primary-700 tabular-nums">
                    {
                      totals.presentSessions
                    }
                  </p>
                </div>

                <div className="rounded-lg bg-danger-bg p-4">
                  <p className="text-caption text-danger-text">
                    Absent
                  </p>

                  <p className="mt-2 font-heading text-2xl font-bold text-danger-text tabular-nums">
                    {
                      totals.absentSessions
                    }
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-default px-6 py-4">
              <h2 className="font-heading text-h3 text-heading">
                Student Attendance
              </h2>
            </div>

            <div className="divide-y divide-neutral-100">
              {(
                attendance.data ?? []
              ).map((row) => (
                <div
                  key={row.studentId}
                  className="flex flex-col gap-3 px-6 py-4 transition-colors duration-150 hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-heading text-body-sm font-semibold text-heading">
                      {row.studentName}
                    </p>

                    <p className="mt-1 text-caption text-muted">
                      {row.studentId} ·{" "}
                      {
                        row.subjectName
                      }
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <StatusPill
                      status={`${Math.round(
                        row.attendancePercentage,
                      )}%`}
                      variant={
                        row.attendancePercentage >=
                        75
                          ? "present"
                          : "absent"
                      }
                    />

                    <span className="text-caption text-muted">
                      {
                        row.presentSessions
                      }
                      /
                      {
                        row.totalSessions
                      }{" "}
                      present
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}