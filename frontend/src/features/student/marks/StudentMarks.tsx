import {
  useMemo,
  useState,
} from "react";

import {
  motion,
} from "framer-motion";

import {
  BookOpen,
  GraduationCap,
} from "lucide-react";

import Card from "../../../components/ui/Card";

import EmptyState from "../../../components/ui/EmptyState";

import Skeleton from "../../../components/ui/Skeleton";

import StatusPill from "../../../components/ui/StatusPill";

import { Select } from "../../../components/ui/Select";

import {
  useAuthStore,
} from "../../../lib/auth/store";

import {
  useCountUp,
} from "../../../lib/hooks/useCountUp";

import {
  useStudentMarks,
} from "./useStudentMarks";

// ============================================================
// HELPERS
// ============================================================

function examLabel(exam: {
  examType: string;
  internalNumber: number | null;
}) {
  return exam.examType ===
    "FINAL"
    ? "Final"
    : `Internal ${
        exam.internalNumber ?? ""
      }`;
}

// ============================================================
// COMPONENT
// ============================================================

export default function StudentMarks() {
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
  // FILTERS
  // ----------------------------------------------------------

  const [
    semester,
    setSemester,
  ] = useState<number>(0);

  const [
    subjectId,
    setSubjectId,
  ] = useState("");

  // ----------------------------------------------------------
  // DATA
  // ----------------------------------------------------------

  const {
    student,
    subjects,
    sgpa,
    subjectMarks,
    effectiveSemester,
  } =
    useStudentMarks(
      studentId,
      semester,
      subjectId,
    );

  // ----------------------------------------------------------
  // SGPA ANIMATION
  // ----------------------------------------------------------

  const animatedSgpa =
    useCountUp(
      sgpa.data?.sgpa ?? 0,
      900,
    );

  // ----------------------------------------------------------
  // AVAILABLE SEMESTERS
  // ----------------------------------------------------------

  const availableSemesters =
    useMemo(
      () =>
        Array.from(
          {
            length:
              student.data
                ?.semester ?? 0,
          },
          (_, index) =>
            index + 1,
        ),
      [
        student.data?.semester,
      ],
    );

  // ----------------------------------------------------------
  // SUBJECT NAME MAP
  // ----------------------------------------------------------

  const subjectNames =
    useMemo(
      () =>
        new Map(
          (
            subjects.data ??
            []
          ).map(
            (subject) => [
              subject.subjectId,
              subject.subjectName,
            ],
          ),
        ),
      [subjects.data],
    );

  // ----------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------

  if (!user) {
    return null;
  }

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  if (student.isLoading) {
    return (
      <div className="space-y-6">
        <div className="pl-6 sm:pl-8">
          <Skeleton className="h-4 w-28" />

          <Skeleton className="mt-2 h-9 w-56" />

          <Skeleton className="mt-2 h-4 w-96 max-w-full" />
        </div>

        <Card>
          <Skeleton className="h-44 w-full" />
        </Card>

        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <Skeleton className="h-52 w-full" />
          </Card>

          <Card>
            <Skeleton className="h-52 w-full" />
          </Card>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // ERROR
  // ----------------------------------------------------------

  if (
    student.isError ||
    !student.data
  ) {
    return (
      <EmptyState
        title="Unable to load marks"
        description="Your student information could not be retrieved from CampusHub."
        action={{
          label:
            "Try again",

          onClick: () => {
            void student.refetch();
          },
        }}
      />
    );
  }

  // ----------------------------------------------------------
  // SEMESTER
  // ----------------------------------------------------------

  const currentSemester =
    student.data.semester;

  const displaySemester =
    effectiveSemester ||
    currentSemester;

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ====================================================
          HEADER
          ==================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.35,
          ease: [
            0.16,
            1,
            0.3,
            1,
          ],
        }}
        className="pl-6 sm:pl-8"
      >
        <p className="text-body-sm font-medium text-primary-600">
          Academic Performance
        </p>

        <h1 className="mt-1 font-heading text-h1 text-heading">
          Marks & SGPA
        </h1>

        <p className="mt-1 max-w-2xl text-body-sm text-muted">
          Review semester performance and inspect the examination marks contributing to each subject.
        </p>
      </motion.div>

      {/* ====================================================
          SEMESTER SELECTOR
          ==================================================== */}

      <Card>
        <Select
          label="Semester"
          value={String(
            displaySemester,
          )}
          options={
            availableSemesters.map(
              (value) => ({
                value:
                  String(value),

                label:
                  `Semester ${value}${
                    value ===
                    currentSemester
                      ? " · Current"
                      : ""
                  }`,
              }),
            )
          }
          onChange={(
            event,
          ) => {
            const nextSemester =
              Number(
                event.target.value,
              );

            setSemester(
              nextSemester,
            );

            setSubjectId("");
          }}
        />
      </Card>

      {/* ====================================================
          SGPA + SUBJECT BREAKDOWN
          ==================================================== */}

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        {/* SGPA */}
        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.3,
            ease: [
              0.16,
              1,
              0.3,
              1,
            ],
          }}
        >
          <Card className="h-full bg-gradient-warm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-caption text-muted">
                  Semester{" "}
                  {displaySemester}
                </p>

                <p className="mt-3 font-heading text-5xl font-extrabold tracking-tight text-heading tabular-nums">
                  {sgpa.isLoading
                    ? "…"
                    : sgpa.isError ||
                        !sgpa.data
                      ? "—"
                      : animatedSgpa.toFixed(
                          2,
                        )}
                </p>

                <p className="mt-2 text-body-sm text-muted">
                  {sgpa.isError
                    ? "SGPA is not available yet."
                    : "Semester Grade Point Average"}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/50 text-primary-700">
                <GraduationCap className="h-7 w-7" />
              </div>
            </div>

            {sgpa.data && (
              <div className="mt-6 rounded-lg bg-white/40 p-4">
                <p className="text-caption text-muted">
                  Subjects counted
                </p>

                <p className="mt-1 font-heading text-xl font-bold text-heading tabular-nums">
                  {
                    sgpa.data
                      .subjectCount
                  }
                </p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Subject breakdown */}
        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.3,
            delay: 0.05,
            ease: [
              0.16,
              1,
              0.3,
              1,
            ],
          }}
        >
          <Card className="h-full">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <BookOpen className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-heading text-h3 text-heading">
                  Subject Breakdown
                </h2>

                <p className="mt-1 text-body-sm text-muted">
                  Select a subject to inspect its examination marks.
                </p>
              </div>
            </div>

            {sgpa.isLoading ? (
              <div className="mt-5 space-y-3">
                {Array.from(
                  {
                    length: 4,
                  },
                ).map(
                  (_, index) => (
                    <Skeleton
                      key={index}
                      className="h-14 w-full"
                    />
                  ),
                )}
              </div>
            ) : sgpa.isError ||
              !sgpa.data ? (
              <EmptyState
                className="mt-4"
                title="No semester marks available"
                description="There are no calculated subject scores for this semester yet."
              />
            ) : sgpa.data
                .subjects.length ===
              0 ? (
              <EmptyState
                className="mt-4"
                title="No subjects with marks"
                description="No subject totals are currently available for this semester."
              />
            ) : (
              <div className="mt-5 space-y-2">
                {sgpa.data.subjects.map(
                  (row) => {
                    const isSelected =
                      subjectId ===
                      row.subjectId;

                    return (
                      <motion.button
                        key={
                          row.subjectId
                        }
                        type="button"
                        whileTap={{
                          scale: 0.99,
                        }}
                        onClick={() =>
                          setSubjectId(
                            row.subjectId,
                          )
                        }
                        className={[
                          "flex w-full items-center justify-between gap-4 rounded-lg border p-4 text-left transition-all duration-150",
                          isSelected
                            ? "border-primary-500 bg-primary-50 shadow-sm"
                            : "border-neutral-200 hover:-translate-y-px hover:border-primary-200 hover:bg-primary-50/30",
                        ].join(
                          " ",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-heading">
                            {
                              subjectNames.get(
                                row.subjectId,
                              ) ??
                              row.subjectId
                            }
                          </span>

                          <span className="mt-1 block text-caption text-muted">
                            {
                              row.subjectId
                            }
                          </span>
                        </span>

                        <span className="shrink-0 text-right">
                          <span className="block font-heading text-lg font-bold text-heading tabular-nums">
                            {
                              row.subjectTotal
                            }
                          </span>

                          <span className="mt-1 block text-caption text-muted">
                            total
                          </span>
                        </span>
                      </motion.button>
                    );
                  },
                )}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* ====================================================
          SUBJECT EXAMINATION DETAIL
          ==================================================== */}

      {subjectId && (
        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.3,
            ease: [
              0.16,
              1,
              0.3,
              1,
            ],
          }}
        >
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-caption text-muted">
                  {
                    subjectId
                  }
                </p>

                <h2 className="mt-1 font-heading text-h2 text-heading">
                  {subjectNames.get(
                    subjectId,
                  ) ??
                    subjectId}
                </h2>

                <p className="mt-1 text-body-sm text-muted">
                  Semester{" "}
                  {
                    displaySemester
                  }{" "}
                  examination breakdown.
                </p>
              </div>

              {subjectMarks.data && (
                <StatusPill
                  status={
                    subjectMarks
                      .data
                      .allMarksAvailable
                      ? "Complete"
                      : "Pending"
                  }
                  variant={
                    subjectMarks
                      .data
                      .allMarksAvailable
                      ? "present"
                      : "pending"
                  }
                />
              )}
            </div>

            {subjectMarks.isLoading ? (
              <div className="mt-6 space-y-3">
                {Array.from(
                  {
                    length: 5,
                  },
                ).map(
                  (_, index) => (
                    <Skeleton
                      key={index}
                      className="h-12 w-full"
                    />
                  ),
                )}
              </div>
            ) : subjectMarks.isError ||
              !subjectMarks.data ? (
              <EmptyState
                className="mt-4"
                title="Subject marks unavailable"
                description="The examination marks for this subject could not be calculated yet."
              />
            ) : (
              <div className="mt-6 space-y-6">
                {/* ================================================
                    EXAMINATION TABLE
                    ================================================ */}

                <div className="overflow-hidden rounded-lg border border-neutral-200">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 bg-neutral-50 px-4 py-3 text-caption font-semibold uppercase tracking-wide text-muted">
                    <span>
                      Examination
                    </span>

                    <span>
                      Marks
                    </span>

                    <span>
                      Max
                    </span>
                  </div>

                  {subjectMarks.data
                    .examinations
                    .length ===
                  0 ? (
                    <div className="border-t border-neutral-100 px-4 py-6 text-center text-body-sm text-muted">
                      No examinations have been configured for this subject and semester.
                    </div>
                  ) : (
                    subjectMarks.data.examinations.map(
                      (exam) => (
                        <div
                          key={
                            exam.examId
                          }
                          className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 border-t border-neutral-100 px-4 py-3 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-heading">
                              {examLabel(
                                exam,
                              )}
                            </p>

                            <p className="mt-1 font-mono text-[11px] text-neutral-400">
                              {
                                exam.examId
                              }
                            </p>
                          </div>

                          <span className="font-semibold text-heading tabular-nums">
                            {exam.marksObtained ??
                              "Not entered"}
                          </span>

                          <span className="text-muted tabular-nums">
                            {
                              exam.maxMarks
                            }
                          </span>
                        </div>
                      ),
                    )
                  )}
                </div>

                {/* ================================================
                    CONTRIBUTIONS
                    ================================================ */}

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-neutral-50 p-4">
                    <p className="text-caption text-muted">
                      Internal Contribution
                    </p>

                    <p className="mt-2 font-heading text-xl font-bold text-heading tabular-nums">
                      {subjectMarks
                        .data
                        .internalContribution ==
                      null
                        ? "—"
                        : `${subjectMarks.data.internalContribution}/40`}
                    </p>

                    <p className="mt-1 text-caption text-muted">
                      {
                        subjectMarks
                          .data
                          .internalObtained
                      }{" "}
                      /{" "}
                      {
                        subjectMarks
                          .data
                          .internalMaximum
                      }{" "}
                      raw marks
                    </p>
                  </div>

                  <div className="rounded-lg bg-neutral-50 p-4">
                    <p className="text-caption text-muted">
                      Final Contribution
                    </p>

                    <p className="mt-2 font-heading text-xl font-bold text-heading tabular-nums">
                      {subjectMarks
                        .data
                        .finalContribution ==
                      null
                        ? "—"
                        : `${subjectMarks.data.finalContribution}/60`}
                    </p>

                    <p className="mt-1 text-caption text-muted">
                      {
                        subjectMarks
                          .data
                          .finalObtained
                      }{" "}
                      /{" "}
                      {
                        subjectMarks
                          .data
                          .finalMaximum
                      }{" "}
                      raw marks
                    </p>
                  </div>

                  <div className="rounded-lg bg-primary-50 p-4">
                    <p className="text-caption text-primary-700">
                      Subject Total
                    </p>

                    <p className="mt-2 font-heading text-xl font-bold text-primary-700 tabular-nums">
                      {subjectMarks
                        .data
                        .subjectTotal ==
                      null
                        ? "—"
                        : subjectMarks
                            .data
                            .subjectTotal}
                    </p>

                    <p className="mt-1 text-caption text-primary-700">
                      out of 100
                    </p>
                  </div>
                </div>

                {/* ================================================
                    INCOMPLETE STATE
                    ================================================ */}

                {!subjectMarks.data
                  .allMarksAvailable && (
                  <div className="rounded-lg border border-accent-200 bg-accent-50 p-4">
                    <p className="text-body-sm font-medium text-accent-900">
                      Some marks for this subject have not been entered yet.
                    </p>

                    <p className="mt-1 text-caption text-accent-800">
                      The final subject total will appear once all required examination marks are available.
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
}