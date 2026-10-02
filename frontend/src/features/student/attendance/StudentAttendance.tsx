import {
  useMemo,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  ChevronDown,
  ClipboardCheck,
} from "lucide-react";

import {
  format,
  parseISO,
} from "date-fns";

import AttendanceDonutChart from "../../../components/charts/AttendanceDonutChart";

import Card from "../../../components/ui/Card";

import EmptyState from "../../../components/ui/EmptyState";

import Skeleton from "../../../components/ui/Skeleton";

import StatusPill from "../../../components/ui/StatusPill";

import {
  toAttendanceDonutData,
} from "../../../lib/utils/charts";

import {
  useAuthStore,
} from "../../../lib/auth/store";

import {
  useStudentAttendance,
} from "./useStudentAttendance";

// ============================================================
// TYPES
// ============================================================

interface SubjectAttendanceView {
  subjectId: string;

  subjectName: string;

  courseName: string;

  present: number;

  absent: number;

  percentage: number;

  rows: ReturnType<
    typeof useStudentAttendance
  >["attendance"]["data"];

  isLoading: boolean;

  isError: boolean;
}

// ============================================================
// COMPONENT
// ============================================================

export default function StudentAttendance() {
  // ----------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------

  const user =
    useAuthStore(
      (state) =>
        state.user,
    );

  const studentId =
    user?.role ===
    "STUDENT"
      ? user.id
      : "";

  // ----------------------------------------------------------
  // DATA
  // ----------------------------------------------------------

  const {
    attendance,
    selectedSubjects,
    subjectSummaries,
  } =
    useStudentAttendance(
      studentId,
    );

  // ----------------------------------------------------------
  // ACCORDION
  // ----------------------------------------------------------

  const [
    expandedSubjectId,
    setExpandedSubjectId,
  ] =
    useState<
      string | null
    >(null);

  // ----------------------------------------------------------
  // SELECTED SUBJECTS
  // ----------------------------------------------------------

  const selected =
    selectedSubjects.data ??
    [];

  // ----------------------------------------------------------
  // SUMMARY MAP
  // ----------------------------------------------------------
  //
  // Do not depend on array indexes remaining stable.
  // Map the fetched summaries by subject ID.
  // ----------------------------------------------------------

  const summaryBySubject =
    useMemo(() => {
      const map =
        new Map<
          string,
          {
            present: number;
            absent: number;
            percentage: number;
            isLoading: boolean;
            isError: boolean;
          }
        >();

      selected.forEach(
        (
          selection,
          index,
        ) => {
          const subjectId =
            selection.subject
              .subjectId;

          const query =
            subjectSummaries[
              index
            ];

          map.set(
            subjectId,
            {
              present:
                query?.data
                  ?.presentSessions ??
                0,

              absent:
                query?.data
                  ?.absentSessions ??
                0,

              percentage:
                query?.data
                  ?.attendancePercentage ??
                0,

              isLoading:
                query?.isLoading ??
                false,

              isError:
                query?.isError ??
                false,
            },
          );
        },
      );

      return map;
    }, [
      selected,
      subjectSummaries,
    ]);

  // ----------------------------------------------------------
  // SUBJECT VIEWS
  // ----------------------------------------------------------

  const subjectViews =
    useMemo<
      SubjectAttendanceView[]
    >(() => {
      const attendanceRows =
        attendance.data ??
        [];

      return selected.map(
        (
          selection,
        ) => {
          const subject =
            selection.subject;

          const subjectId =
            subject.subjectId;

          const summary =
            summaryBySubject.get(
              subjectId,
            );

          const rows =
            attendanceRows
              .filter(
                (row) =>
                  row.classSession
                    .teaching
                    .subject
                    .subjectId ===
                  subjectId,
              )
              .sort(
                (
                  first,
                  second,
                ) => {
                  const dateCompare =
                    second.classSession.day.localeCompare(
                      first.classSession
                        .day,
                    );

                  if (
                    dateCompare !==
                    0
                  ) {
                    return dateCompare;
                  }

                  return second.classSession.startTime.localeCompare(
                    first.classSession
                      .startTime,
                  );
                },
              );

          return {
            subjectId,

            subjectName:
              subject.subjectName,

            courseName:
              subject.course
                .courseName,

            present:
              summary
                ?.present ??
              0,

            absent:
              summary
                ?.absent ??
              0,

            percentage:
              summary
                ?.percentage ??
              0,

            rows,

            isLoading:
              summary
                ?.isLoading ??
              false,

            isError:
              summary
                ?.isError ??
              false,
          };
        },
      );
    }, [
      attendance.data,
      selected,
      summaryBySubject,
    ]);

  // ----------------------------------------------------------
  // OVERALL
  // ----------------------------------------------------------

  const overall =
    useMemo(() => {
      const present =
        subjectViews.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.present,
          0,
        );

      const absent =
        subjectViews.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.absent,
          0,
        );

      const total =
        present + absent;

      return {
        present,

        absent,

        percentage:
          total > 0
            ? Math.round(
                (present /
                  total) *
                  100,
              )
            : 0,
      };
    }, [
      subjectViews,
    ]);

  // ----------------------------------------------------------
  // QUERY STATE
  // ----------------------------------------------------------

  const summaryLoading =
    subjectSummaries.some(
      (
        query,
      ) =>
        query.isLoading,
    );

  const summaryError =
    subjectSummaries.some(
      (
        query,
      ) =>
        query.isError,
    );

  // ----------------------------------------------------------
  // AUTH GUARD
  // ----------------------------------------------------------

  if (!user) {
    return null;
  }

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  if (
    attendance.isLoading ||
    selectedSubjects.isLoading ||
    summaryLoading
  ) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-4 w-24" />

          <Skeleton className="mt-2 h-9 w-56" />

          <Skeleton className="mt-2 h-4 w-80" />
        </div>

        {/* Overall chart */}
        <Card>
          <div className="flex flex-col items-center">
            <Skeleton className="h-7 w-28" />

            <Skeleton className="mt-2 h-4 w-72 max-w-full" />

            <Skeleton className="mt-5 h-72 w-72 rounded-full" />
          </div>
        </Card>

        {/* Subject cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {Array.from({
            length: 4,
          }).map(
            (_, index) => (
              <Card
                key={index}
              >
                <Skeleton className="h-56 w-full" />
              </Card>
            ),
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // ERROR
  // ----------------------------------------------------------

  if (
    attendance.isError ||
    selectedSubjects.isError ||
    summaryError
  ) {
    return (
      <EmptyState
        title="Unable to load attendance"
        description="Your attendance information could not be retrieved from CampusHub."
        action={{
          label:
            "Try again",

          onClick: () => {
            void attendance.refetch();

            void selectedSubjects.refetch();

            void Promise.all(
              subjectSummaries.map(
                (
                  query,
                ) =>
                  query.refetch(),
              ),
            );
          },
        }}
      />
    );
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ====================================================
          HEADER
          ==================================================== */}

      <div className="pl-6 sm:pl-8">
        <p className="text-body-sm font-medium text-primary-600">
          Academic Progress
        </p>

        <h1 className="mt-1 font-heading text-h1 text-heading">
          Attendance
        </h1>

        <p className="mt-1 max-w-2xl text-body-sm text-muted">
          Overall attendance, subject-wise performance and the dated sessions behind each record.
        </p>
      </div>

      {/* ====================================================
          OVERALL
          ==================================================== */}

      <Card>
        <div className="flex flex-col items-center text-center">
          <h2 className="font-heading text-h2 text-heading">
            Overall
          </h2>

          <p className="mt-1 max-w-xl text-body-sm text-muted">
            Combined attendance across all of your selected subjects.
          </p>

          <div className="mt-5 w-full">
            <AttendanceDonutChart
              data={
                toAttendanceDonutData(
                  overall.present,
                  overall.absent,
                )
              }
              percentage={
                overall.percentage
              }
              caption="Overall Attendance"
              size="lg"
            />
          </div>
        </div>
      </Card>

      {/* ====================================================
          SUBJECTS
          ==================================================== */}

      {subjectViews.length ===
      0 ? (
        <EmptyState
          icon={
            <ClipboardCheck className="h-6 w-6" />
          }
          title="No subjects selected"
          description="Select subjects first to see attendance information here."
        />
      ) : (
        <motion.div
          variants={{
            hidden: {},

            show: {
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-5 md:grid-cols-2"
        >
          {subjectViews.map(
            (
              item,
            ) => {
              const isOpen =
                expandedSubjectId ===
                item.subjectId;

              return (
                <motion.div
                  key={
                    item.subjectId
                  }
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: 12,
                    },

                    show: {
                      opacity: 1,
                      y: 0,

                      transition: {
                        duration: 0.3,
                        ease: [
                          0.16,
                          1,
                          0.3,
                          1,
                        ],
                      },
                    },
                  }}
                >
                  <Card className="h-full">
                    {/* ========================================
                        SUBJECT HEADER
                        ======================================== */}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-caption text-muted">
                          {
                            item.subjectId
                          }
                        </p>

                        <h2 className="mt-1 font-heading text-h3 text-heading">
                          {
                            item.subjectName
                          }
                        </h2>

                        <p className="mt-1 text-body-sm text-muted">
                          {
                            item.courseName
                          }
                        </p>
                      </div>

                      <AttendanceDonutChart
                        data={
                          toAttendanceDonutData(
                            item.present,
                            item.absent,
                          )
                        }
                        percentage={
                          item.percentage
                        }
                        caption="Subject"
                        size="sm"
                      />
                    </div>

                    {/* ========================================
                        SESSION COUNT
                        ======================================== */}

                    <div className="mt-2 flex items-center justify-center gap-2 text-caption text-muted">
                      <span>
                        {item.present +
                          item.absent}{" "}
                        recorded sessions
                      </span>
                    </div>

                    {/* ========================================
                        ACCORDION TRIGGER
                        ======================================== */}

                    <button
                      type="button"
                      onClick={() => {
                        setExpandedSubjectId(
                          isOpen
                            ? null
                            : item.subjectId,
                        );
                      }}
                      aria-expanded={
                        isOpen
                      }
                      className="mt-4 flex w-full items-center justify-between rounded-md bg-neutral-50 px-3 py-2.5 text-body-sm font-semibold text-heading transition-colors duration-150 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-300"
                    >
                      <span>
                        View Sessions
                      </span>

                      <motion.span
                        animate={{
                          rotate:
                            isOpen
                              ? 180
                              : 0,
                        }}
                        transition={{
                          duration:
                            0.2,
                          ease: "easeInOut",
                        }}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </motion.span>
                    </button>

                    {/* ========================================
                        SESSION LIST
                        ======================================== */}

                    <AnimatePresence
                      initial={false}
                    >
                      {isOpen && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            height: 0,
                          }}
                          animate={{
                            opacity: 1,
                            height:
                              "auto",
                          }}
                          exit={{
                            opacity: 0,
                            height: 0,
                          }}
                          transition={{
                            duration:
                              0.25,
                            ease: [
                              0.16,
                              1,
                              0.3,
                              1,
                            ],
                          }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 overflow-hidden rounded-md border border-neutral-200">
                            {item.rows
                              ?.length ===
                            0 ? (
                              <div className="px-4 py-5 text-body-sm text-muted">
                                No attendance sessions have been recorded for this subject yet.
                              </div>
                            ) : (
                              item.rows?.map(
                                (
                                  row,
                                ) => {
                                  const isoDate =
                                    row
                                      .classSession
                                      .day;

                                  let formattedDate =
                                    isoDate;

                                  try {
                                    formattedDate =
                                      format(
                                        parseISO(
                                          isoDate,
                                        ),
                                        "d MMM yyyy",
                                      );
                                  } catch {
                                    // Keep ISO string when a legacy/invalid
                                    // date is returned by the backend.
                                  }

                                  return (
                                    <div
                                      key={`${row.id.sessionId}-${row.id.studentId}`}
                                      className="flex flex-col gap-2 border-b border-neutral-100 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                      <div className="min-w-0">
                                        <p className="font-heading text-body-sm font-semibold text-heading">
                                          {formattedDate}
                                        </p>

                                        <p className="mt-1 text-caption text-muted">
                                          {
                                            row
                                              .classSession
                                              .startTime
                                          .slice(
                                            0,
                                            5,
                                          )}
                                          –
                                          {
                                            row
                                              .classSession
                                              .endTime
                                          .slice(
                                            0,
                                            5,
                                          )}
                                          {" · "}
                                          {
                                            row
                                              .classSession
                                              .sessionId
                                          }
                                        </p>
                                      </div>

                                      <StatusPill
                                        status={
                                          row.status
                                        }
                                      />
                                    </div>
                                  );
                                },
                              )
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            },
          )}
        </motion.div>
      )}
    </div>
  );
}
