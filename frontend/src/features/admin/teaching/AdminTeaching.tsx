import { useMemo, useState } from "react";
import {
    ArrowRightLeft,
    BookOpen,
    Plus,
    Trash2,
    UserRound,
  } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import DataTable from "../../../components/ui/DataTable";
import { Select } from "../../../components/ui/Select";
import Modal from "../../../components/ui/Modal";

import type {
  Teaching,
} from "../../../lib/api/types";

import {
  useProfessors,
} from "../professors/useProfessors";

import {
  useSubjects,
} from "../subjects/useSubjects";

import {
  useCreateTeaching,
  useDeleteTeaching,
  useReassignTeaching,
  useTeachings,
} from "./useTeaching";

// ============================================================
// ERROR HELPER
// ============================================================

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const response = (
    error as {
      response?: {
        data?: unknown;
      };
    }
  )?.response;

  if (
    typeof response?.data === "string" &&
    response.data.trim()
  ) {
    return response.data;
  }

  return fallback;
}

// ============================================================
// COMPONENT
// ============================================================

export default function AdminTeaching() {
  // ----------------------------------------------------------
  // MODAL STATE
  // ----------------------------------------------------------

  const [
    isCreateOpen,
    setIsCreateOpen,
  ] = useState(false);

  const [
    reassigningTeaching,
    setReassigningTeaching,
  ] = useState<Teaching | null>(
    null,
  );

  const [
    deletingTeaching,
    setDeletingTeaching,
  ] = useState<Teaching | null>(
    null,
  );

  // ----------------------------------------------------------
  // FORM STATE
  // ----------------------------------------------------------

  const [
    selectedProfessorId,
    setSelectedProfessorId,
  ] = useState("");

  const [
    selectedSubjectId,
    setSelectedSubjectId,
  ] = useState("");

  const [
    newProfessorId,
    setNewProfessorId,
  ] = useState("");

  // ----------------------------------------------------------
  // QUERIES
  // ----------------------------------------------------------

  const teachingsQuery =
    useTeachings();

  const professorsQuery =
    useProfessors();

  const subjectsQuery =
    useSubjects();

  // ----------------------------------------------------------
  // MUTATIONS
  // ----------------------------------------------------------

  const createMutation =
    useCreateTeaching();

  const reassignMutation =
    useReassignTeaching();

  const deleteMutation =
    useDeleteTeaching();

  // ----------------------------------------------------------
  // OPTIONS
  // ----------------------------------------------------------

  const professorOptions =
    useMemo(
      () =>
        professorsQuery.data
          ?.map((professor) => ({
            value:
              professor.profId,

            label:
              `${professor.professorName} (${professor.profId})`,
          }))
          .sort((first, second) =>
            first.label.localeCompare(
              second.label,
            ),
          ) ?? [],
      [professorsQuery.data],
    );

  const subjectOptions =
    useMemo(
      () =>
        subjectsQuery.data
          ?.map((subject) => ({
            value:
              subject.subjectId,

            label:
              `${subject.subjectName} (${subject.subjectId})`,
          }))
          .sort((first, second) =>
            first.label.localeCompare(
              second.label,
            ),
          ) ?? [],
      [subjectsQuery.data],
    );

  const reassignProfessorOptions =
    useMemo(
      () =>
        professorOptions.filter(
          (professor) =>
            professor.value !==
            reassigningTeaching?.id
              .profId,
        ),
      [
        professorOptions,
        reassigningTeaching,
      ],
    );

  // ----------------------------------------------------------
  // RESET CREATE FORM
  // ----------------------------------------------------------

  function resetCreateForm() {
    setSelectedProfessorId("");
    setSelectedSubjectId("");
  }

  // ----------------------------------------------------------
  // OPEN CREATE
  // ----------------------------------------------------------

  function openCreateModal() {
    resetCreateForm();
    setIsCreateOpen(true);
  }

  // ----------------------------------------------------------
  // CLOSE CREATE
  // ----------------------------------------------------------

  function closeCreateModal() {
    if (createMutation.isPending) {
      return;
    }

    setIsCreateOpen(false);
    resetCreateForm();
  }

  // ----------------------------------------------------------
  // CREATE
  // ----------------------------------------------------------

  async function handleCreate() {
    if (!selectedProfessorId) {
      toast.error(
        "Please select a professor.",
      );
      return;
    }

    if (!selectedSubjectId) {
      toast.error(
        "Please select a subject.",
      );
      return;
    }

    const alreadyAssigned =
      teachingsQuery.data?.some(
        (teaching) =>
          teaching.id.profId ===
            selectedProfessorId &&
          teaching.id.subjectId ===
            selectedSubjectId,
      );

    if (alreadyAssigned) {
      toast.error(
        "This professor is already assigned to this subject.",
      );
      return;
    }

    try {
      await createMutation.mutateAsync(
        {
          professorId:
            selectedProfessorId,

          subjectId:
            selectedSubjectId,
        },
      );

      toast.success(
        "Teaching assignment created successfully.",
      );

      closeCreateModal();
    } catch (error) {
      const status = (
        error as {
          response?: {
            status?: number;
          };
        }
      )?.response?.status;

      if (status === 409) {
        toast.error(
          "This teaching assignment already exists.",
        );
        return;
      }

      toast.error(
        getErrorMessage(
          error,
          "Unable to create the teaching assignment.",
        ),
      );
    }
  }

  // ----------------------------------------------------------
  // OPEN REASSIGN
  // ----------------------------------------------------------

  function openReassignModal(
    teaching: Teaching,
  ) {
    setReassigningTeaching(
      teaching,
    );
    setNewProfessorId("");
  }

  // ----------------------------------------------------------
  // CLOSE REASSIGN
  // ----------------------------------------------------------

  function closeReassignModal() {
    if (
      reassignMutation.isPending
    ) {
      return;
    }

    setReassigningTeaching(null);
    setNewProfessorId("");
  }

  // ----------------------------------------------------------
  // REASSIGN
  // ----------------------------------------------------------

  async function handleReassign() {
    if (
      !reassigningTeaching
    ) {
      return;
    }

    if (!newProfessorId) {
      toast.error(
        "Please select the new professor.",
      );
      return;
    }

    try {
      await reassignMutation.mutateAsync(
        {
          oldProfId:
            reassigningTeaching.id
              .profId,

          subjectId:
            reassigningTeaching.id
              .subjectId,

          newProfId:
            newProfessorId,
        },
      );

      toast.success(
        "Professor reassigned successfully.",
      );

      closeReassignModal();
    } catch (error) {
      const status = (
        error as {
          response?: {
            status?: number;
          };
        }
      )?.response?.status;

      if (status === 409) {
        toast.error(
          "The new professor is already assigned to this subject.",
        );
        return;
      }

      toast.error(
        getErrorMessage(
          error,
          "Unable to reassign the professor.",
        ),
      );
    }
  }

  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------

  async function handleDelete() {
    if (!deletingTeaching) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(
        {
          profId:
            deletingTeaching.id
              .profId,

          subjectId:
            deletingTeaching.id
              .subjectId,
        },
      );

      toast.success(
        "Teaching assignment deleted successfully.",
      );

      setDeletingTeaching(null);
    } catch (error) {
      const status = (
        error as {
          response?: {
            status?: number;
          };
        }
      )?.response?.status;

      if (status === 409) {
        toast.error(
          "This teaching assignment still has linked class sessions.",
        );
        return;
      }

      toast.error(
        getErrorMessage(
          error,
          "Unable to delete the teaching assignment.",
        ),
      );
    }
  }

  // ----------------------------------------------------------
  // TABLE COLUMNS
  // ----------------------------------------------------------

  const columns = [
    {
      key: "professor",
      header: "Professor",
      sortable: true,

      render: (
        teaching: Teaching,
      ) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-50 text-secondary-600">
            <UserRound
              size={18}
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <p className="truncate font-medium text-heading">
              {
                teaching
                  .professor
                  .professorName
              }
            </p>

            <p className="text-body-sm text-muted">
              {
                teaching
                  .professor
                  .profId
              }
            </p>
          </div>
        </div>
      ),
    },

    {
      key: "subject",
      header: "Subject",
      sortable: true,

      render: (
        teaching: Teaching,
      ) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <BookOpen
              size={18}
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <p className="truncate font-medium text-heading">
              {
                teaching
                  .subject
                  .subjectName
              }
            </p>

            <p className="text-body-sm text-muted">
              {
                teaching
                  .subject
                  .subjectId
              }
            </p>
          </div>
        </div>
      ),
    },

    {
      key: "course",
      header: "Course",
      sortable: true,

      render: (
        teaching: Teaching,
      ) => (
        <div>
          <p className="font-medium text-heading">
            {
              teaching
                .subject
                .course
                .courseName
            }
          </p>

          <p className="text-body-sm text-muted">
            {
              teaching
                .subject
                .course
                .courseId
            }
          </p>
        </div>
      ),
    },

    {
      key: "actions",
      header: "Actions",
      className:
        "text-right",
      headerClassName:
        "text-right",

      render: (
        teaching: Teaching,
      ) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="icon"
            size="sm"
            title="Reassign professor"
            aria-label={`Reassign ${teaching.subject.subjectName}`}
            onClick={() =>
              openReassignModal(
                teaching,
              )
            }
          >
            <ArrowRightLeft
              size={17}
              aria-hidden="true"
            />
          </Button>

          <Button
            variant="icon"
            size="sm"
            title="Delete assignment"
            aria-label={`Delete ${teaching.professor.professorName} teaching ${teaching.subject.subjectName}`}
            onClick={() =>
              setDeletingTeaching(
                teaching,
              )
            }
          >
            <Trash2
              size={17}
              aria-hidden="true"
            />
          </Button>
        </div>
      ),
    },
  ];

  // ----------------------------------------------------------
  // ERROR STATE
  // ----------------------------------------------------------

  if (
    teachingsQuery.isError
  ) {
    return (
      <div className="space-y-6">
        <div className="pl-4 sm:pl-6 lg:pl-8">
          <p className="text-body-sm font-medium text-primary-600">
            Academic Management
          </p>

          <h1 className="mt-1 font-heading text-h2 text-heading">
            Teaching Assignments
          </h1>

          <p className="mt-2 text-body text-muted">
            Assign professors to subjects and
            manage existing teaching relationships.
          </p>
        </div>

        <Card className="border-danger/20 bg-danger-bg">
          <div>
            <h2 className="font-heading text-h3 text-danger-text">
              Unable to load teaching assignments
            </h2>

            <p className="mt-2 text-body-sm text-danger-text">
              Something went wrong while loading
              the teaching assignments.
            </p>

            <Button
              variant="secondary"
              size="md"
              className="mt-4"
              onClick={() =>
                void teachingsQuery.refetch()
              }
            >
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="pl-4 sm:pl-6 lg:pl-8">
          <p className="text-body-sm font-medium text-primary-600">
            Academic Management
          </p>

          <h1 className="mt-1 font-heading text-h2 text-heading">
            Teaching Assignments
          </h1>

          <p className="mt-2 max-w-2xl text-body text-muted">
            Assign professors to subjects and
            manage existing teaching relationships.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={
            openCreateModal
          }
        >
          <Plus
            size={18}
            aria-hidden="true"
          />

          Assign Professor
        </Button>
      </div>

      {/* Information card */}

      <Card className="border-primary-100 bg-primary-50/50">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
            <ArrowRightLeft
              size={18}
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="font-heading text-body-sm font-semibold text-heading">
              Teaching relationship
            </h2>

            <p className="mt-1 text-body-sm text-muted">
              A teaching assignment connects one
              professor with one subject. Reassigning
              a professor preserves the subject
              relationship and lets the backend migrate
              existing class sessions.
            </p>
          </div>
        </div>
      </Card>

      {/* Table */}

      <DataTable<Teaching>
        columns={columns}
        data={
          teachingsQuery.data ?? []
        }
        loading={
          teachingsQuery.isLoading
        }
        rowKey={(teaching) =>
          `${teaching.id.profId}-${teaching.id.subjectId}`
        }
        pageSize={10}
        emptyTitle="No teaching assignments"
        emptyMessage="No professor has been assigned to a subject yet."
        emptyAction={
          <Button
            variant="primary"
            size="md"
            onClick={
              openCreateModal
            }
          >
            <Plus
              size={17}
              aria-hidden="true"
            />

            Assign Professor
          </Button>
        }
      />

      {/* ======================================================
          CREATE MODAL
          ====================================================== */}

      <Modal
        open={isCreateOpen}
        onClose={
          closeCreateModal
        }
        title="Assign Professor"
        description="Create a teaching assignment by selecting a professor and a subject."
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={
                closeCreateModal
              }
              disabled={
                createMutation.isPending
              }
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={
                handleCreate
              }
              loading={
                createMutation.isPending
              }
            >
              Create Assignment
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Select
            label="Professor"
            required
            options={[
              {
                value: "",
                label:
                  "Select a professor",
              },
              ...professorOptions,
            ]}
            value={
              selectedProfessorId
            }
            onChange={(event) =>
              setSelectedProfessorId(
                event.target.value,
              )
            }
            disabled={
              professorsQuery.isLoading
            }
            helperText="Only professors already present in CampusHub can be assigned."
          />

          <Select
            label="Subject"
            required
            options={[
              {
                value: "",
                label:
                  "Select a subject",
              },
              ...subjectOptions,
            ]}
            value={
              selectedSubjectId
            }
            onChange={(event) =>
              setSelectedSubjectId(
                event.target.value,
              )
            }
            disabled={
              subjectsQuery.isLoading
            }
            helperText="The selected professor will be assigned to this subject."
          />

          {selectedProfessorId &&
            selectedSubjectId && (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-caption text-muted">
                  Assignment preview
                </p>

                <p className="mt-2 font-medium text-heading">
                  {
                    professorsQuery.data?.find(
                      (professor) =>
                        professor.profId ===
                        selectedProfessorId,
                    )?.professorName
                  }
                </p>

                <p className="mt-1 text-body-sm text-muted">
                  will teach
                </p>

                <p className="mt-1 font-medium text-heading">
                  {
                    subjectsQuery.data?.find(
                      (subject) =>
                        subject.subjectId ===
                        selectedSubjectId,
                    )?.subjectName
                  }
                </p>
              </div>
            )}
        </div>
      </Modal>

      {/* ======================================================
          REASSIGN MODAL
          ====================================================== */}

      <Modal
        open={
          reassigningTeaching !==
          null
        }
        onClose={
          closeReassignModal
        }
        title="Reassign Professor"
        description={
          reassigningTeaching
            ? `Choose a new professor for ${reassigningTeaching.subject.subjectName}.`
            : ""
        }
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={
                closeReassignModal
              }
              disabled={
                reassignMutation.isPending
              }
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={
                handleReassign
              }
              loading={
                reassignMutation.isPending
              }
            >
              Reassign
            </Button>
          </>
        }
      >
        {reassigningTeaching && (
          <div className="space-y-5">
            <div className="rounded-lg bg-neutral-50 p-4">
              <p className="text-caption text-muted">
                Current assignment
              </p>

              <p className="mt-2 font-medium text-heading">
                {
                  reassigningTeaching
                    .professor
                    .professorName
                }
              </p>

              <p className="mt-1 text-body-sm text-muted">
                →
                {" "}
                {
                  reassigningTeaching
                    .subject
                    .subjectName
                }
              </p>
            </div>

            <Select
              label="New Professor"
              required
              options={[
                {
                  value: "",
                  label:
                    "Select a new professor",
                },
                ...reassignProfessorOptions,
              ]}
              value={
                newProfessorId
              }
              onChange={(event) =>
                setNewProfessorId(
                  event.target.value,
                )
              }
              disabled={
                professorsQuery.isLoading
              }
            />
          </div>
        )}
      </Modal>

      {/* ======================================================
          DELETE CONFIRMATION
          ====================================================== */}

      <ConfirmDialog
        open={
          deletingTeaching !==
          null
        }
        onClose={() =>
          setDeletingTeaching(
            null,
          )
        }
        onConfirm={
          handleDelete
        }
        title="Delete teaching assignment?"
        recordName={
          deletingTeaching
            ? `${deletingTeaching.professor.professorName} → ${deletingTeaching.subject.subjectName}`
            : ""
        }
        actionLabel="Delete Assignment"
        description={
          deletingTeaching
            ? `This removes the teaching assignment between ${deletingTeaching.professor.professorName} and ${deletingTeaching.subject.subjectName}.`
            : ""
        }
      />
    </div>
  );
}