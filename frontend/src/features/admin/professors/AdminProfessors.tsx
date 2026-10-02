import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DataTable from "../../../components/ui/DataTable";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import Button from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import StatusPill from "../../../components/ui/StatusPill";

import type { Professor } from "../../../lib/api/types";

import { useDepartments } from "../departments/useDepartments";

import {
  useCreateProfessor,
  useDeleteProfessor,
  useProfessors,
  useSetProfessorActive,
  useUpdateProfessor,
} from "./useProfessors";

// ============================================================
// FORM VALIDATION
// ============================================================

const PHONE_NUMBER_REGEX =
  /^\+?[0-9]{7,15}$/;

const professorSchema = z.object({
  professorName: z
    .string()
    .trim()
    .min(
      1,
      "Professor name is required.",
    ),

  phoneNumber: z
    .string()
    .trim()
    .min(
      1,
      "Phone number is required.",
    )
    .regex(
      PHONE_NUMBER_REGEX,
      "Enter a valid phone number, e.g. 9876543210.",
    ),

  departmentId: z
    .string()
    .trim()
    .min(
      1,
      "Department is required.",
    ),
});

type ProfessorFormValues =
  z.infer<typeof professorSchema>;

// ============================================================
// ERROR HELPER
// ============================================================

function getResponseErrorMessage(
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

  const data = response?.data;

  // Backend currently returns duplicate-phone errors
  // as plain text.
  if (
    typeof data === "string" &&
    data.trim()
  ) {
    return data.trim();
  }

  // Also support { message: "..." }.
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data
  ) {
    const message = (
      data as {
        message?: unknown;
      }
    ).message;

    if (
      typeof message === "string" &&
      message.trim()
    ) {
      return message.trim();
    }
  }

  // Also support { error: "..." }.
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data
  ) {
    const message = (
      data as {
        error?: unknown;
      }
    ).error;

    if (
      typeof message === "string" &&
      message.trim()
    ) {
      return message.trim();
    }
  }

  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
}

// ============================================================
// COMPONENT
// ============================================================

