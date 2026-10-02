import {
  useMemo,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  ClipboardList,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import toast from "react-hot-toast";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import DataTable from "../../../components/ui/DataTable";
import EmptyState from "../../../components/ui/EmptyState";
import { Input } from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import Skeleton from "../../../components/ui/Skeleton";
import StatusPill from "../../../components/ui/StatusPill";

import type {
  Examination,
} from "../../../lib/api/types";

import {
  useDepartments,
} from "../departments/useDepartments";

import {
  useCourses,
} from "../courses/useCourses";

import {
  useSubjects,
} from "../subjects/useSubjects";

import {
  useProfessors,
} from "../professors/useProfessors";

import {
  getApiErrorMessage,
} from "../../../lib/utils/errors";

import {
  useConfigureExaminations,
  useDeleteExamination,
  useExaminations,
  useUpdateExamination,
} from "./useExaminations";

// ============================================================
// HELPERS
// ============================================================

function examLabel(
  examination: Examination,
): string {
  if (
    examination.examType ===
    "FINAL"
  ) {
    return "Final Exam";
  }

  return `Internal ${
    examination.internalNumber ??
    ""
  }`;
}

function positiveInteger(
  value: string,
): boolean {
  const parsed =
    Number(value);

  return (
    Number.isInteger(
      parsed,
    ) &&
    parsed > 0
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function AdminExams() {
  // ----------------------------------------------------------
  // REFERENCE QUERIES
  // ----------------------------------------------------------

  const departmentsQuery =
    useDepartments();

  const examinationsQuery =
    useExaminations();

  // ----------------------------------------------------------
  // CREATE-WIZARD FILTERS
  // ----------------------------------------------------------

  const [
    departmentId,
    setDepartmentId,
  ] = useState("");

  const [
    courseId,
    setCourseId,
  ] = useState("");

  const [
    subjectId,
    setSubjectId,
  ] = useState("");

  const [
    semester,
    setSemester,
  ] = useState("");

  const [
    section,
    setSection,
  ] = useState("");

  const [
    numberOfInternals,
    setNumberOfInternals,
  ] = useState("1");

  const [
    internalMaxMarks,
    setInternalMaxMarks,
  ] = useState("");

  const [
    finalMaxMarks,
    setFinalMaxMarks,
  ] = useState("");

  const [
    internalProfessorIds,
    setInternalProfessorIds,
  ] = useState<
    string[]
  >([""]);

  const [
    finalProfessorId,
    setFinalProfessorId,
  ] = useState("");

  // ----------------------------------------------------------
  // SUCCESS SUMMARY
  // ----------------------------------------------------------

  const [
    configuredExaminations,
    setConfiguredExaminations,
  ] =
    useState<
      Examination[] | null
    >(null);

  // ----------------------------------------------------------
  // EDIT STATE
  // ----------------------------------------------------------

  const [
    editingExamination,
    setEditingExamination,
  ] =
    useState<Examination | null>(
      null,
    );

  const [
    editMaxMarks,
    setEditMaxMarks,
  ] = useState("");

  const [
    editProfessorId,
    setEditProfessorId,
  ] = useState("");

  // ----------------------------------------------------------
  // DELETE STATE
  // ----------------------------------------------------------

  const [
    deletingExamination,
    setDeletingExamination,
  ] =
    useState<Examination | null>(
      null,
    );

  // ----------------------------------------------------------
  // CASCADING CREATE QUERIES
  // ----------------------------------------------------------

  const coursesForDepartmentQuery =
    useCourses(
      departmentId,
    );

  const subjectsForCourseQuery =
    useSubjects(
      courseId,
    );

  const selectedCourse =
    useMemo(
      () =>
        (
          coursesForDepartmentQuery.data ??
          []
        ).find(
          (course) =>
            course.courseId ===
            courseId,
        ),
      [
        courseId,
        coursesForDepartmentQuery.data,
      ],
    );

  /*
   * Professors are scoped to the department associated
   * with the selected course.
   *
   * If the course hasn't been resolved yet, the
   * selected department is used as the fallback.
   */
  const professorDepartmentId =
    selectedCourse
      ?.department.deptId ??
    departmentId;

  const professorsForCreateQuery =
    useProfessors(
      professorDepartmentId,
    );

  // ----------------------------------------------------------
  // EDIT PROFESSOR QUERY
  // ----------------------------------------------------------

  /*
   * An examination already knows its subject,
   * course and department, so editing can independently
   * load professors from the correct department.
   */
  const editProfessorDepartmentId =
    editingExamination
      ?.subject.course.department
      .deptId ?? "";

  const professorsForEditQuery =
    useProfessors(
      editProfessorDepartmentId,
    );

  // ----------------------------------------------------------
  // MUTATIONS
  // ----------------------------------------------------------

  const configureMutation =
    useConfigureExaminations();

  const updateMutation =
    useUpdateExamination();

  const deleteMutation =
    useDeleteExamination();

  // ----------------------------------------------------------
  // DEPARTMENT OPTIONS
  // ----------------------------------------------------------

  const departmentOptions =
    useMemo(
      () =>
        (
          departmentsQuery.data ??
          []
        )
          .slice()
          .sort(
            (a, b) =>
              a.deptName.localeCompare(
                b.deptName,
              ),
          )
          .map(
            (department) => ({
              value:
                department.deptId,
              label:
                `${department.deptName} (${department.deptId})`,
            }),
          ),
      [
        departmentsQuery.data,
      ],
    );

  // ----------------------------------------------------------
  // COURSE OPTIONS
  // ----------------------------------------------------------

  const courseOptions =
    useMemo(
      () =>
        (
          coursesForDepartmentQuery.data ??
          []
        )
          .slice()
          .sort(
            (a, b) =>
              a.courseName.localeCompare(
                b.courseName,
              ),
          )
          .map(
            (course) => ({
              value:
                course.courseId,
              label:
                `${course.courseName} (${course.courseId})`,
            }),
          ),
      [
        coursesForDepartmentQuery.data,
      ],
    );

  // ----------------------------------------------------------
  // SUBJECT OPTIONS
  // ----------------------------------------------------------

  const subjectOptions =
    useMemo(
      () =>
        (
          subjectsForCourseQuery.data ??
          []
        )
          .slice()
          .sort(
            (a, b) =>
              a.subjectName.localeCompare(
                b.subjectName,
              ),
          )
          .map(
            (subject) => ({
              value:
                subject.subjectId,
              label:
                `${subject.subjectName} (${subject.subjectId})`,
            }),
          ),
      [
        subjectsForCourseQuery.data,
      ],
    );

  // ----------------------------------------------------------
  // PROFESSOR OPTIONS FOR CREATE
  // ----------------------------------------------------------

  const createProfessorOptions =
    useMemo(
      () =>
        (
          professorsForCreateQuery.data ??
          []
        )
          .filter(
            (professor) =>
              professor.active,
          )
          .slice()
          .sort(
            (a, b) =>
              a.professorName.localeCompare(
                b.professorName,
              ),
          )
          .map(
            (professor) => ({
              value:
                professor.profId,
              label:
                `${professor.professorName} (${professor.profId})`,
            }),
          ),
      [
        professorsForCreateQuery.data,
      ],
    );

  // ----------------------------------------------------------
  // PROFESSOR OPTIONS FOR EDIT
  // ----------------------------------------------------------

  const editProfessorOptions =
    useMemo(
      () =>
        (
          professorsForEditQuery.data ??
          []
        )
          /*
           * Keep the currently assigned professor available
           * even if that professor has subsequently become
           * inactive.
           */
          .filter(
            (professor) =>
              professor.active ||
              professor.profId ===
                editProfessorId,
          )
          .slice()
          .sort(
            (a, b) =>
              a.professorName.localeCompare(
                b.professorName,
              ),
          )
          .map(
            (professor) => ({
              value:
                professor.profId,
              label:
                `${professor.professorName} (${professor.profId})`,
            }),
          ),
      [
        editProfessorId,
        professorsForEditQuery.data,
      ],
    );

  // ----------------------------------------------------------
  // NUMBER OF INTERNALS
  // ----------------------------------------------------------

  const internals =
    Math.max(
      0,
      Number(
        numberOfInternals,
      ) || 0,
    );

  // ----------------------------------------------------------
  // FORM VALIDATION
  // ----------------------------------------------------------

  const canSubmitCreate =
    Boolean(
      departmentId &&
        courseId &&
        subjectId,
    ) &&
    positiveInteger(
      semester,
    ) &&
    Boolean(section) &&
    positiveInteger(
      numberOfInternals,
    ) &&
    positiveInteger(
      internalMaxMarks,
    ) &&
    positiveInteger(
      finalMaxMarks,
    ) &&
    internalProfessorIds.length ===
      internals &&
    internalProfessorIds.every(
      (professorId) =>
        Boolean(
          professorId,
        ),
    ) &&
    Boolean(
      finalProfessorId,
    );

  // ----------------------------------------------------------
  // CREATE — DEPARTMENT CHANGE
  // ----------------------------------------------------------

  function changeDepartment(
    value: string,
  ) {
    setDepartmentId(value);

    /*
     * Department change invalidates every
     * child selection.
     */
    setCourseId("");
    setSubjectId("");
    setSemester("");
    setSection("");

    setInternalProfessorIds(
      Array.from(
        {
          length: internals,
        },
        () => "",
      ),
    );

    setFinalProfessorId("");
  }

  // ----------------------------------------------------------
  // CREATE — COURSE CHANGE
  // ----------------------------------------------------------

  function changeCourse(
    value: string,
  ) {
    setCourseId(value);

    /*
     * Course change invalidates the
     * selected subject and professor assignments.
     */
    setSubjectId("");
    setSemester("");
    setSection("");

    setInternalProfessorIds(
      Array.from(
        {
          length: internals,
        },
        () => "",
      ),
    );

    setFinalProfessorId("");
  }

  // ----------------------------------------------------------
  // CREATE — SUBJECT CHANGE
  // ----------------------------------------------------------

  function changeSubject(
    value: string,
  ) {
    setSubjectId(value);

    /*
     * A different subject means the old professor
     * assignments cannot safely be carried over.
     */
    setInternalProfessorIds(
      Array.from(
        {
          length: internals,
        },
        () => "",
      ),
    );

    setFinalProfessorId("");
  }

  // ----------------------------------------------------------
  // CREATE — SEMESTER CHANGE
  // ----------------------------------------------------------

  function changeSemester(
    value: string,
  ) {
    if (
      value !== "" &&
      !/^\d+$/.test(value)
    ) {
      return;
    }

    setSemester(value);
    setSection("");
  }

  // ----------------------------------------------------------
  // CREATE — INTERNAL COUNT CHANGE
  // ----------------------------------------------------------

  function changeNumberOfInternals(
    value: string,
  ) {
    /*
     * Allow only digits or an empty field while
     * the user is typing.
     */
    if (
      value !== "" &&
      !/^\d+$/.test(
        value,
      )
    ) {
      return;
    }

    setNumberOfInternals(
      value,
    );

    const nextCount =
      Math.max(
        0,
        Number(value) || 0,
      );

    /*
     * Preserve existing assignments where possible.
     * If the count increases, append empty rows.
     * If it decreases, truncate the extra rows.
     */
    setInternalProfessorIds(
      (current) => {
        return Array.from(
          {
            length:
              nextCount,
          },
          (
            _,
            index,
          ) =>
            current[
              index
            ] ?? "",
        );
      },
    );
  }

  // ----------------------------------------------------------
  // CREATE — RESET
  // ----------------------------------------------------------

  function resetCreateForm() {
    setDepartmentId("");
    setCourseId("");
    setSubjectId("");
    setSemester("");
    setSection("");
    setNumberOfInternals(
      "1",
    );
    setInternalMaxMarks("");
    setFinalMaxMarks("");
    setInternalProfessorIds([
      "",
    ]);
    setFinalProfessorId("");

    setConfiguredExaminations(
      null,
    );
  }

  // ----------------------------------------------------------
  // CREATE — PROFESSOR ASSIGNMENT
  // ----------------------------------------------------------

  function setInternalProfessor(
    index: number,
    professorId: string,
  ) {
    setInternalProfessorIds(
      (current) => {
        const next = [
          ...current,
        ];

        next[index] =
          professorId;

        return next;
      },
    );
  }

  // ----------------------------------------------------------
  // CREATE — SUBMIT
  // ----------------------------------------------------------

  async function handleConfigure() {
    if (
      !canSubmitCreate
    ) {
      toast.error(
        "Please complete every examination configuration field.",
      );

      return;
    }

    try {
      const result =
        await configureMutation.mutateAsync(
          {
            /*
             * IMPORTANT:
             * No exam IDs are generated here.
             * ExaminationController generates them.
             */
            subjectId,

            semester:
              Number(
                semester,
              ),

            section,

            numberOfInternals:
              Number(
                numberOfInternals,
              ),

            internalMaxMarks:
              Number(
                internalMaxMarks,
              ),

            finalMaxMarks:
              Number(
                finalMaxMarks,
              ),

            internalProfessorIds,

            finalProfessorId,
          },
        );

      setConfiguredExaminations(
        result,
      );

      toast.success(
        `${result.length} examinations configured successfully.`,
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
        ),
      );
    }
  }

  // ----------------------------------------------------------
  // EDIT — OPEN
  // ----------------------------------------------------------

  function openEdit(
    examination: Examination,
  ) {
    setEditingExamination(
      examination,
    );

    setEditMaxMarks(
      String(
        examination.maxMarks,
      ),
    );

    setEditProfessorId(
      examination
        .professor.profId,
    );
  }

  // ----------------------------------------------------------
  // EDIT — SAVE
  // ----------------------------------------------------------

  async function saveEdit() {
    if (
      !editingExamination
    ) {
      return;
    }

    if (
      !positiveInteger(
        editMaxMarks,
      )
    ) {
      toast.error(
        "Maximum marks must be greater than 0.",
      );

      return;
    }

    if (
      !editProfessorId
    ) {
      toast.error(
        "Please select a professor.",
      );

      return;
    }

    try {
      await updateMutation.mutateAsync(
        {
          examId:
            editingExamination.examId,

          /*
           * The backend update endpoint accepts a complete
           * Examination representation. We preserve the
           * existing subject, semester, exam type and
           * internal number, while allowing the admin to
           * change maximum marks and assigned professor.
           */
          request: {
            subject: {
              subjectId:
                editingExamination
                  .subject
                  .subjectId,
            },

            semester:
              editingExamination.semester,

            section:
              editingExamination.section,

            examType:
              editingExamination.examType,

            internalNumber:
              editingExamination.internalNumber,

            maxMarks:
              Number(
                editMaxMarks,
              ),

            professor: {
              profId:
                editProfessorId,
            },
          },
        },
      );

      toast.success(
        "Examination updated successfully.",
      );

      setEditingExamination(
        null,
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
        ),
      );
    }
  }

  // ----------------------------------------------------------
  // DELETE — CONFIRM
  // ----------------------------------------------------------

  async function confirmDelete() {
    if (
      !deletingExamination
    ) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(
        deletingExamination.examId,
      );

      toast.success(
        "Examination deleted successfully.",
      );

      setDeletingExamination(
        null,
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
        ),
      );
    }
  }

  // ----------------------------------------------------------
  // EXAMINATION TABLE
  // ----------------------------------------------------------

  const examinationColumns =
    [
      {
        key: "examId",
        header: "Exam ID",
        accessor:
          "examId" as const,
        sortable: true,

        render: (
          examination: Examination,
        ) => (
          <span className="font-mono text-[11px] font-medium text-heading">
            {
              examination.examId
            }
          </span>
        ),
      },

      {
        key: "subject",
        header: "Subject",

        render: (
          examination: Examination,
        ) => (
          <div>
            <p className="font-medium text-heading">
              {
                examination
                  .subject
                  .subjectName
              }
            </p>

            <p className="mt-1 text-caption text-muted">
              {
                examination
                  .subject
                  .subjectId
              }
            </p>
          </div>
        ),
      },

      {
        key: "semester",
        header: "Semester",
        accessor:
          "semester" as const,
        sortable: true,

        render: (
          examination: Examination,
        ) => (
          <span className="font-medium text-heading tabular-nums">
            {
              examination.semester
            }
          </span>
        ),
      },

      {
        key: "section",
        header: "Section",

        render: (
          examination: Examination,
        ) => (
          <span className="font-medium text-heading">
            Section {examination.section}
          </span>
        ),
      },

      {
        key: "type",
        header: "Type",

        render: (
          examination: Examination,
        ) => (
          <StatusPill
            status={examLabel(
              examination,
            )}
            variant="exam"
          />
        ),
      },

      {
        key: "internalNumber",
        header: "Internal No.",

        render: (
          examination: Examination,
        ) => (
          <span className="text-body-sm text-heading">
            {
              examination
                .internalNumber ??
              "—"
            }
          </span>
        ),
      },

      {
        key: "maxMarks",
        header: "Max Marks",
        accessor:
          "maxMarks" as const,
        sortable: true,

        render: (
          examination: Examination,
        ) => (
          <span className="font-medium text-heading tabular-nums">
            {
              examination.maxMarks
            }
          </span>
        ),
      },

      {
        key: "professor",
        header: "Professor",

        render: (
          examination: Examination,
        ) => (
          <div>
            <p className="font-medium text-heading">
              {
                examination
                  .professor
                  .professorName
              }
            </p>

            <p className="mt-1 text-caption text-muted">
              {
                examination
                  .professor
                  .profId
              }
            </p>
          </div>
        ),
      },

      {
        key: "actions",
        header: "Actions",

        render: (
          examination: Examination,
        ) => (
          <div className="flex items-center gap-1.5">
            <Button
              variant="icon"
              type="button"
              aria-label={`Edit ${examLabel(
                examination,
              )}`}
              onClick={(
                event,
              ) => {
                event.stopPropagation();

                openEdit(
                  examination,
                );
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              variant="icon"
              type="button"
              aria-label={`Delete ${examLabel(
                examination,
              )}`}
              onClick={(
                event,
              ) => {
                event.stopPropagation();

                setDeletingExamination(
                  examination,
                );
              }}
            >
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          </div>
        ),
      },
    ];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-6">
      {/* ======================================================
          PAGE HEADER
          ====================================================== */}

      <div className="pl-4 sm:pl-6 lg:pl-8">
        <h1 className="font-heading text-h1 text-heading">
          Examinations
        </h1>

        <p className="mt-1 text-body-sm text-muted">
          Configure internal and final
          examinations, assign professors,
          and audit existing examination
          setup.
        </p>
      </div>

      {/* ======================================================
          CONFIGURATION CARD
          ====================================================== */}

      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <ClipboardList className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-heading text-h2 text-heading">
              Configure Examinations
            </h2>

            <p className="mt-1 max-w-3xl text-body-sm text-muted">
              Set up all Internal examinations
              and the Final examination for
              one subject and semester in a
              single operation.
            </p>
          </div>
        </div>

        {/* ==================================================
            CASCADING DEPARTMENT / COURSE / SUBJECT
            ================================================== */}

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {/* ------------------------------------------------
              DEPARTMENT
              ------------------------------------------------ */}

          <Select
            label="Department"
            value={
              departmentId
            }
            required
            onChange={(
              event,
            ) =>
              changeDepartment(
                event.target
                  .value,
              )
            }
            options={[
              {
                value: "",
                label:
                  "Choose a department",
              },
              ...departmentOptions,
            ]}
            disabled={
              departmentsQuery.isLoading
            }
          />

          {/* ------------------------------------------------
              COURSE
              ------------------------------------------------ */}

          <AnimatePresence
            initial={false}
          >
            {departmentId && (
              <motion.div
                key="course-select"
                initial={{
                  opacity: 0,
                  height: 0,
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                }}
                transition={{
                  duration: 0.2,
                }}
              >
                <Select
                  label="Course"
                  value={
                    courseId
                  }
                  required
                  onChange={(
                    event,
                  ) =>
                    changeCourse(
                      event.target
                        .value,
                    )
                  }
                  options={[
                    {
                      value:
                        "",
                      label:
                        "Choose a course",
                    },
                    ...courseOptions,
                  ]}
                  disabled={
                    coursesForDepartmentQuery.isLoading
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ------------------------------------------------
              SUBJECT
              ------------------------------------------------ */}

          <AnimatePresence
            initial={false}
          >
            {courseId && (
              <motion.div
                key="subject-select"
                initial={{
                  opacity: 0,
                  height: 0,
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                }}
                transition={{
                  duration: 0.2,
                }}
              >
                <Select
                  label="Subject"
                  value={
                    subjectId
                  }
                  required
                  onChange={(
                    event,
                  ) =>
                    changeSubject(
                      event.target
                        .value,
                    )
                  }
                  options={[
                    {
                      value:
                        "",
                      label:
                        "Choose a subject",
                    },
                    ...subjectOptions,
                  ]}
                  disabled={
                    subjectsForCourseQuery.isLoading
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ==================================================
            CONFIGURATION FORM
            ================================================== */}

        <AnimatePresence
          initial={false}
        >
          {subjectId && (
            <motion.div
              key="configuration-form"
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              transition={{
                duration: 0.25,
              }}
              className="overflow-hidden"
            >
              <div className="mt-6 space-y-6 border-t border-default pt-6">
                {/* ------------------------------------------
                    GENERAL EXAMINATION SETTINGS
                    ------------------------------------------ */}

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <Input
                    label="Semester"
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={
                      semester
                    }
                    onChange={(
                      event,
                    ) =>
                      changeSemester(
                        event.target
                          .value,
                      )
                    }
                    placeholder="e.g. 5"
                  />

                  <Input
                    label="Section"
                    type="text"
                    required
                    value={section}
                    maxLength={10}
                    onChange={(event) =>
                      setSection(
                        event.target.value.trim().toUpperCase(),
                      )
                    }
                    placeholder="e.g. A"
                  />

                  <Input
                    label="Number of Internal Exams"
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={
                      numberOfInternals
                    }
                    onChange={(
                      event,
                    ) =>
                      changeNumberOfInternals(
                        event.target
                          .value,
                      )
                    }
                    hint="One professor assignment row is created per internal exam."
                  />

                  <Input
                    label="Internal Max Marks"
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={
                      internalMaxMarks
                    }
                    onChange={(
                      event,
                    ) =>
                      setInternalMaxMarks(
                        event.target
                          .value,
                      )
                    }
                    placeholder="e.g. 20"
                  />

                  <Input
                    label="Final Max Marks"
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={
                      finalMaxMarks
                    }
                    onChange={(
                      event,
                    ) =>
                      setFinalMaxMarks(
                        event.target
                          .value,
                      )
                    }
                    placeholder="e.g. 60"
                  />
                </div>

                {/* ------------------------------------------
                    PROFESSOR ASSIGNMENTS
                    ------------------------------------------ */}

                <div>
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="font-heading text-h3 text-heading">
                        Professor
                        Assignments
                      </h3>

                      <p className="mt-1 text-body-sm text-muted">
                        Assign exactly one
                        active professor
                        to every
                        examination.
                      </p>
                    </div>

                    {!professorsForCreateQuery.isLoading &&
                      createProfessorOptions.length ===
                        0 && (
                        <span className="text-caption text-danger-text">
                          No active
                          professors
                          found for
                          this
                          department.
                        </span>
                      )}
                  </div>

                  <div className="space-y-3">
                    {/* ----------------------------------------
                        INTERNAL ROWS
                        ---------------------------------------- */}

                    <AnimatePresence
                      initial={false}
                    >
                      {Array.from(
                        {
                          length:
                            internals,
                        },
                        (
                          _,
                          index,
                        ) => (
                          <motion.div
                            key={`internal-${index + 1}`}
                            layout
                            initial={{
                              opacity: 0,
                              y: -8,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            exit={{
                              opacity: 0,
                              y: -8,
                            }}
                            transition={{
                              duration: 0.2,
                            }}
                            className="grid gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-[160px_1fr] sm:items-end"
                          >
                            <div>
                              <p className="text-caption text-muted">
                                Examination
                              </p>

                              <p className="mt-1 font-heading text-body-sm font-semibold text-heading">
                                Internal{" "}
                                {
                                  index +
                                  1
                                }
                              </p>
                            </div>

                            <Select
                              label={`Professor for Internal ${
                                index +
                                1
                              }`}
                              value={
                                internalProfessorIds[
                                  index
                                ] ??
                                ""
                              }
                              onChange={(
                                event,
                              ) =>
                                setInternalProfessor(
                                  index,
                                  event
                                    .target
                                    .value,
                                )
                              }
                              options={[
                                {
                                  value:
                                    "",
                                  label:
                                    "Choose professor",
                                },
                                ...createProfessorOptions,
                              ]}
                              disabled={
                                professorsForCreateQuery.isLoading
                              }
                            />
                          </motion.div>
                        ),
                      )}
                    </AnimatePresence>

                    {/* ----------------------------------------
                        FINAL EXAM ROW
                        ---------------------------------------- */}

                    <motion.div
                      layout
                      className="grid gap-3 rounded-lg border border-primary-100 bg-primary-50/60 p-4 sm:grid-cols-[160px_1fr] sm:items-end"
                    >
                      <div>
                        <p className="text-caption text-muted">
                          Examination
                        </p>

                        <p className="mt-1 font-heading text-body-sm font-semibold text-heading">
                          Final Exam
                        </p>
                      </div>

                      <Select
                        label="Professor for Final Exam"
                        value={
                          finalProfessorId
                        }
                        onChange={(
                          event,
                        ) =>
                          setFinalProfessorId(
                            event
                              .target
                              .value,
                          )
                        }
                        options={[
                          {
                            value:
                              "",
                            label:
                              "Choose professor",
                          },
                          ...createProfessorOptions,
                        ]}
                        disabled={
                          professorsForCreateQuery.isLoading
                        }
                      />
                    </motion.div>
                  </div>
                </div>

                {/* ------------------------------------------
                    SUBMIT AREA
                    ------------------------------------------ */}

                <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-heading text-body-sm font-semibold text-heading">
                      Ready to configure?
                    </p>

                    <p className="mt-1 text-caption text-muted">
                      This creates{" "}
                      {
                        internals
                      }{" "}
                      Internal
                      examination
                      {internals ===
                      1
                        ? ""
                        : "s"}{" "}
                      plus one
                      Final
                      examination.
                      The backend
                      generates
                      all exam
                      IDs.
                    </p>
                  </div>

                  <Button
                    loading={
                      configureMutation.isPending
                    }
                    disabled={
                      !canSubmitCreate
                    }
                    onClick={() =>
                      void handleConfigure()
                    }
                  >
                    <Plus className="h-4 w-4" />

                    Configure
                    Examinations
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* ======================================================
          CREATED CONFIGURATION SUMMARY
          ====================================================== */}

      {configuredExaminations && (
        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-h2 text-heading">
                  Configuration
                  Created
                </h2>

                <p className="mt-1 text-body-sm text-muted">
                  The backend generated
                  the examination IDs
                  and returned the
                  created
                  configuration.
                </p>
              </div>

              <Button
                variant="secondary"
                onClick={
                  resetCreateForm
                }
              >
                Configure
                Another
                Subject
              </Button>
            </div>

            <div className="mt-5">
              <DataTable
                data={
                  configuredExaminations
                }
                columns={[
                  {
                    key: "examId",
                    header:
                      "Exam ID",

                    render: (
                      exam: Examination,
                    ) => (
                      <span className="font-mono text-[11px] text-heading">
                        {
                          exam.examId
                        }
                      </span>
                    ),
                  },

                  {
                    key: "type",
                    header:
                      "Examination",

                    render: (
                      exam: Examination,
                    ) => (
                      <StatusPill
                        status={examLabel(
                          exam,
                        )}
                        variant="exam"
                      />
                    ),
                  },

                  {
                    key: "subject",
                    header:
                      "Subject",

                    render: (
                      exam: Examination,
                    ) =>
                      exam
                        .subject
                        .subjectName,
                  },

                  {
                    key: "semester",
                    header:
                      "Semester",

                    render: (
                      exam: Examination,
                    ) =>
                      exam.semester,
                  },

                  {
                    key: "maxMarks",
                    header:
                      "Max Marks",

                    render: (
                      exam: Examination,
                    ) =>
                      exam.maxMarks,
                  },

                  {
                    key: "professor",
                    header:
                      "Professor",

                    render: (
                      exam: Examination,
                    ) =>
                      exam
                        .professor
                        .professorName,
                  },
                ]}
                rowKey="examId"
                pageSize={10}
                emptyTitle="No examinations created"
                emptyMessage="The backend did not return any created examinations."
              />
            </div>
          </Card>
        </motion.div>
      )}

      {/* ======================================================
          EXISTING EXAMINATION CONFIGURATION
          ====================================================== */}

      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary-50 text-secondary-700">
            <ClipboardList className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-heading text-h2 text-heading">
              Examination
              Configuration
              Audit
            </h2>

            <p className="mt-1 text-body-sm text-muted">
              Browse every configured
              examination. Edit updates
              the professor or maximum
              marks while preserving the
              existing examination
              identity and type. Delete
              removes the examination and
              its associated student marks
              on the backend.
            </p>
          </div>
        </div>

        <div className="mt-5">
          {examinationsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from(
                {
                  length: 6,
                },
              ).map(
                (
                  _,
                  index,
                ) => (
                  <Skeleton
                    key={index}
                    className="h-14 w-full"
                  />
                ),
              )}
            </div>
          ) : examinationsQuery.isError ? (
            <EmptyState
              title="Unable to load examinations"
              description="Please check the backend and try again."
              action={{
                label:
                  "Try again",
                onClick: () =>
                  void examinationsQuery.refetch(),
              }}
            />
          ) : (
            <DataTable
              data={(
                examinationsQuery.data ??
                []
              ).slice()}
              columns={
                examinationColumns
              }
              rowKey="examId"
              loading={
                examinationsQuery.isLoading
              }
              pageSize={10}
              emptyTitle="No examinations configured"
              emptyMessage="Configure an examination above to create the first assessment setup."
            />
          )}
        </div>
      </Card>

      {/* ======================================================
          EDIT MODAL
          ====================================================== */}

      <Modal
        open={Boolean(
          editingExamination,
        )}
        onClose={() => {
          if (
            !updateMutation.isPending
          ) {
            setEditingExamination(
              null,
            );
          }
        }}
        title="Edit Examination"
        description={
          editingExamination
            ? `${examLabel(
                editingExamination,
              )} · ${
                editingExamination.examId
              }`
            : undefined
        }
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              disabled={
                updateMutation.isPending
              }
              onClick={() =>
                setEditingExamination(
                  null,
                )
              }
            >
              Cancel
            </Button>

            <Button
              loading={
                updateMutation.isPending
              }
              onClick={() =>
                void saveEdit()
              }
            >
              Save Changes
            </Button>
          </>
        }
      >
        {editingExamination && (
          <div className="space-y-5">
            {/* ----------------------------------------------
                SUBJECT INFORMATION
                ---------------------------------------------- */}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-neutral-50 p-4">
                <p className="text-caption text-muted">
                  Subject
                </p>

                <p className="mt-1 font-heading text-body-sm font-semibold text-heading">
                  {
                    editingExamination
                      .subject
                      .subjectName
                  }
                </p>

                <p className="mt-1 font-mono text-[11px] text-muted">
                  {
                    editingExamination
                      .subject
                      .subjectId
                  }
                </p>
              </div>

              {/* --------------------------------------------
                  EXAMINATION INFORMATION
                  -------------------------------------------- */}

              <div className="rounded-lg bg-neutral-50 p-4">
                <p className="text-caption text-muted">
                  Examination
                </p>

                <p className="mt-1 font-heading text-body-sm font-semibold text-heading">
                  {examLabel(
                    editingExamination,
                  )}
                </p>

                <p className="mt-1 text-caption text-muted">
                  Semester{" "}
                  {
                    editingExamination.semester
                  }
                </p>
              </div>
            </div>

            {/* ----------------------------------------------
                MAXIMUM MARKS
                ---------------------------------------------- */}

            <Input
              label="Maximum Marks"
              type="number"
              min={1}
              step={1}
              required
              value={
                editMaxMarks
              }
              onChange={(
                event,
              ) =>
                setEditMaxMarks(
                  event.target
                    .value,
                )
              }
            />

            {/* ----------------------------------------------
                PROFESSOR
                ---------------------------------------------- */}

            <Select
              label="Professor"
              required
              value={
                editProfessorId
              }
              onChange={(
                event,
              ) =>
                setEditProfessorId(
                  event.target
                    .value,
                )
              }
              options={[
                {
                  value: "",
                  label:
                    "Choose professor",
                },
                ...editProfessorOptions,
              ]}
              disabled={
                professorsForEditQuery.isLoading
              }
              helperText="Only professors from the subject's course department are shown."
            />
          </div>
        )}
      </Modal>

      {/* ======================================================
          DELETE CONFIRMATION
          ====================================================== */}

      <ConfirmDialog
        open={Boolean(
          deletingExamination,
        )}
        onClose={() => {
          if (
            !deleteMutation.isPending
          ) {
            setDeletingExamination(
              null,
            );
          }
        }}
        onConfirm={
          confirmDelete
        }
        title="Delete examination"
        recordName={
          deletingExamination
            ? examLabel(
                deletingExamination,
              )
            : "this examination"
        }
        actionLabel="Delete"
        description={
          deletingExamination
            ? `Delete ${examLabel(
                deletingExamination,
              )} for ${
                deletingExamination
                  .subject
                  .subjectName
              }? The backend will also remove student marks associated with this examination.`
            : undefined
        }
      />
    </div>
  );
}