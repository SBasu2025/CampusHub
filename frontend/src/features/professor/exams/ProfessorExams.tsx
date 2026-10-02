import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";

import toast from "react-hot-toast";

import Card from "../../../components/ui/Card";

import Button from "../../../components/ui/Button";

import EmptyState from "../../../components/ui/EmptyState";

import Skeleton from "../../../components/ui/Skeleton";

import Stepper from "../../../components/ui/Stepper";

import { Select } from "../../../components/ui/Select";

import {
  useAuthStore,
} from "../../../lib/auth/store";

import {
  getApiErrorMessage,
} from "../../../lib/utils/errors";

import {
  useProfessorExams,
} from "./useProfessorExams";

// ============================================================
// WORKFLOW STEPS
// ============================================================
//
// The professor does NOT:
//   - choose a section
//   - type their name
//   - confirm their identity again
//
// The professor is already authenticated through the normal
// CampusHub login.
//
// The administrator configured the examination with:
//
//   Department
//   Course
//   Subject
//   Semester
//   Section
//   Examination
//   Assigned Professor
//
// Therefore the selected Examination is the source of truth
// for the section. The backend verifies the authenticated
// professor against that examination.
// ============================================================

const steps = [
  {
    id: "subject",
    label: "Select Subject",
    description:
      "Choose a teaching assignment.",
  },

  {
    id: "exam",
    label: "Select Examination",
    description:
      "Choose the assessment.",
  },

  {
    id: "marks",
    label: "Enter Marks",
    description:
      "Enter marks for the assigned students.",
  },

  {
    id: "review",
    label: "Review & Submit",
    description:
      "Confirm the final submission.",
  },
];

// ============================================================
// HELPERS
// ============================================================

function examLabel(exam: {
  examType: string;
  internalNumber:
    | number
    | null;
}) {
  return exam.examType ===
    "FINAL"
    ? "Final Exam"
    : `Internal ${
        exam.internalNumber ?? ""
      }`;
}

// ============================================================
// COMPONENT
// ============================================================