export default function AdminProfessors() {
  const navigate = useNavigate();

  // ----------------------------------------------------------
  // FILTERS / MODALS
  // ----------------------------------------------------------

  const [
    departmentFilter,
    setDepartmentFilter,
  ] = useState("");

  const [
    isModalOpen,
    setIsModalOpen,
  ] = useState(false);

  const [
    editingProfessor,
    setEditingProfessor,
  ] = useState<Professor | null>(
    null,
  );

  const [
    deletingProfessor,
    setDeletingProfessor,
  ] = useState<Professor | null>(
    null,
  );

  const [
    statusProfessor,
    setStatusProfessor,
  ] = useState<Professor | null>(
    null,
  );

  // ----------------------------------------------------------
  // QUERIES
  // ----------------------------------------------------------

  const {
    data: departments = [],
    isLoading: departmentsLoading,
  } = useDepartments();

  const {
    data: professors = [],
    isLoading: professorsLoading,
    isError: professorsError,
    refetch: refetchProfessors,
  } = useProfessors(
    departmentFilter || undefined,
  );

  // ----------------------------------------------------------
  // MUTATIONS
  // ----------------------------------------------------------

  const createProfessor =
    useCreateProfessor();

  const updateProfessor =
    useUpdateProfessor();

  const deleteProfessor =
    useDeleteProfessor();

  const setProfessorActive =
    useSetProfessorActive();

  // ----------------------------------------------------------
  // FORM
  // ----------------------------------------------------------

  const form =
    useForm<ProfessorFormValues>({
      resolver:
        zodResolver(
          professorSchema,
        ),

      defaultValues: {
        professorName: "",
        phoneNumber: "",
        departmentId: "",
      },
    });

  const isEditing =
    editingProfessor !== null;

  const isSaving =
    createProfessor.isPending ||
    updateProfessor.isPending;

  // ----------------------------------------------------------
  // DEPARTMENT OPTIONS
  // ----------------------------------------------------------

  const departmentOptions =
    useMemo(
      () => [
        {
          value: "",
          label:
            "All departments",
        },

        ...departments.map(
          (department) => ({
            value:
              department.deptId,

            label:
              `${department.deptName} (${department.deptId})`,
          }),
        ),
      ],
      [departments],
    );

  const formDepartmentOptions =
    useMemo(
      () => [
        {
          value: "",
          label:
            "Select department",
        },

        ...departments.map(
          (department) => ({
            value:
              department.deptId,

            label:
              `${department.deptName} (${department.deptId})`,
          }),
        ),
      ],
      [departments],
    );

  // ----------------------------------------------------------
  // OPEN CREATE
  // ----------------------------------------------------------

  const openCreateModal =
    () => {
      setEditingProfessor(null);

      form.reset({
        professorName: "",
        phoneNumber: "",
        departmentId: "",
      });

      setIsModalOpen(true);
    };

  // ----------------------------------------------------------
  // OPEN EDIT
  // ----------------------------------------------------------

  const openEditModal = (
    professor: Professor,
  ) => {
    setEditingProfessor(
      professor,
    );

    form.reset({
      professorName:
        professor.professorName,

      phoneNumber:
        professor.phoneNumber ?? "",

      departmentId:
        professor.department.deptId,
    });

    setIsModalOpen(true);
  };

  // ----------------------------------------------------------
  // CLOSE MODAL
  // ----------------------------------------------------------

  const closeModal =
    () => {
      if (isSaving) {
        return;
      }

      setIsModalOpen(false);
      setEditingProfessor(null);

      form.reset({
        professorName: "",
        phoneNumber: "",
        departmentId: "",
      });
    };

  // ----------------------------------------------------------
  // SUBMIT CREATE / UPDATE
  // ----------------------------------------------------------

  const onSubmit =
    async (
      values: ProfessorFormValues,
    ) => {
      const department =
        departments.find(
          (item) =>
            item.deptId ===
            values.departmentId,
        );

      if (!department) {
        toast.error(
          "Please select a valid department.",
        );

        return;
      }

      try {
        if (editingProfessor) {
          await updateProfessor.mutateAsync(
            {
              id:
                editingProfessor.profId,

              professor: {
                professorName:
                  values.professorName.trim(),

                phoneNumber:
                  values.phoneNumber.trim(),

                department,
              },
            },
          );

          toast.success(
            "Professor updated successfully.",
          );
        } else {
          await createProfessor.mutateAsync(
            {
              professorName:
                values.professorName.trim(),

              phoneNumber:
                values.phoneNumber.trim(),

              department,
            },
          );

          toast.success(
            "Professor created successfully.",
          );
        }

        closeModal();
      } catch (error) {
        const status = (
          error as {
            response?: {
              status?: number;
            };
          }
        )?.response?.status;

        /*
         * IMPORTANT:
         *
         * Do not replace a 409 backend message with a
         * generic message. getResponseErrorMessage()
         * extracts the actual server response.
         */
        toast.error(
          getResponseErrorMessage(
            error,
            status === 409
              ? "This professor conflicts with an existing record."
              : editingProfessor
                ? "Unable to update the professor."
                : "Unable to create the professor.",
          ),
        );
      }
    };

  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------

  const handleDelete =
    async () => {
      if (!deletingProfessor) {
        return;
      }

      try {
        await deleteProfessor.mutateAsync(
          deletingProfessor.profId,
        );

        toast.success(
          "Professor deleted successfully.",
        );

        setDeletingProfessor(null);
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
            getResponseErrorMessage(
              error,
              "This professor still has linked records. Remove those records first.",
            ),
          );

          return;
        }

        toast.error(
          getResponseErrorMessage(
            error,
            "Unable to delete the professor.",
          ),
        );
      }
    };

  // ----------------------------------------------------------
  // ACTIVATE / DEACTIVATE
  // ----------------------------------------------------------

  const handleToggleStatus =
    async () => {
      if (!statusProfessor) {
        return;
      }

      try {
        await setProfessorActive.mutateAsync(
          {
            id:
              statusProfessor.profId,

            active:
              !statusProfessor.active,
          },
        );

        toast.success(
          statusProfessor.active
            ? "Professor account deactivated."
            : "Professor account activated.",
        );

        setStatusProfessor(null);
      } catch (error) {
        toast.error(
          getResponseErrorMessage(
            error,
            "Unable to update professor status.",
          ),
        );
      }
    };

  // ----------------------------------------------------------
  // TABLE COLUMNS
  // ----------------------------------------------------------

  const columns = [
    {
      key: "profId",

      header: "Professor ID",

      accessor:
        "profId" as keyof Professor,

      sortable: true,

      render: (
        professor: Professor,
      ) => (
        <span className="font-medium text-heading">
          {professor.profId}
        </span>
      ),
    },

    {
      key: "professorName",

      header: "Professor",

      accessor:
        "professorName" as keyof Professor,

      sortable: true,

      render: (
        professor: Professor,
      ) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            <UserRound
              size={18}
            />
          </div>

          <div className="min-w-0">
            <p className="truncate font-medium text-heading">
              {
                professor.professorName
              }
            </p>

            <p className="text-body-sm text-muted">
              {professor.profId}
            </p>
          </div>
        </div>
      ),
    },

    {
      key: "department",

      header: "Department",

      render: (
        professor: Professor,
      ) => (
        <div>
          <p className="font-medium text-heading">
            {
              professor.department
                .deptName
            }
          </p>

          <p className="text-body-sm text-muted">
            {
              professor.department
                .deptId
            }
          </p>
        </div>
      ),
    },

    {
      key: "active",

      header: "Status",

      accessor:
        "active" as keyof Professor,

      sortable: true,

      render: (
        professor: Professor,
      ) => (
        <StatusPill
          status={
            professor.active
              ? "Active"
              : "Inactive"
          }
          animateChange
        />
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
        professor: Professor,
      ) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="icon"
            size="sm"
            aria-label={`View ${professor.professorName}`}
            title="View professor"
            onClick={() =>
              navigate(
                `/admin/professors/${btoa(
                  professor.profId,
                )
                  .replace(/\+/g, "-")
                  .replace(/\//g, "_")
                  .replace(/=+$/, "")}`,
                {
                  state: {
                    professor,
                  },
                },
              )
            }
          >
            <Eye
              size={17}
              aria-hidden="true"
            />
          </Button>

          <Button
            variant="icon"
            size="sm"
            aria-label={`Edit ${professor.professorName}`}
            title="Edit professor"
            onClick={() =>
              openEditModal(
                professor,
              )
            }
          >
            <Pencil
              size={17}
              aria-hidden="true"
            />
          </Button>

          <Button
            variant="icon"
            size="sm"
            aria-label={
              professor.active
                ? `Deactivate ${professor.professorName}`
                : `Activate ${professor.professorName}`
            }
            title={
              professor.active
                ? "Deactivate"
                : "Activate"
            }
            onClick={() =>
              setStatusProfessor(
                professor,
              )
            }
          >
            {professor.active ? (
              <UserRoundX
                size={17}
                aria-hidden="true"
              />
            ) : (
              <UserRoundCheck
                size={17}
                aria-hidden="true"
              />
            )}
          </Button>

          <Button
            variant="icon"
            size="sm"
            aria-label={`Delete ${professor.professorName}`}
            title="Delete professor"
            onClick={() =>
              setDeletingProfessor(
                professor,
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
  // LOADING / ERROR
  // ----------------------------------------------------------

  const isLoading =
    professorsLoading ||
    departmentsLoading;

  if (professorsError) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-body-sm font-medium text-primary-600">
            Academic Management
          </p>

          <h1 className="mt-1 font-heading text-h2 text-heading">
            Professors
          </h1>

          <p className="mt-2 text-body text-muted">
            Manage professor accounts,
            departments and account status.
          </p>
        </div>

        <div className="rounded-xl border border-danger/20 bg-danger-bg p-6">
          <h2 className="font-heading text-h3 text-danger-text">
            Unable to load professors
          </h2>

          <p className="mt-2 text-body-sm text-danger-text">
            Something went wrong while
            loading the professor list.
          </p>

          <Button
            variant="secondary"
            size="md"
            className="mt-4"
            onClick={() =>
              void refetchProfessors()
            }
          >
            Try Again
          </Button>
        </div>
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
        <div>
          <p className="text-body-sm font-medium text-primary-600">
            Academic Management
          </p>

          <h1 className="mt-1 font-heading text-h2 text-heading">
            Professors
          </h1>

          <p className="mt-2 max-w-2xl text-body text-muted">
            Manage professor accounts,
            departments and account status.
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

          Add Professor
        </Button>
      </div>

      {/* Filter */}

      <div className="rounded-xl border border-neutral-200 bg-surface-card p-4 shadow-brand-sm">
        <div className="max-w-sm">
          <Select
            label="Department"
            options={
              departmentOptions
            }
            value={
              departmentFilter
            }
            onChange={(event) =>
              setDepartmentFilter(
                event.target.value,
              )
            }
            disabled={
              departmentsLoading
            }
          />
        </div>
      </div>

      {/* Table */}

      <DataTable<Professor>
        columns={columns}
        data={professors}
        loading={isLoading}
        rowKey={(professor) =>
          professor.profId
        }
        pageSize={10}
        emptyTitle={
          departmentFilter
            ? "No professors in this department"
            : "No professors found"
        }
        emptyMessage={
          departmentFilter
            ? "There are no professors assigned to the selected department."
            : "No professor accounts have been created yet."
        }
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

            Add Professor
          </Button>
        }
      />

      {/* Create / Edit modal */}

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={
          isEditing
            ? "Edit Professor"
            : "Add Professor"
        }
        description={
          isEditing
            ? "Update the professor's profile information."
            : "Create a new professor account. The backend generates the professor ID automatically."
        }
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={
                closeModal
              }
              disabled={isSaving}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              size="md"
              type="submit"
              loading={isSaving}
              form="professor-form"
            >
              {isEditing
                ? "Save Changes"
                : "Create Professor"}
            </Button>
          </>
        }
      >
        <form
          id="professor-form"
          onSubmit={form.handleSubmit(
            onSubmit,
          )}
          className="space-y-5"
        >
          {isEditing && (
            <Input
              label="Professor ID"
              value={
                editingProfessor?.profId ??
                ""
              }
              disabled
            />
          )}

          <Input
            label="Professor Name"
            placeholder="e.g. Dr. Professor"
            error={
              form.formState
                .errors
                .professorName
                ?.message
            }
            {...form.register(
              "professorName",
            )}
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="e.g. 9876543210"
            error={
              form.formState
                .errors
                .phoneNumber
                ?.message
            }
            {...form.register(
              "phoneNumber",
            )}
          />

          <Select
            label="Department"
            required
            options={
              formDepartmentOptions
            }
            value={form.watch(
              "departmentId",
            )}
            onChange={(event) =>
              form.setValue(
                "departmentId",
                event.target.value,
                {
                  shouldDirty: true,
                  shouldValidate: true,
                },
              )
            }
            error={
              form.formState
                .errors
                .departmentId
                ?.message
            }
            disabled={
              departmentsLoading
            }
          />
        </form>
      </Modal>

      {/* Status confirmation */}

      <ConfirmDialog
        open={
          statusProfessor !==
          null
        }
        onClose={() =>
          setStatusProfessor(
            null,
          )
        }
        onConfirm={
          handleToggleStatus
        }
        title={
          statusProfessor?.active
            ? "Deactivate professor?"
            : "Activate professor?"
        }
        recordName={
          statusProfessor
            ?.professorName ??
          ""
        }
        actionLabel={
          statusProfessor?.active
            ? "Deactivate"
            : "Activate"
        }
        description={
          statusProfessor?.active
            ? "This will mark the professor account as inactive. They will no longer be treated as an active professor account."
            : "This will mark the professor account as active again."
        }
      />

      {/* Delete confirmation */}

      <ConfirmDialog
        open={
          deletingProfessor !==
          null
        }
        onClose={() =>
          setDeletingProfessor(
            null,
          )
        }
        onConfirm={
          handleDelete
        }
        title="Delete professor?"
        recordName={
          deletingProfessor
            ?.professorName ??
          ""
        }
        actionLabel="Delete"
        description="Deleting this professor is permanent. Linked teaching assignments or other records may prevent deletion."
      />
    </div>
  );
}