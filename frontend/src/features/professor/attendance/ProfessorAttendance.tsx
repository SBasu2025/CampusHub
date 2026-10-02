
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  UserCheck,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import toast from "react-hot-toast";

import {
  useQueryClient,
} from "@tanstack/react-query";

import {
  Link,
  Navigate,
  useParams,
} from "react-router-dom";

import Card from "../../../components/ui/Card";

import Button from "../../../components/ui/Button";

import EmptyState from "../../../components/ui/EmptyState";

import Skeleton from "../../../components/ui/Skeleton";

import StatusPill from "../../../components/ui/StatusPill";

import {
  useAuthStore,
} from "../../../lib/auth/store";

import {
  markAttendance,
} from "../../../lib/api/endpoints/professors";

import {
  updateAttendance,
} from "../../../lib/api/endpoints/attendances";

import {
  getApiErrorMessage,
} from "../../../lib/utils/errors";

import {
  getSessionDateState,
} from "../../../lib/utils/classSession";

import {
  useProfessorAttendance,
} from "./useProfessorAttendance";

// ============================================================
// TYPES
// ============================================================

type AttendanceStatus =
  | "Present"
  | "Absent";

type Selection =
  | AttendanceStatus
  | undefined;

// ============================================================
// COMPONENT
// ============================================================

