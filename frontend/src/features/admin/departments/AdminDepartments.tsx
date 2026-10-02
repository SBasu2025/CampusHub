import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

import DataTable from "../../../components/ui/DataTable";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import EmptyState from "../../../components/ui/EmptyState";
import Button from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

import type { Department } from "../../../lib/api/types";

import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useUpdateDepartment,
} from "./useDepartments";

const departmentSchema = z.object({
  deptId: z
    .string()
    .trim()
    .min(1, "Department ID is required.")
    .max(
      10,
      "Department ID must be at most 10 characters.",
    ),

  deptName: z
    .string()
    .trim()
    .min(1, "Department name is required.")
    .max(
      20,
      "Department name must be at most 20 characters.",
    ),
});

type DepartmentFormValues =
  z.infer<typeof departmentSchema>;

const pageTransition = {
  duration: 0.35,
  ease: [0.16, 1, 0.3, 1] as const,
};

export default function AdminDepartments() {
  const {
    data: departments = [],
    isLoading,
    isError,
    refetch,
  } = useDepartments();

  const createDepartment =
    useCreateDepartment();

  const updateDepartment =
    useUpdateDepartment();

  const deleteDepartment =
    useDeleteDepartment();

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingDepartment, setEditingDepartment] =
    useState<Department | null>(null);

  const [deletingDepartment, setDeletingDepartment] =
    useState<Department | null>(null);

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),

    defaultValues: {
      deptId: "",
      deptName: "",
    },
  });

  const isEditing =
    editingDepartment !== null;

  const isSaving =
    createDepartment.isPending ||
    updateDepartment.isPending;

  const openCreateModal = () => {
    setEditingDepartment(null);

    form.reset({
      deptId: "",
      deptName: "",
    });

    setIsModalOpen(true);
  };

  const openEditModal = (
    department: Department,
  ) => {
    setEditingDepartment(department);

    form.reset({
      deptId: department.deptId,
      deptName: department.deptName,
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingDepartment(null);

    form.reset({
      deptId: "",
      deptName: "",
    });
  };

  const onSubmit = async (
    values: DepartmentFormValues,
  ) => {
    try {
      const payload = {
        deptId: values.deptId.trim(),
        deptName: values.deptName.trim(),
      };

      if (editingDepartment) {
        await updateDepartment.mutateAsync({
          id: editingDepartment.deptId,
          department: payload,
        });

        toast.success(
          "Department updated successfully.",
        );
      } else {
        await createDepartment.mutateAsync(
          payload,
        );

        toast.success(
          "Department created successfully.",
        );
      }

      closeModal();
    } catch (error) {
      const status =
        getResponseStatus(error);

      if (status === 409) {
        toast.error(
          "A department with this ID already exists.",
        );

        return;
      }

      toast.error(
        getErrorMessage(
          error,
          isEditing
            ? "Unable to update department."
            : "Unable to create department.",
        ),
      );
    }
  };

  const confirmDelete = async () => {
    if (!deletingDepartment) {
      return;
    }

    try {
      await deleteDepartment.mutateAsync(
        deletingDepartment.deptId,
      );

      toast.success(
        "Department deleted successfully.",
      );

      setDeletingDepartment(null);
    } catch (error) {
      const status =
        getResponseStatus(error);

      if (status === 409) {
        toast.error(
          "This department still has courses linked to it. Remove those courses first.",
        );

        return;
      }

      toast.error(
        getErrorMessage(
          error,
          "Unable to delete department.",
        ),
      );
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "deptId",
        header: "Department ID",

        render: (
          department: Department,
        ) => (
          <span className="font-mono text-body-sm font-medium text-heading">
            {department.deptId}
          </span>
        ),
      },

      {
        key: "deptName",
        header: "Department Name",

        render: (
          department: Department,
        ) => (
          <span className="text-body-sm text-heading">
            {department.deptName}
          </span>
        ),
      },

      {
        key: "actions",
        header: "Actions",
        align: "right" as const,

        render: (
          department: Department,
        ) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              aria-label={`Edit ${department.deptName}`}
              title="Edit department"
              onClick={() =>
                openEditModal(
                  department,
                )
              }
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors duration-150 hover:bg-primary-50 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 active:scale-[0.97]"
            >
              <Edit3
                aria-hidden="true"
                className="h-4 w-4"
              />
            </button>

            <button
              type="button"
              aria-label={`Delete ${department.deptName}`}
              title="Delete department"
              onClick={() =>
                setDeletingDepartment(
                  department,
                )
              }
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors duration-150 hover:bg-danger-bg hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger active:scale-[0.97]"
            >
              <Trash2
                aria-hidden="true"
                className="h-4 w-4"
              />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <motion.div
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={pageTransition}
        className="space-y-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="pl-4 sm:pl-6 lg:pl-8">
            <h1 className="font-heading text-h1 text-heading">
              Departments
            </h1>

            <p className="mt-1 text-body-sm text-muted">
              Manage academic departments across
              CampusHub.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            type="button"
            onClick={openCreateModal}
          >
            <Plus
              aria-hidden="true"
              className="h-4 w-4"
            />

            Add Department
          </Button>
        </div>

        {isError ? (
          <EmptyState
            title="Unable to load departments"
            description="We couldn't retrieve the department list from the server."
            action={{
              label: "Try again",

              onClick: () => {
                void refetch();
              },
            }}
          />
        ) : (
          <DataTable
            columns={columns}
            data={departments}
            rowKey={(department) =>
              department.deptId
            }
            loading={isLoading}
            emptyTitle="No departments found"
          />
        )}
      </motion.div>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={
          isEditing
            ? "Edit Department"
            : "Add Department"
        }
        description={
          isEditing
            ? "Update the department information below."
            : "Create a new academic department."
        }
        size="sm"
      >
        <form
          onSubmit={form.handleSubmit(
            onSubmit,
          )}
          className="space-y-5"
        >
          <Input
            label="Department ID"
            placeholder="e.g. COMPSCIKOL1"
            disabled={isEditing}
            {...form.register("deptId")}
            error={
              form.formState.errors
                .deptId?.message
            }
          />

          <Input
            label="Department Name"
            placeholder="e.g. Computer Science"
            {...form.register("deptName")}
            error={
              form.formState.errors
                .deptName?.message
            }
          />

          <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={isSaving}
              onClick={closeModal}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isSaving}
            >
              {isEditing
                ? "Save Changes"
                : "Create Department"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={
          deletingDepartment !== null
        }
        onClose={() =>
          setDeletingDepartment(null)
        }
        onConfirm={confirmDelete}
        title="Delete Department?"
        recordName={
          deletingDepartment?.deptName ??
          ""
        }
        actionLabel="Delete Department"
        description={
          deletingDepartment
            ? `Are you sure you want to delete "${deletingDepartment.deptName}"? This action cannot be undone.`
            : ""
        }
      />
    </>
  );
}

function getResponseStatus(
  error: unknown,
): number | undefined {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return undefined;
  }

  const response = (
    error as {
      response?: {
        status?: number;
      };
    }
  ).response;

  return response?.status;
}

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    typeof error === "object" &&
    error !== null
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          } | string;
        };
      }
    ).response;

    const responseData =
      response?.data;

    if (
      typeof responseData === "string" &&
      responseData.trim()
    ) {
      return responseData;
    }

    if (
      typeof responseData === "object" &&
      responseData !== null &&
      typeof responseData.message ===
        "string" &&
      responseData.message.trim()
    ) {
      return responseData.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}