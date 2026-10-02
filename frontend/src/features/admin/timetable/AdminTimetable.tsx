import {
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Clock3,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import toast from "react-hot-toast";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import EmptyState from "../../../components/ui/EmptyState";
import { Input } from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import Skeleton from "../../../components/ui/Skeleton";
import ClassSessionAgenda from "../../../components/timetable/ClassSessionAgenda";

import type {
  ClassSession,
} from "../../../lib/api/types";

import {
  getClassSessions,
} from "../../../lib/api/endpoints/classSessions";

import {
  generateSessionId,
  toIsoDate,
} from "../../../lib/utils/classSession";

import {
  getApiErrorMessage,
} from "../../../lib/utils/errors";

import {
  useCourses,
} from "../courses/useCourses";

import {
  useProfessors,
} from "../professors/useProfessors";

import {
  useSubjects,
} from "../subjects/useSubjects";

import {
  useTeachingsBySubject,
} from "../teaching/useTeaching";

import {
  useClassSessions,
  useCreateClassSession,
  useDeleteClassSession,
  useUpdateClassSession,
} from "./useClassSessions";

// ============================================================
// HELPERS
// ============================================================

function toApiTime(
  value: string,
): string {
  if (!value) {
    return "";
  }

  return value.length === 5
    ? `${value}:00`
    : value;
}

function toInputTime(
  value: string,
): string {
  return value
    ? value.slice(0, 5)
    : "";
}

// ============================================================
// COMPONENT
// ============================================================

export default function AdminTimetable() {
  // ==========================================================
  // VIEW
  // ==========================================================

  const [
    viewMode,
    setViewMode,
  ] = useState<
    "agenda" | "calendar"
  >("agenda");

  // ==========================================================
  // FILTERS
  // ==========================================================

  const [
    courseFilter,
    setCourseFilter,
  ] = useState("");

  const [
    sectionFilter,
    setSectionFilter,
  ] = useState("");

  const [
    semesterFilter,
    setSemesterFilter,
  ] = useState("");

  const [
    professorFilter,
    setProfessorFilter,
  ] = useState("");

  // ==========================================================
  // MODALS
  // ==========================================================

  const [
    createOpen,
    setCreateOpen,
  ] = useState(false);

  const [
    editingSession,
    setEditingSession,
  ] = useState<ClassSession | null>(
    null,
  );

  const [
    deletingSession,
    setDeletingSession,
  ] = useState<ClassSession | null>(
    null,
  );

  // ==========================================================
  // CREATE FORM
  // ==========================================================

  const [
    selectedCourseId,
    setSelectedCourseId,
  ] = useState("");

  const [
    selectedSemester,
    setSelectedSemester,
  ] = useState("");

  const [
    selectedSection,
    setSelectedSection,
  ] = useState("");

  const [
    selectedSubjectId,
    setSelectedSubjectId,
  ] = useState("");

  const [
    selectedProfessorId,
    setSelectedProfessorId,
  ] = useState("");

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    toIsoDate(new Date()),
  );

  const [
    selectedStartTime,
    setSelectedStartTime,
  ] = useState("");

  const [
    selectedEndTime,
    setSelectedEndTime,
  ] = useState("");

  // ==========================================================
  // EDIT FORM
  // ==========================================================

  const [
    editDate,
    setEditDate,
  ] = useState("");

  const [
    editStartTime,
    setEditStartTime,
  ] = useState("");

  const [
    editEndTime,
    setEditEndTime,
  ] = useState("");

  // ==========================================================
  // QUERIES
  // ==========================================================

  const coursesQuery =
    useCourses();

  const professorsQuery =
    useProfessors();

  const subjectsQuery =
    useSubjects(
      selectedCourseId ||
        undefined,
    );

  const teachingsBySubjectQuery =
    useTeachingsBySubject(
      selectedSubjectId,
    );

  const sessionsQuery =
    useClassSessions();

  // ==========================================================
  // MUTATIONS
  // ==========================================================

  const createMutation =
    useCreateClassSession();

  const updateMutation =
    useUpdateClassSession();

  const deleteMutation =
    useDeleteClassSession();

  // ==========================================================
  // FILTERED SESSIONS
  // ==========================================================

  const filteredSessions =
    useMemo(() => {
      const sessions =
        sessionsQuery.data ??
        [];

      return sessions
        .filter(
          (session) => {
            if (
              courseFilter &&
              session.course.courseId !==
                courseFilter
            ) {
              return false;
            }

            if (
              sectionFilter &&
              session.section
                .trim()
                .toLowerCase() !==
                sectionFilter
                  .trim()
                  .toLowerCase()
            ) {
              return false;
            }

            if (
              semesterFilter &&
              String(
                session.semester,
              ) !==
                semesterFilter
            ) {
              return false;
            }

            if (
              professorFilter &&
              session.teaching
                .professor
                .profId !==
                professorFilter
            ) {
              return false;
            }

            return true;
          },
        )
        .sort(
          (
            first,
            second,
          ) => {
            const date =
              first.day.localeCompare(
                second.day,
              );

            if (date !== 0) {
              return date;
            }

            return first.startTime.localeCompare(
              second.startTime,
            );
          },
        );
    }, [
      courseFilter,
      professorFilter,
      sectionFilter,
      semesterFilter,
      sessionsQuery.data,
    ]);

  // ==========================================================
  // OPTIONS
  // ==========================================================

  const courseFilterOptions =
    useMemo(
      () => [
        {
          value: "",
          label: "All courses",
        },

        ...(
          coursesQuery.data ??
          []
        ).map(
          (course) => ({
            value:
              course.courseId,

            label:
              `${course.courseName} (${course.courseId})`,
          }),
        ),
      ],
      [coursesQuery.data],
    );

  const professorFilterOptions =
    useMemo(
      () => [
        {
          value: "",
          label:
            "All professors",
        },

        ...(
          professorsQuery.data ??
          []
        ).map(
          (professor) => ({
            value:
              professor.profId,

            label:
              `${professor.professorName} (${professor.profId})`,
          }),
        ),
      ],
      [professorsQuery.data],
    );

  const createCourseOptions =
    useMemo(
      () => [
        {
          value: "",
          label:
            "Select a course",
        },

        ...(
          coursesQuery.data ??
          []
        ).map(
          (course) => ({
            value:
              course.courseId,

            label:
              `${course.courseName} (${course.courseId})`,
          }),
        ),
      ],
      [coursesQuery.data],
    );

  const createSubjectOptions =
    useMemo(
      () => [
        {
          value: "",
          label:
            selectedCourseId
              ? "Select a subject"
              : "Select a course first",
        },

        ...(
          subjectsQuery.data ??
          []
        ).map(
          (subject) => ({
            value:
              subject.subjectId,

            label:
              `${subject.subjectName} (${subject.subjectId})`,
          }),
        ),
      ],
      [
        selectedCourseId,
        subjectsQuery.data,
      ],
    );

  const createProfessorOptions =
    useMemo(
      () => [
        {
          value: "",
          label:
            selectedSubjectId
              ? "Select a professor"
              : "Select a subject first",
        },

        ...(
          teachingsBySubjectQuery.data ??
          []
        ).map(
          (teaching) => ({
            value:
              teaching.professor
                .profId,

            label:
              `${teaching.professor.professorName} (${teaching.professor.profId})`,
          }),
        ),
      ],
      [
        selectedSubjectId,
        teachingsBySubjectQuery.data,
      ],
    );

  const semesterOptions =
    useMemo(
      () => [
        {
          value: "",
          label:
            "Select semester",
        },

        ...Array.from(
          {
            length: 8,
          },
          (_, index) => ({
            value: String(
              index + 1,
            ),
            label:
              `Semester ${
                index + 1
              }`,
          }),
        ),
      ],
      [],
    );

  const filterSemesterOptions =
    useMemo(
      () => [
        {
          value: "",
          label:
            "All semesters",
        },

        ...Array.from(
          {
            length: 8,
          },
          (_, index) => ({
            value: String(
              index + 1,
            ),
            label:
              `Semester ${
                index + 1
              }`,
          }),
        ),
      ],
      [],
    );

  // ==========================================================
  // CREATE FORM RESET
  // ==========================================================

  function resetCreateForm() {
    setSelectedCourseId("");
    setSelectedSemester("");
    setSelectedSection("");
    setSelectedSubjectId("");
    setSelectedProfessorId("");
    setSelectedDate(
      toIsoDate(
        new Date(),
      ),
    );
    setSelectedStartTime("");
    setSelectedEndTime("");
  }

  // ==========================================================
  // OPEN CREATE
  // ==========================================================

  function openCreate() {
    resetCreateForm();
    setCreateOpen(true);
  }

  // ==========================================================
  // CLOSE CREATE
  // ==========================================================

  function closeCreate() {
    if (
      createMutation.isPending
    ) {
      return;
    }

    setCreateOpen(false);
    resetCreateForm();
  }

  // ==========================================================
  // COURSE CHANGE
  // ==========================================================

  function handleCourseChange(
    courseId: string,
  ) {
    setSelectedCourseId(
      courseId,
    );

    setSelectedSubjectId("");
    setSelectedProfessorId("");
  }

  // ==========================================================
  // SUBJECT CHANGE
  // ==========================================================

  function handleSubjectChange(
    subjectId: string,
  ) {
    setSelectedSubjectId(
      subjectId,
    );

    setSelectedProfessorId("");
  }

  // ==========================================================
  // CREATE
  // ==========================================================

  async function handleCreate() {
    if (!selectedCourseId) {
      toast.error(
        "Please select a course.",
      );
      return;
    }

    if (!selectedSemester) {
      toast.error(
        "Please select a semester.",
      );
      return;
    }

    if (
      !selectedSection.trim()
    ) {
      toast.error(
        "Please enter a section.",
      );
      return;
    }

    if (!selectedSubjectId) {
      toast.error(
        "Please select a subject.",
      );
      return;
    }

    if (!selectedProfessorId) {
      toast.error(
        "Please select a professor.",
      );
      return;
    }

    if (!selectedDate) {
      toast.error(
        "Please select a class date.",
      );
      return;
    }

    if (!selectedStartTime) {
      toast.error(
        "Please select a start time.",
      );
      return;
    }

    if (!selectedEndTime) {
      toast.error(
        "Please select an end time.",
      );
      return;
    }

    if (
      selectedEndTime <=
      selectedStartTime
    ) {
      toast.error(
        "End time must be later than start time.",
      );
      return;
    }

    const teaching =
      teachingsBySubjectQuery.data?.find(
        (item) =>
          item.professor.profId ===
          selectedProfessorId,
      );

    if (!teaching) {
      toast.error(
        "The selected professor is not assigned to this subject.",
      );
      return;
    }

    try {
      // ------------------------------------------------------
      // FRESH SESSION LIST
      // ------------------------------------------------------
      //
      // The finalized Session ID rule requires the complete
      // current list immediately before generating the ID.
      // ------------------------------------------------------

      const existingSessions =
        await getClassSessions();

      const sessionId =
        generateSessionId(
          selectedDate,
          existingSessions,
        );

      // ------------------------------------------------------
      // CREATE
      // ------------------------------------------------------

      await createMutation.mutateAsync(
        {
          sessionId,

          course: {
            courseId:
              selectedCourseId,
          },

          teaching: {
            id: {
              profId:
                teaching.professor.profId,

              subjectId:
                teaching.subject
                  .subjectId,
            },
          },

          semester:
            Number(
              selectedSemester,
            ),

          section:
            selectedSection.trim(),

          day:
            selectedDate,

          startTime:
            toApiTime(
              selectedStartTime,
            ),

          endTime:
            toApiTime(
              selectedEndTime,
            ),
        },
      );

      toast.success(
        `Session ${sessionId} created successfully.`,
      );

      closeCreate();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to create the class session.",
        ),
      );
    }
  }

  // ==========================================================
  // OPEN EDIT
  // ==========================================================

  function openEdit(
    session: ClassSession,
  ) {
    setEditingSession(
      session,
    );

    setEditDate(
      session.day,
    );

    setEditStartTime(
      toInputTime(
        session.startTime,
      ),
    );

    setEditEndTime(
      toInputTime(
        session.endTime,
      ),
    );
  }

  // ==========================================================
  // CLOSE EDIT
  // ==========================================================

  function closeEdit() {
    if (
      updateMutation.isPending
    ) {
      return;
    }

    setEditingSession(null);
  }

  // ==========================================================
  // UPDATE
  // ==========================================================

  async function handleUpdate() {
    if (!editingSession) {
      return;
    }

    if (!editDate) {
      toast.error(
        "Please select a class date.",
      );
      return;
    }

    if (!editStartTime) {
      toast.error(
        "Please select a start time.",
      );
      return;
    }

    if (!editEndTime) {
      toast.error(
        "Please select an end time.",
      );
      return;
    }

    if (
      editEndTime <=
      editStartTime
    ) {
      toast.error(
        "End time must be later than start time.",
      );
      return;
    }

    try {
      await updateMutation.mutateAsync(
        {
          sessionId:
            editingSession.sessionId,

          changes: {
            day:
              editDate,

            startTime:
              toApiTime(
                editStartTime,
              ),

            endTime:
              toApiTime(
                editEndTime,
              ),
          },
        },
      );

      toast.success(
        "Class session updated successfully.",
      );

      closeEdit();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to update the class session.",
        ),
      );
    }
  }

  // ==========================================================
  // DELETE
  // ==========================================================

  async function handleDelete() {
    if (!deletingSession) {
      return;
    }

    const sessionId =
      deletingSession.sessionId;

    try {
      await deleteMutation.mutateAsync(
        sessionId,
      );

      toast.success(
        `Session ${sessionId} deleted.`,
      );

      setDeletingSession(
        null,
      );

      if (
        editingSession?.sessionId ===
        sessionId
      ) {
        setEditingSession(
          null,
        );
      }
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to delete the class session.",
        ),
      );
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    coursesQuery.isLoading ||
    professorsQuery.isLoading ||
    sessionsQuery.isLoading
  ) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-2 h-8 w-52" />
          <Skeleton className="mt-2 h-4 w-96 max-w-full" />
        </div>

        <Card>
          <div className="space-y-3">
            {Array.from(
              {
                length: 5,
              },
            ).map(
              (_, index) => (
                <Skeleton
                  key={index}
                  className="h-20 w-full"
                />
              ),
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    coursesQuery.isError ||
    professorsQuery.isError ||
    sessionsQuery.isError
  ) {
    return (
      <EmptyState
        title="Unable to load timetable"
        description="The timetable data could not be retrieved from CampusHub."
        action={{
          label: "Try again",

          onClick: () => {
            void coursesQuery.refetch();
            void professorsQuery.refetch();
            void sessionsQuery.refetch();
          },
        }}
      />
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-6">
      {/* ====================================================
          HEADER
          ==================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="pl-4 sm:pl-6 lg:pl-8">
          <p className="text-body-sm font-medium text-primary-600">
            Academic Management
          </p>

          <h1 className="mt-1 font-heading text-h1 text-heading">
            Timetable
          </h1>

          <p className="mt-1 max-w-2xl text-body-sm text-muted">
            Create one dated class occurrence at a time and assign it to an existing teaching relationship.
          </p>
        </div>

        <Button
          size="lg"
          onClick={openCreate}
        >
          <Plus className="h-5 w-5" />

          Create Class Session
        </Button>
      </div>

      {/* ====================================================
          FILTERS
          ==================================================== */}

      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Select
            label="Course"
            options={
              courseFilterOptions
            }
            value={
              courseFilter
            }
            onChange={(
              event,
            ) =>
              setCourseFilter(
                event.target.value,
              )
            }
          />

          <Select
            label="Semester"
            options={
              filterSemesterOptions
            }
            value={
              semesterFilter
            }
            onChange={(
              event,
            ) =>
              setSemesterFilter(
                event.target.value,
              )
            }
          />

          <Select
            label="Professor"
            options={
              professorFilterOptions
            }
            value={
              professorFilter
            }
            onChange={(
              event,
            ) =>
              setProfessorFilter(
                event.target.value,
              )
            }
          />

          <Input
            label="Section"
            placeholder="e.g. A"
            value={
              sectionFilter
            }
            onChange={(
              event,
            ) =>
              setSectionFilter(
                event.target.value,
              )
            }
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4">
          <p className="text-body-sm text-muted">
            {filteredSessions.length}{" "}
            {filteredSessions.length ===
            1
              ? "session"
              : "sessions"}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant={
                viewMode ===
                "agenda"
                  ? "primary"
                  : "secondary"
              }
              size="sm"
              onClick={() =>
                setViewMode(
                  "agenda",
                )
              }
            >
              Agenda
            </Button>

            <Button
              variant={
                viewMode ===
                "calendar"
                  ? "primary"
                  : "secondary"
              }
              size="sm"
              onClick={() =>
                setViewMode(
                  "calendar",
                )
              }
            >
              <CalendarDays className="h-4 w-4" />

              Calendar
            </Button>
          </div>
        </div>
      </Card>

      {/* ====================================================
          SESSION LIST
          ==================================================== */}

      <Card>
        <div className="mb-5">
          <h2 className="font-heading text-h3 text-heading">
            Scheduled Class Sessions
          </h2>

          <p className="mt-1 text-body-sm text-muted">
            Each row represents one actual dated occurrence.
          </p>
        </div>

        {filteredSessions.length ===
        0 ? (
          <EmptyState
            title="No sessions found"
            description="Try changing the filters or create a new class session."
            action={{
              label:
                "Create session",
              onClick: openCreate,
            }}
          />
        ) : (
          <ClassSessionAgenda
            sessions={
              filteredSessions
            }
            mode={
              viewMode
            }
            onSessionClick={
              openEdit
            }
            renderAction={(
              session,
            ) => (
              <Button
                variant="icon"
                aria-label={`Edit ${session.sessionId}`}
                title="Edit session"
                onClick={() =>
                  openEdit(
                    session,
                  )
                }
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          />
        )}
      </Card>

      {/* ====================================================
          CREATE MODAL
          ==================================================== */}

      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="Create Class Session"
        description="Create one real-world dated occurrence for an existing teaching assignment."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={
                createMutation.isPending
              }
              onClick={
                closeCreate
              }
            >
              Cancel
            </Button>

            <Button
              loading={
                createMutation.isPending
              }
              onClick={() => {
                void handleCreate();
              }}
            >
              Create Session
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Select
            label="Course"
            required
            options={
              createCourseOptions
            }
            value={
              selectedCourseId
            }
            onChange={(
              event,
            ) =>
              handleCourseChange(
                event.target.value,
              )
            }
            disabled={
              coursesQuery.isLoading
            }
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Select
              label="Semester"
              required
              options={
                semesterOptions
              }
              value={
                selectedSemester
              }
              onChange={(
                event,
              ) =>
                setSelectedSemester(
                  event.target.value,
                )
              }
            />

            <Input
              label="Section"
              required
              placeholder="e.g. A"
              value={
                selectedSection
              }
              onChange={(
                event,
              ) =>
                setSelectedSection(
                  event.target.value,
                )
              }
            />
          </div>

          <Select
            label="Subject"
            required
            options={
              createSubjectOptions
            }
            value={
              selectedSubjectId
            }
            onChange={(
              event,
            ) =>
              handleSubjectChange(
                event.target.value,
              )
            }
            disabled={
              !selectedCourseId ||
              subjectsQuery.isLoading
            }
          />

          <Select
            label="Professor"
            required
            options={
              createProfessorOptions
            }
            value={
              selectedProfessorId
            }
            onChange={(
              event,
            ) =>
              setSelectedProfessorId(
                event.target.value,
              )
            }
            disabled={
              !selectedSubjectId ||
              teachingsBySubjectQuery.isLoading
            }
            helperText="Only professors already assigned to this subject through Teaching appear here."
          />

          <Input
            label="Class Date"
            type="date"
            required
            value={
              selectedDate
            }
            onChange={(
              event,
            ) =>
              setSelectedDate(
                event.target.value,
              )
            }
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Start Time"
              type="time"
              required
              value={
                selectedStartTime
              }
              onChange={(
                event,
              ) =>
                setSelectedStartTime(
                  event.target.value,
                )
              }
            />

            <Input
              label="End Time"
              type="time"
              required
              value={
                selectedEndTime
              }
              onChange={(
                event,
              ) =>
                setSelectedEndTime(
                  event.target.value,
                )
              }
            />
          </div>

          {/* Session ID information */}
          <div className="rounded-lg border border-primary-100 bg-primary-50 p-4">
            <p className="text-caption text-primary-700">
              Session ID
            </p>

            <p className="mt-1 font-mono text-body-sm font-semibold text-primary-800">
              Auto-generated when saved
            </p>

            <p className="mt-1 text-caption text-primary-700">
              Format: CS + YYMMDD + daily sequence
            </p>
          </div>
        </div>
      </Modal>

      {/* ====================================================
          EDIT MODAL
          ==================================================== */}

      <Modal
        open={
          editingSession !==
          null
        }
        onClose={
          closeEdit
        }
        title="Edit Class Session"
        description="Only the date and time can be changed after the session is created."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={
                updateMutation.isPending
              }
              onClick={
                closeEdit
              }
            >
              Cancel
            </Button>

            <Button
              loading={
                updateMutation.isPending
              }
              onClick={() => {
                void handleUpdate();
              }}
            >
              Save Changes
            </Button>
          </>
        }
      >
        {editingSession && (
          <div className="space-y-5">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />

                <div className="min-w-0">
                  <p className="font-heading text-body-sm font-semibold text-heading">
                    {
                      editingSession
                        .teaching
                        .subject
                        .subjectName
                    }
                  </p>

                  <p className="mt-1 text-caption text-muted">
                    {
                      editingSession
                        .course
                        .courseName
                    }{" "}
                    · Semester{" "}
                    {
                      editingSession
                        .semester
                    }{" "}
                    · Section{" "}
                    {
                      editingSession
                        .section
                    }
                  </p>

                  <p className="mt-1 text-caption text-muted">
                    Professor:{" "}
                    {
                      editingSession
                        .teaching
                        .professor
                        .professorName
                    }
                  </p>

                  <p className="mt-2 font-mono text-caption text-neutral-400">
                    {
                      editingSession.sessionId
                    }
                  </p>
                </div>
              </div>
            </div>

            <Input
              label="Class Date"
              type="date"
              required
              value={editDate}
              onChange={(
                event,
              ) =>
                setEditDate(
                  event.target.value,
                )
              }
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input
                label="Start Time"
                type="time"
                required
                value={
                  editStartTime
                }
                onChange={(
                  event,
                ) =>
                  setEditStartTime(
                    event.target.value,
                  )
                }
              />

              <Input
                label="End Time"
                type="time"
                required
                value={
                  editEndTime
                }
                onChange={(
                  event,
                ) =>
                  setEditEndTime(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="border-t border-neutral-200 pt-4">
              <Button
                variant="danger"
                onClick={() => {
                  setDeletingSession(
                    editingSession,
                  );
                }}
              >
                <Trash2 className="h-4 w-4" />

                Delete Session
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ====================================================
          DELETE
          ==================================================== */}

      <ConfirmDialog
        open={
          deletingSession !==
          null
        }
        onClose={() =>
          setDeletingSession(
            null,
          )
        }
        onConfirm={
          handleDelete
        }
        title="Delete class session?"
        recordName={
          deletingSession?.sessionId ??
          ""
        }
        actionLabel="Delete Session"
        description="Deleting this session also removes its attendance records."
      />
    </div>
  );
}