export default function ProfessorAttendance() {
  // ----------------------------------------------------------
  // ROUTE
  // ----------------------------------------------------------

  const {
    sessionId = "",
  } = useParams();

  // ----------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // QUERY DATA
  // ----------------------------------------------------------

  const query =
    useProfessorAttendance(
      professorId,
      sessionId,
    );

  // ----------------------------------------------------------
  // QUERY CLIENT
  // ----------------------------------------------------------

  const queryClient =
    useQueryClient();

  // ----------------------------------------------------------
  // FORM STATE
  // ----------------------------------------------------------

  const [
    selections,
    setSelections,
  ] = useState<
    Record<
      string,
      Selection
    >
  >({});

  const [
    existing,
    setExisting,
  ] = useState<
    Record<
      string,
      AttendanceStatus
    >
  >({});

  const [
    saving,
    setSaving,
  ] = useState(false);

  // ----------------------------------------------------------
  // LOAD EXISTING ATTENDANCE
  // ----------------------------------------------------------

  useEffect(() => {
    const nextExisting: Record<
      string,
      AttendanceStatus
    > = {};

    for (
      const row of
        query.attendance
          .data ?? []
    ) {
      const normalized =
        row.status
          .trim()
          .toLowerCase();

      if (
        normalized ===
          "present" ||
        normalized ===
          "absent"
      ) {
        nextExisting[
          row.student.studentId
        ] =
          normalized ===
          "present"
            ? "Present"
            : "Absent";
      }
    }

    setExisting(
      nextExisting,
    );

    setSelections(
      nextExisting,
    );
  }, [
    query.attendance.data,
  ]);

  // ----------------------------------------------------------
  // STUDENTS
  // ----------------------------------------------------------

  const students =
    query.students.data ??
    [];

  // ----------------------------------------------------------
  // COUNTS
  // ----------------------------------------------------------

  const counts =
    useMemo(() => {
      const values =
        Object.values(
          selections,
        );

      return {
        selected:
          values.filter(
            Boolean,
          ).length,

        present:
          values.filter(
            (
              value,
            ) =>
              value ===
              "Present",
          ).length,

        absent:
          values.filter(
            (
              value,
            ) =>
              value ===
              "Absent",
          ).length,
      };
    }, [
      selections,
    ]);

  // ----------------------------------------------------------
  // STATUS CHANGE
  // ----------------------------------------------------------

  const setStatus = (
    studentId: string,

    status: AttendanceStatus,
  ) => {
    if (!attendanceEditable) {
      return;
    }

    setSelections(
      (
        current,
      ) => ({
        ...current,

        [studentId]:
          status,
      }),
    );
  };

  // ----------------------------------------------------------
  // MARK ALL PRESENT
  // ----------------------------------------------------------

  const markAllPresent =
    () => {
      if (!attendanceEditable) {
        return;
      }

      setSelections(
        Object.fromEntries(
          students.map(
            (student) => [
              student.studentId,
              "Present" as const,
            ],
          ),
        ),
      );
    };

  // ----------------------------------------------------------
  // SAVE
  // ----------------------------------------------------------

  const handleSave =
    async () => {
      if (!attendanceEditable) {
        toast.error(
          "Professor attendance is locked after the scheduled date.",
        );

        return;
      }

      // ------------------------------------------------------
      // CHECK FOR UNMARKED STUDENTS
      // ------------------------------------------------------

      const unmarked =
        students.filter(
          (student) =>
            !selections[
              student.studentId
            ],
        );

      if (
        unmarked.length >
        0
      ) {
        toast.error(
          `Please mark ${
            unmarked.length
          } remaining student${
            unmarked.length ===
            1
              ? ""
              : "s"
          }.`,
        );

        return;
      }

      // ------------------------------------------------------
      // FIND CHANGED STUDENTS
      // ------------------------------------------------------

      const changed =
        students.filter(
          (student) =>
            selections[
              student.studentId
            ] &&
            selections[
              student.studentId
            ] !==
              existing[
                student.studentId
              ],
        );

      if (
        changed.length ===
        0
      ) {
        toast.success(
          "Attendance is already up to date.",
        );

        return;
      }

      setSaving(true);

      try {
        // ----------------------------------------------------
        // EXECUTE REQUESTS
        // ----------------------------------------------------

        const requestResults =
          await Promise.allSettled(
            changed.map(
              async (
                student,
              ) => {
                const status =
                  selections[
                    student.studentId
                  ] as AttendanceStatus;

                const result =
                  existing[
                    student.studentId
                  ]
                    ? await updateAttendance(
                        sessionId,
                        student.studentId,
                        status,
                      )
                    : await markAttendance(
                        professorId,
                        sessionId,
                        student.studentId,
                        status,
                      );

                return {
                  studentId:
                    student.studentId,

                  status,

                  result,
                };
              },
            ),
          );

        // ----------------------------------------------------
        // SUCCESSFUL RECORDS
        // ----------------------------------------------------

        const successful =
          requestResults.filter(
            (
              result,
            ) =>
              result.status ===
              "fulfilled",
          );

        // ----------------------------------------------------
        // FAILED RECORDS
        // ----------------------------------------------------

        const failed =
          requestResults.filter(
            (
              result,
            ) =>
              result.status ===
              "rejected",
          );

        // ----------------------------------------------------
        // UPDATE EXISTING BASELINE
        // ----------------------------------------------------
        //
        // This is important for partial failures.
        //
        // Example:
        //
        // 50 students
        // 49 succeed
        // 1 fails
        //
        // The next Save must retry only the failed student,
        // not create/update the other 49 again.
        // ----------------------------------------------------

        if (
          successful.length >
          0
        ) {
          setExisting(
            (
              current,
            ) => {
              const next = {
                ...current,
              };

              for (
                const result of
                  successful
              ) {
                if (
                  result.status !==
                  "fulfilled"
                ) {
                  continue;
                }

                next[
                  result.value
                    .studentId
                ] =
                  result.value
                    .status;
              }

              return next;
            },
          );
        }

        // ----------------------------------------------------
        // REFRESH SESSION ATTENDANCE
        // ----------------------------------------------------

        await Promise.all([
          query.attendance.refetch(),

          queryClient.invalidateQueries(
            {
              queryKey: [
                "attendance-session",
              ],
            },
          ),
        ]);

        // ----------------------------------------------------
        // REFRESH PROFESSOR SUBJECT STATS
        // ----------------------------------------------------

        await queryClient.invalidateQueries(
          {
            queryKey: [
              "professor-subject-stat",
              professorId,
            ],
          },
        );

        // ----------------------------------------------------
        // REFRESH PROFESSOR HISTORY
        // ----------------------------------------------------

        await queryClient.invalidateQueries(
          {
            queryKey: [
              "professor-sessions-history",
              professorId,
            ],
          },
        );

        // ----------------------------------------------------
        // REFRESH STUDENT ATTENDANCE
        // ----------------------------------------------------
        //
        // Attendance changes are visible to students too.
        // The invalidation is prefix-based so all affected
        // student attendance caches can become stale.
        // ----------------------------------------------------

        await queryClient.invalidateQueries(
          {
            queryKey: [
              "student-attendance",
            ],
          },
        );

        await queryClient.invalidateQueries(
          {
            queryKey: [
              "student-subject-attendance-summary",
            ],
          },
        );

        // ----------------------------------------------------
        // REFRESH DASHBOARDS
        // ----------------------------------------------------

        await queryClient.invalidateQueries(
          {
            queryKey: [
              "student-dashboard",
            ],
          },
        );

        // ----------------------------------------------------
        // FEEDBACK
        // ----------------------------------------------------

        if (
          failed.length ===
          0
        ) {
          toast.success(
            `${successful.length} attendance record${
              successful.length ===
              1
                ? ""
                : "s"
            } saved.`,
          );
        } else {
          const firstFailure =
            failed[0];

          const detail =
            firstFailure.status ===
            "rejected"
              ? getApiErrorMessage(
                  firstFailure.reason,
                  "One or more records failed.",
                )
              : "One or more records failed.";

          toast.error(
            `${successful.length} of ${requestResults.length} saved. ${failed.length} failed — ${detail}`,
          );
        }
      } finally {
        setSaving(false);
      }
    };

  // ----------------------------------------------------------
  // AUTH GUARD
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  if (
    query.session.isLoading ||
    query.students.isLoading ||
    query.attendance.isLoading
  ) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-5 w-24" />

          <Skeleton className="mt-3 h-8 w-80" />
        </div>

        <Card>
          <Skeleton className="h-80 w-full" />
        </Card>
      </div>
    );
  }

  // ----------------------------------------------------------
  // ERROR
  // ----------------------------------------------------------

  if (
    query.session.isError ||
    query.students.isError ||
    query.attendance.isError ||
    !query.session.data
  ) {
    return (
      <EmptyState
        title="Unable to load attendance"
        description="The selected session or student roster could not be loaded."
        action={{
          label: "Try again",

          onClick: () => {
            void query.session.refetch();

            void query.students.refetch();

            void query.attendance.refetch();
          },
        }}
      />
    );
  }

  // ----------------------------------------------------------
  // SESSION
  // ----------------------------------------------------------

  const session =
    query.session.data;

  // ----------------------------------------------------------
  // OWNERSHIP CHECK
  // ----------------------------------------------------------
  //
  // Backend enforces this too.
  //
  // This frontend check simply produces a clearer experience
  // instead of showing an attendance form for somebody else's
  // session.
  // ----------------------------------------------------------

  if (
    session.teaching.professor
      .profId !==
    professorId
  ) {
    return (
      <EmptyState
        title="Session not available"
        description="This class session does not belong to your teaching schedule."
        action={{
          label: "Back to attendance",

          onClick: () => {
            window.location.href =
              "/professor/attendance";
          },
        }}
      />
    );
  }

  // ----------------------------------------------------------
  // DATE STATE
  // ----------------------------------------------------------

  const dateState =
    getSessionDateState(
      session.day,
    );

  const attendanceEditable =
    dateState === "today";

  // ----------------------------------------------------------
  // DISPLAY VALUES
  // ----------------------------------------------------------

  const formattedDate =
    new Date(
      `${session.day}T00:00:00`,
    ).toLocaleDateString(
      undefined,
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    );

  const formatTime =
    (
      value: string,
    ) =>
      value.slice(
        0,
        5,
      );

  const subjectName =
    session.teaching.subject
      .subjectName;

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ====================================================
          HEADER
          ==================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to="/professor"
            className="inline-flex items-center gap-2 text-body-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />

            Back to dashboard
          </Link>

          <h1 className="mt-3 font-heading text-h1 text-heading">
            {subjectName}
          </h1>

          <p className="mt-1 text-body-sm text-muted">
            {formattedDate} ·{" "}
            {formatTime(
              session.startTime,
            )}
            –
            {formatTime(
              session.endTime,
            )}{" "}
            ·{" "}
            {
              session.course
                .courseName
            }{" "}
            · Section{" "}
            {
              session.section
            }
          </p>

          <p className="mt-1 font-mono text-caption text-neutral-400">
            {session.sessionId}
          </p>
        </div>

        {/* Date status */}
        <StatusPill
          status={
            dateState ===
            "today"
              ? "Today"
              : dateState ===
                  "past"
                ? "Past session"
                : "Upcoming session"
          }
          variant={
            dateState ===
            "today"
              ? "active"
              : dateState ===
                  "past"
                ? "inactive"
                : "pending"
          }
        />
      </div>

      {/* ====================================================
          PAST / UPCOMING NOTICE
          ==================================================== */}

      {dateState !==
        "today" && (
        <Card>
          <div className="rounded-md border border-accent-200 bg-accent-50 px-4 py-3">
            <p className="text-body-sm font-medium text-accent-800">
              {dateState ===
              "past"
                ? "This session has ended. Existing attendance is read-only for professors."
                : "This session is in the future. Attendance can only be entered on the scheduled date."}
            </p>
          </div>
        </Card>
      )}

      {/* ====================================================
          ROSTER
          ==================================================== */}

      <Card>
        <div className="flex flex-col gap-3 border-b border-default pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-heading text-h3 text-heading">
              Attendance Roster
            </h2>

            <p className="mt-1 text-body-sm text-muted">
              {attendanceEditable
                ? "Existing records are loaded automatically. You can mark or change attendance while the session date is today."
                : "Existing records are shown for reference. Professor attendance editing is locked outside the scheduled date."}
            </p>
          </div>

          <Button
            variant="secondary"
            type="button"
            onClick={
              markAllPresent
            }
            disabled={
              students.length === 0 ||
              !attendanceEditable
            }
          >
            <UserCheck className="h-4 w-4" />

            Mark all Present
          </Button>
        </div>

        {/* ==================================================
            COUNTERS
            ================================================== */}

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-md bg-primary-50 px-3 py-3 text-center">
            <p className="text-caption text-primary-700">
              Present
            </p>

            <p className="mt-1 font-heading text-xl font-bold text-primary-700 tabular-nums">
              {counts.present}
            </p>
          </div>

          <div className="rounded-md bg-danger-bg px-3 py-3 text-center">
            <p className="text-caption text-danger-text">
              Absent
            </p>

            <p className="mt-1 font-heading text-xl font-bold text-danger-text tabular-nums">
              {counts.absent}
            </p>
          </div>

          <div className="rounded-md bg-neutral-100 px-3 py-3 text-center">
            <p className="text-caption text-neutral-600">
              Unmarked
            </p>

            <p className="mt-1 font-heading text-xl font-bold text-neutral-700 tabular-nums">
              {Math.max(
                students.length -
                  counts.selected,
                0,
              )}
            </p>
          </div>
        </div>

        {/* ==================================================
            STUDENT LIST
            ================================================== */}

        <div className="mt-5 space-y-3">
          {students.length ===
          0 ? (
            <EmptyState
              title="No students in this roster"
              description="This session has no matching students for the course, semester and section."
            />
          ) : (
            students.map(
              (
                student,
                index,
              ) => {
                const status =
                  selections[
                    student.studentId
                  ];

                const originalStatus =
                  existing[
                    student.studentId
                  ];

                const changed =
                  status !==
                  originalStatus;

                return (
                  <motion.div
                    key={
                      student.studentId
                    }
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.25,
                      delay:
                        index *
                        0.02,
                      ease: [
                        0.16,
                        1,
                        0.3,
                        1,
                      ],
                    }}
                    className="rounded-lg border border-neutral-200 p-4 transition-colors duration-150 hover:bg-neutral-50"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      {/* Student */}
                      <div className="min-w-0">
                        <p className="font-heading text-body-sm font-semibold text-heading">
                          {
                            student.studentName
                          }
                        </p>

                        <p className="mt-1 text-caption text-muted">
                          {
                            student.studentId
                          }{" "}
                          ·{" "}
                          {
                            student.course
                              .courseName
                          }{" "}
                          · Section{" "}
                          {
                            student.section
                          }
                        </p>
                      </div>

                      {/* Controls */}
                      <div className="flex flex-wrap items-center gap-2">
                        {originalStatus && (
                          <StatusPill
                            status="Saved"
                            variant={
                              originalStatus ===
                              "Present"
                                ? "present"
                                : "absent"
                            }
                            animateChange={
                              changed
                            }
                          />
                        )}

                        {/* Present */}
                        <button
                          type="button"
                          onClick={() =>
                            setStatus(
                              student.studentId,
                              "Present",
                            )
                          }
                          aria-pressed={
                            status ===
                            "Present"
                          }
                          className={[
                            "min-w-24 rounded-md border px-3 py-2 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-300 active:scale-[0.97]",

                            status ===
                            "Present"
                              ? "border-primary-500 bg-primary-50 text-primary-700 shadow-sm"
                              : "border-neutral-200 text-neutral-500 hover:bg-primary-50",
                            !attendanceEditable &&
                              "cursor-not-allowed opacity-60 hover:bg-transparent",
                          ].join(
                            " ",
                          )}
                        >
                          Present
                        </button>

                        {/* Absent */}
                        <button
                          type="button"
                          onClick={() =>
                            setStatus(
                              student.studentId,
                              "Absent",
                            )
                          }
                          aria-pressed={
                            status ===
                            "Absent"
                          }
                          className={[
                            "min-w-24 rounded-md border px-3 py-2 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30 active:scale-[0.97]",

                            status ===
                            "Absent"
                              ? "border-danger bg-danger-bg text-danger-text shadow-sm"
                              : "border-neutral-200 text-neutral-500 hover:bg-danger-bg",
                            !attendanceEditable &&
                              "cursor-not-allowed opacity-60 hover:bg-transparent",
                          ].join(
                            " ",
                          )}
                        >
                          Absent
                        </button>

                        {/* Unsaved indicator */}
                        {changed &&
                          status && (
                            <span className="text-caption font-medium text-accent-700">
                              Unsaved
                            </span>
                          )}
                      </div>
                    </div>
                  </motion.div>
                );
              },
            )
          )}
        </div>

        {/* ==================================================
            SAVE FOOTER
            ================================================== */}

        <div className="mt-5 flex flex-col gap-3 border-t border-default pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body-sm text-muted">
            {counts.selected}/
            {students.length}{" "}
            students marked
          </p>

          <Button
            loading={saving}
            type="button"
            onClick={() => {
              void handleSave();
            }}
            disabled={
              students.length === 0 ||
              !attendanceEditable
            }
          >
            <CheckCircle2 className="h-4 w-4" />

            Save Attendance
          </Button>
        </div>
      </Card>
    </div>
  );
}
