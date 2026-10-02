import {
  useMemo,
  useState,
} from "react";

import {
  CalendarClock,
  ChevronRight,
} from "lucide-react";

import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Card from "../../../components/ui/Card";

import EmptyState from "../../../components/ui/EmptyState";

import {
  Select,
} from "../../../components/ui/Select";

import Skeleton from "../../../components/ui/Skeleton";

import StatusPill from "../../../components/ui/StatusPill";

import {
  useAuthStore,
} from "../../../lib/auth/store";

import {
  useProfessorAttendanceHistory,
} from "./useProfessorAttendanceHistory";

export default function ProfessorAttendanceHistory() {
  const user =
    useAuthStore(
      (state) =>
        state.user,
    );

  const professorId =
    user?.role ===
    "PROFESSOR"
      ? user.id
      : "";

  const [
    subjectId,
    setSubjectId,
  ] = useState("");

  const navigate =
    useNavigate();

  const {
    subjects,
    sessions,
    filtered,
    attendance,
  } =
    useProfessorAttendanceHistory(
      professorId,
      subjectId,
    );

  const statusBySession =
    useMemo(() => {
      const map =
        new Map<
          string,
          boolean
        >();

      filtered.forEach(
        (
          session,
          index,
        ) => {
          const records =
            attendance[
              index
            ]?.data ?? [];

          map.set(
            session.sessionId,
            records.length >
              0,
          );
        },
      );

      return map;
    }, [
      attendance,
      filtered,
    ]);

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    user.role !==
    "PROFESSOR"
  ) {
    return (
      <Navigate
        to={`/${user.role.toLowerCase()}`}
        replace
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="pl-6 sm:pl-8">
        <p className="text-body-sm font-medium text-primary-600">
          Attendance
        </p>

        <h1 className="mt-1 font-heading text-h1 text-heading">
          Attendance History
        </h1>

        <p className="mt-1 max-w-2xl text-body-sm text-muted">
          Review and correct past dated sessions without cluttering your everyday dashboard.
        </p>
      </div>

      <Card>
        <Select
          label="Subject"
          value={subjectId}
          onChange={(
            event,
          ) => {
            setSubjectId(
              event.target.value,
            );
          }}
          options={[
            {
              value: "",
              label: "All subjects",
            },

            ...(
              subjects.data ??
              []
            ).map(
              (item) => ({
                value:
                  item.subject
                    .subjectId,

                label: `${item.subject.subjectName} — ${item.subject.course.courseName}`,
              }),
            ),
          ]}
        />
      </Card>

      {(
        subjects.isLoading ||
        sessions.isLoading
      ) ? (
        <Card>
          <div className="space-y-3">
            {Array.from({
              length: 5,
            }).map(
              (
                _,
                index,
              ) => (
                <div
                  key={index}
                  className="rounded-lg border border-neutral-200 p-4"
                >
                  <Skeleton className="h-4 w-52" />

                  <Skeleton className="mt-2 h-3 w-80" />

                  <Skeleton className="mt-3 h-7 w-28" />
                </div>
              ),
            )}
          </div>
        </Card>
      ) : subjects.isError ||
        sessions.isError ? (
        <EmptyState
          title="Unable to load history"
          description="We couldn't retrieve your attendance history. Please try again."
          action={{
            label: "Try again",
            onClick: () => {
              void subjects.refetch();
              void sessions.refetch();
            },
          }}
        />
      ) : filtered.length ===
        0 ? (
        <EmptyState
          icon={
            <CalendarClock className="h-6 w-6" />
          }
          title="No past sessions"
          description="There are no past dated sessions for the selected subject."
        />
      ) : (
        <Card>
          <div className="mb-5">
            <h2 className="font-heading text-h3 text-heading">
              Past Sessions
            </h2>

            <p className="mt-1 text-body-sm text-muted">
              Newest sessions appear first. Review opens the same attendance editor used for new marking.
            </p>
          </div>

          <div className="space-y-3">
            {filtered.map(
              (
                session,
              ) => {
                const recorded =
                  statusBySession.get(
                    session.sessionId,
                  ) ??
                  false;

                return (
                  <button
                    key={
                      session.sessionId
                    }
                    type="button"
                    onClick={() => {
                      navigate(
                        `/professor/attendance/${encodeURIComponent(
                          session.sessionId,
                        )}`,
                      );
                    }}
                    className="group flex w-full flex-col gap-4 rounded-lg border border-neutral-200 p-4 text-left transition-all duration-150 hover:-translate-y-px hover:border-primary-200 hover:bg-primary-50/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-300 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-heading text-body-sm font-semibold text-heading">
                        {
                          session
                            .teaching
                            .subject
                            .subjectName
                        }
                      </p>

                      <p className="mt-1 text-caption text-muted">
                        {session.day} ·{" "}
                        {session.startTime.slice(
                          0,
                          5,
                        )}
                        –
                        {session.endTime.slice(
                          0,
                          5,
                        )}{" "}
                        ·{" "}
                        {
                          session
                            .course
                            .courseName
                        }{" "}
                        · Section{" "}
                        {
                          session.section
                        }
                      </p>

                      <p className="mt-1 font-mono text-[11px] text-neutral-400">
                        {
                          session.sessionId
                        }
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                      <StatusPill
                        status={
                          recorded
                            ? "Attendance recorded"
                            : "Not yet recorded"
                        }
                        variant={
                          recorded
                            ? "present"
                            : "pending"
                        }
                      />

                      <span className="inline-flex items-center gap-1 text-body-sm font-semibold text-primary-600 transition-transform duration-150 group-hover:translate-x-0.5">
                        Review

                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </button>
                );
              },
            )}
          </div>
        </Card>
      )}

      <Link
        to="/professor"
        className="inline-flex text-body-sm font-semibold text-primary-600 hover:text-primary-700"
      >
        Return to dashboard
      </Link>
    </div>
  );
}