export default function ProfessorExams() {
  // ----------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------

  const user =
    useAuthStore(
      (state) =>
        state.user,
    );

  /**
   * Professor identity comes directly from the authenticated
   * CampusHub session.
   *
   * There is intentionally NO professor-name field and
   * NO secondary identity-confirmation step.
   */
  const professorId =
    user?.role ===
    "PROFESSOR"
      ? user.id
      : "";

  // ----------------------------------------------------------
  // WORKFLOW STATE
  // ----------------------------------------------------------

  const [
    step,
    setStep,
  ] = useState(0);

  const [
    subjectId,
    setSubjectId,
  ] = useState("");

  const [
    examId,
    setExamId,
  ] = useState("");

  const [
    marks,
    setMarks,
  ] = useState<
    Record<string, string>
  >({});

  const [
    saving,
    setSaving,
  ] = useState(false);

  // ----------------------------------------------------------
  // QUERIES
  // ----------------------------------------------------------
  //
  // Only the authenticated professor ID, selected subject and
  // selected examination ID are passed to the hook.
  //
  // No:
  //   professorName
  //   section
  //   identityConfirmed
  //
  // are passed because they are no longer part of the workflow.
  // ----------------------------------------------------------

  const query =
    useProfessorExams(
      professorId,
      subjectId,
      examId,
    );

  // ----------------------------------------------------------
  // SELECTED EXAMINATION
  // ----------------------------------------------------------

  const selectedExam =
    query.examinations.data?.find(
      (exam) =>
        exam.examId ===
        examId,
    );

  // ----------------------------------------------------------
  // ROSTER
  // ----------------------------------------------------------

  const roster =
    query.students.data ??
    [];

  // ----------------------------------------------------------
  // EXISTING MARKS
  // ----------------------------------------------------------

  const existingMarks =
    useMemo(
      () =>
        new Map(
          (
            query.marks.data ??
            []
          ).map(
            (item) => [
              item.student
                .studentId,
              item.marksObtained,
            ],
          ),
        ),
      [
        query.marks.data,
      ],
    );

  // ----------------------------------------------------------
  // ENTERED COUNT
  // ----------------------------------------------------------

  const enteredCount =
    roster.filter(
      (
        student,
      ) => {
        const value =
          marks[
            student.studentId
          ];

        return (
          value !==
            undefined &&
          value !== ""
        );
      },
    ).length;

  const everyEntered =
    roster.length > 0 &&
    enteredCount ===
      roster.length;

  // ----------------------------------------------------------
  // LOAD EXISTING MARKS
  // ----------------------------------------------------------
  //
  // When an examination already has marks, populate the
  // inputs with those existing values.
  // ----------------------------------------------------------

  useEffect(() => {
    const currentMarks =
      query.marks.data ?? [];

    if (
      currentMarks.length ===
      0
    ) {
      return;
    }

    setMarks(
      (
        current,
      ) => {
        const next = {
          ...current,
        };

        for (
          const item of
            currentMarks
        ) {
          next[
            item.student
              .studentId
          ] = String(
            item.marksObtained,
          );
        }

        return next;
      },
    );
  }, [
    query.marks.data,
  ]);

  // ==========================================================
  // SELECTION HANDLERS
  // ==========================================================

  function chooseSubject(
    value: string,
  ) {
    setSubjectId(value);

    setExamId("");

    setMarks({});

    setStep(
      value ? 1 : 0,
    );
  }

  function chooseExam(
    value: string,
  ) {
    setExamId(value);

    setMarks({});

    setStep(
      value ? 2 : 1,
    );
  }

  // ==========================================================
  // MARK INPUT
  // ==========================================================

  function updateMark(
    studentId: string,
    value: string,
  ) {
    // --------------------------------------------------------
    // CLEAR
    // --------------------------------------------------------

    if (value === "") {
      setMarks(
        (
          current,
        ) => ({
          ...current,

          [studentId]:
            "",
        }),
      );

      return;
    }

    // --------------------------------------------------------
    // FORMAT
    // --------------------------------------------------------
    //
    // Up to two decimal places.
    // No negative values.
    // --------------------------------------------------------

    if (
      !/^\d*(\.\d{0,2})?$/.test(
        value,
      )
    ) {
      return;
    }

    const numeric =
      Number(value);

    if (
      !Number.isFinite(
        numeric,
      )
    ) {
      return;
    }

    // --------------------------------------------------------
    // MAX MARKS
    // --------------------------------------------------------

    if (
      selectedExam &&
      numeric >
        selectedExam.maxMarks
    ) {
      toast.error(
        `Marks cannot exceed ${selectedExam.maxMarks}.`,
      );

      return;
    }

    // --------------------------------------------------------
    // SAVE LOCAL VALUE
    // --------------------------------------------------------

    setMarks(
      (
        current,
      ) => ({
        ...current,

        [studentId]:
          value,
      }),
    );
  }

  // ==========================================================
  // SAVE MARKS
  // ==========================================================

  async function saveMarks() {
    if (
      !selectedExam ||
      !everyEntered
    ) {
      toast.error(
        "Please enter marks for every student.",
      );

      return;
    }

    setSaving(true);

    try {
      // ------------------------------------------------------
      // PREPARE ENTRIES
      // ------------------------------------------------------

      const entries =
        roster.map(
          (
            student,
          ) => ({
            studentId:
              student.studentId,

            marksObtained:
              Number(
                marks[
                  student
                    .studentId
                ],
              ),
          }),
        );

      // ------------------------------------------------------
      // DETERMINE EXISTING RECORDS
      // ------------------------------------------------------

      const existingIds =
        new Set(
          existingMarks.keys(),
        );

      // ------------------------------------------------------
      // NO EXISTING MARKS
      // ------------------------------------------------------
      //
      // Use the batch endpoint when this examination has no
      // marks entered yet.
      // ------------------------------------------------------

      if (
        existingIds.size ===
        0
      ) {
        await query.createBatch.mutateAsync(
          {
            entries,
          },
        );
      }

      // ------------------------------------------------------
      // EXISTING / MIXED MARKS
      // ------------------------------------------------------
      //
      // Existing StudentMark:
      //   UPDATE
      //
      // Missing StudentMark:
      //   CREATE
      // ------------------------------------------------------

      else {
        const operations =
          roster.map(
            (
              student,
            ) => {
              const value =
                Number(
                  marks[
                    student
                      .studentId
                  ],
                );

              if (
                existingIds.has(
                  student.studentId,
                )
              ) {
                return query.updateSingle.mutateAsync(
                  {
                    studentId:
                      student.studentId,

                    marksObtained:
                      value,
                  },
                );
              }

              return query.createSingle.mutateAsync(
                {
                  studentId:
                    student.studentId,

                  marksObtained:
                    value,
                },
              );
            },
          );

        await Promise.all(
          operations,
        );
      }

      // ------------------------------------------------------
      // REFRESH CURRENT EXAM MARKS
      // ------------------------------------------------------

      await query.marks.refetch();

      // ------------------------------------------------------
      // SUCCESS
      // ------------------------------------------------------

      toast.success(
        `Marks saved for ${roster.length} students.`,
      );

      setStep(4);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to save examination marks.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================================
  // RESET
  // ==========================================================

  function resetWorkflow() {
    setStep(0);

    setSubjectId("");

    setExamId("");

    setMarks({});
  }

  // ==========================================================
  // AUTH GUARD
  // ==========================================================

  if (!user) {
    return null;
  }

  // ==========================================================
  // SUBJECT SELECTION VALIDATION
  // ==========================================================

  const canNextFromSubject =
    Boolean(
      subjectId,
    );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-6">
      {/* ====================================================
          HEADER
          ==================================================== */}

      <div className="pl-6 sm:pl-8">
        <p className="text-body-sm font-medium text-primary-600">
          Academic Assessment
        </p>

        <h1 className="mt-1 font-heading text-h1 text-heading">
          Exams
        </h1>

        <p className="mt-1 max-w-2xl text-body-sm text-muted">
          Enter and review examination marks for the students assigned to your examinations.
        </p>
      </div>

      {/* ====================================================
          STEPPER
          ==================================================== */}

      {step < 4 && (
        <Card>
          <Stepper
            steps={steps}
            currentStep={step}
          />
        </Card>
      )}

      {/* ====================================================
          ACTIVE WORKFLOW
          ==================================================== */}

      <AnimatePresence
        mode="wait"
      >
        {step < 4 && (
          <motion.div
            key={step}
            initial={{
              opacity: 0,
              x: 40,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -40,
            }}
            transition={{
              duration: 0.25,
              ease: [
                0.16,
                1,
                0.3,
                1,
              ],
            }}
          >
            <Card>

              {/* ==================================================
                  STEP 0 — SUBJECT
                  ================================================== */}

              {step === 0 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-heading text-h2 text-heading">
                      Select Subject
                    </h2>

                    <p className="mt-1 text-body-sm text-muted">
                      Choose one of your teaching assignments.
                    </p>
                  </div>

                  {query.subjects
                    .isLoading ? (
                    <Skeleton
                      className="h-12 w-full"
                    />
                  ) : query.subjects
                      .isError ? (
                    <EmptyState
                      title="Unable to load subjects"
                      description="Your teaching assignments could not be retrieved."
                    />
                  ) : (
                    <Select
                      label="Subject"
                      required
                      value={
                        subjectId
                      }
                      onChange={(
                        event,
                      ) =>
                        chooseSubject(
                          event.target
                            .value,
                        )
                      }
                      options={[
                        {
                          value: "",
                          label:
                            "Choose a subject",
                        },

                        ...(
                          query
                            .subjects
                            .data ??
                          []
                        ).map(
                          (
                            item,
                          ) => ({
                            value:
                              item
                                .subject
                                .subjectId,

                            label:
                              `${item.subject.subjectName} — ${item.subject.course.courseName}`,
                          }),
                        ),
                      ]}
                    />
                  )}

                  <div className="flex justify-end">
                    <Button
                      disabled={
                        !canNextFromSubject
                      }
                      onClick={() =>
                        setStep(
                          1,
                        )
                      }
                    >
                      Next

                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ==================================================
                  STEP 1 — EXAMINATION
                  ================================================== */}

              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-heading text-h2 text-heading">
                      Select Examination
                    </h2>

                    <p className="mt-1 text-body-sm text-muted">
                      Choose an examination that has been assigned to you by the administrator.
                    </p>
                  </div>

                  {query.examinations
                    .isLoading ? (
                    <Skeleton
                      className="h-36 w-full"
                    />
                  ) : query.examinations
                      .isError ? (
                    <EmptyState
                      title="Unable to load examinations"
                      description="The examinations assigned to this subject could not be retrieved."
                      action={{
                        label:
                          "Try again",

                        onClick:
                          () =>
                            void query.examinations.refetch(),
                      }}
                    />
                  ) : (
                    <>
                      {(
                        query
                          .examinations
                          .data ??
                        []
                      ).length ===
                      0 ? (
                        <EmptyState
                          title="No examinations assigned"
                          description="There are no examinations currently assigned to you for this subject."
                        />
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {(
                            query
                              .examinations
                              .data ??
                            []
                          ).map(
                            (
                              exam,
                            ) => (
                              <button
                                key={
                                  exam.examId
                                }
                                type="button"
                                onClick={() =>
                                  chooseExam(
                                    exam.examId,
                                  )
                                }
                                className={[
                                  "rounded-lg border p-4 text-left transition-all duration-150",

                                  examId ===
                                  exam.examId
                                    ? "border-primary-500 bg-primary-50 shadow-sm"
                                    : "border-neutral-200 hover:-translate-y-px hover:border-primary-200 hover:bg-primary-50/30",
                                ].join(
                                  " ",
                                )}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="font-heading text-body-sm font-semibold text-heading">
                                    {examLabel(
                                      exam,
                                    )}
                                  </span>

                                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-caption font-semibold text-muted">
                                    Max{" "}
                                    {
                                      exam.maxMarks
                                    }
                                  </span>
                                </div>

                                <p className="mt-2 text-caption text-muted">
                                  {
                                    exam
                                      .subject
                                      .subjectName
                                  }{" "}
                                  · Semester{" "}
                                  {
                                    exam.semester
                                  }{" "}
                                  · Section{" "}
                                  {
                                    exam.section
                                  }
                                </p>

                                <p className="mt-1 font-mono text-[11px] text-neutral-400">
                                  {
                                    exam.examId
                                  }
                                </p>
                              </button>
                            ),
                          )}
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex justify-start">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setStep(
                          0,
                        )
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />

                      Back
                    </Button>
                  </div>
                </div>
              )}

              {/* ==================================================
                  STEP 2 — ENTER MARKS
                  ================================================== */}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="font-heading text-h2 text-heading">
                        Enter Marks
                      </h2>

                      <p className="mt-1 text-body-sm text-muted">
                        {selectedExam
                          ? `${examLabel(
                              selectedExam,
                            )} · Semester ${selectedExam.semester} · Section ${selectedExam.section} · Maximum ${selectedExam.maxMarks} marks`
                          : ""}
                      </p>
                    </div>

                    <span className="rounded-full bg-primary-50 px-3 py-1.5 text-caption font-semibold text-primary-700">
                      {
                        enteredCount
                      }{" "}
                      of{" "}
                      {
                        roster.length
                      }{" "}
                      entered
                    </span>
                  </div>

                  {query.students
                    .isLoading ? (
                    <Skeleton
                      className="h-72 w-full"
                    />
                  ) : query.students
                      .isError ? (
                    <EmptyState
                      title="Unable to load students"
                      description="The students assigned to this examination section could not be retrieved."
                      action={{
                        label:
                          "Try again",

                        onClick:
                          () =>
                            void query.students.refetch(),
                      }}
                    />
                  ) : roster.length ===
                    0 ? (
                    <EmptyState
                      title="No students in assigned section"
                      description="No students currently match the course, semester and section configured for this examination."
                    />
                  ) : (
                    <div className="space-y-3">
                      {roster.map(
                        (
                          student,
                        ) => (
                          <div
                            key={
                              student.studentId
                            }
                            className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 transition-colors duration-150 hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between"
                          >
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
                                · Semester{" "}
                                {
                                  student.semester
                                }{" "}
                                · Section{" "}
                                {
                                  student.section
                                }
                              </p>
                            </div>

                            <input
                              type="text"
                              inputMode="decimal"
                              value={
                                marks[
                                  student
                                    .studentId
                                ] ??
                                ""
                              }
                              onChange={(
                                event,
                              ) =>
                                updateMark(
                                  student.studentId,
                                  event
                                    .target
                                    .value,
                                )
                              }
                              placeholder="Marks"
                              className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-sm text-heading outline-none transition-all duration-150 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-100 sm:w-32"
                              aria-label={`Marks for ${student.studentName}`}
                            />
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setStep(
                          1,
                        )
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />

                      Back
                    </Button>

                    <Button
                      disabled={
                        !everyEntered
                      }
                      onClick={() =>
                        setStep(
                          3,
                        )
                      }
                    >
                      Review Marks

                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ==================================================
                  STEP 3 — REVIEW
                  ================================================== */}

              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-heading text-h2 text-heading">
                      Review & Submit
                    </h2>

                    <p className="mt-1 text-body-sm text-muted">
                      Check the entries before the marks are submitted.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg bg-neutral-50 p-4">
                      <p className="text-caption text-muted">
                        Subject
                      </p>

                      <p className="mt-1 text-sm font-semibold text-heading">
                        {
                          selectedExam
                            ?.subject
                            .subjectName ??
                          "—"
                        }
                      </p>
                    </div>

                    <div className="rounded-lg bg-neutral-50 p-4">
                      <p className="text-caption text-muted">
                        Examination
                      </p>

                      <p className="mt-1 text-sm font-semibold text-heading">
                        {selectedExam
                          ? examLabel(
                              selectedExam,
                            )
                          : "—"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-neutral-50 p-4">
                      <p className="text-caption text-muted">
                        Semester
                      </p>

                      <p className="mt-1 text-sm font-semibold text-heading">
                        {
                          selectedExam
                            ?.semester ??
                          "—"
                        }
                      </p>
                    </div>

                    <div className="rounded-lg bg-neutral-50 p-4">
                      <p className="text-caption text-muted">
                        Section
                      </p>

                      <p className="mt-1 text-sm font-semibold text-heading">
                        {
                          selectedExam
                            ?.section ??
                          "—"
                        }
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-primary-100 bg-primary-50/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-caption text-primary-700">
                          Assigned examination
                        </p>

                        <p className="mt-1 text-sm font-semibold text-heading">
                          Only the students belonging to the configured examination section are shown below.
                        </p>
                      </div>

                      <span className="font-mono text-[11px] text-primary-700">
                        {
                          selectedExam
                            ?.examId ??
                          "—"
                        }
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
                    {roster.map(
                      (
                        student,
                      ) => (
                        <div
                          key={
                            student.studentId
                          }
                          className="flex items-center justify-between gap-3 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-heading">
                              {
                                student.studentName
                              }
                            </p>

                            <p className="mt-1 font-mono text-[11px] text-neutral-400">
                              {
                                student.studentId
                              }
                            </p>
                          </div>

                          <span className="shrink-0 font-heading text-lg font-bold text-heading tabular-nums">
                            {
                              marks[
                                student
                                  .studentId
                              ]
                            }
                          </span>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="flex justify-between">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setStep(
                          2,
                        )
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />

                      Back
                    </Button>

                    <Button
                      disabled={
                        !everyEntered
                      }
                      loading={
                        saving
                      }
                      onClick={() =>
                        void saveMarks()
                      }
                    >
                      Confirm & Save

                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================
          SUCCESS STATE — STEP 4
          ==================================================== */}

      {step === 4 && (
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            scale: 1,
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
          className="mx-auto max-w-2xl"
        >
          <Card className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h2 className="mt-5 font-heading text-2xl font-bold text-heading">
              Marks saved for{" "}
              {
                roster.length
              }{" "}
              students
            </h2>

            <p className="mt-2 text-body-sm text-muted">
              The examination marks were submitted successfully.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                variant="secondary"
                onClick={() =>
                  setStep(3)
                }
              >
                Review Again
              </Button>

              <Button
                onClick={
                  resetWorkflow
                }
              >
                <ClipboardCheck className="h-4 w-4" />

                Start Another Examination
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}