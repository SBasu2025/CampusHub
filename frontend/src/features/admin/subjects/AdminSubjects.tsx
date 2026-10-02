import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BookOpen,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import DataTable from "../../../components/ui/DataTable";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

import type { Subject } from "../../../lib/api/types";

import { useCourses } from "../courses/useCourses";

import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from "./useSubjects";

// ============================================================
// FORM VALIDATION
// ============================================================

const subjectSchema = z.object({
  subjectId: z
    .string()
    .trim()
    .min(1, "Subject ID is required."),

  subjectName: z
    .string()
    .trim()
    .min(1, "Subject name is required."),

  courseId: z
    .string()
    .trim()
    .min(1, "Course is required."),

  semester: z
    .coerce
    .number()
    .int("Semester must be a whole number.")
    .min(1, "Semester must be between 1 and 8.")
    .max(8, "Semester must be between 1 and 8."),
});

// z.coerce.number() accepts an unknown input and produces a number.
// Keeping input/output types separate fixes the React Hook Form
// + Zod resolver type mismatch.

type SubjectFormInput =
  z.input<typeof subjectSchema>;

type SubjectFormValues =
  z.output<typeof subjectSchema>;

// ============================================================
// COMPONENT
// ============================================================

export default function AdminSubjects() {
  const [courseFilter, setCourseFilter] =
    useState("");

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingSubject, setEditingSubject] =
    useState<Subject | null>(null);

  const [subjectToDelete, setSubjectToDelete] =
    useState<Subject | null>(null);

  // ----------------------------------------------------------
  // QUERIES
  // ----------------------------------------------------------

  const coursesQuery = useCourses();

  const subjectsQuery = useSubjects(
    courseFilter || undefined,
  );

  // ----------------------------------------------------------
  // MUTATIONS
  // ----------------------------------------------------------

  const createMutation =
    useCreateSubject();

  const updateMutation =
    useUpdateSubject();

  const deleteMutation =
    useDeleteSubject();

  // ----------------------------------------------------------
  // FORM
  // ----------------------------------------------------------

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: {
      errors,
    },
  } = useForm<
    SubjectFormInput,
    any,
    SubjectFormValues
  >({
    resolver:
      zodResolver(subjectSchema),

    defaultValues: {
      subjectId: "",
      subjectName: "",
      courseId: "",
      semester: 1,
    },
  });

  const selectedCourseId =
    watch("courseId");

  // ----------------------------------------------------------
  // COURSE OPTIONS
  // ----------------------------------------------------------

  const courseFilterOptions =
    useMemo(
      () => [
        {
          value: "",
          label: "All courses",
        },

        ...(coursesQuery.data ?? []).map(
          (course) => ({
            value: course.courseId,
            label:
              `${course.courseName} (${course.courseId})`,
          }),
        ),
      ],
      [coursesQuery.data],
    );

  const formCourseOptions =
    useMemo(
      () => [
        {
          value: "",
          label: "Select course",
        },

        ...(coursesQuery.data ?? []).map(
          (course) => ({
            value: course.courseId,
            label:
              `${course.courseName} (${course.courseId})`,
          }),
        ),
      ],
      [coursesQuery.data],
    );

  // ----------------------------------------------------------
  // MODAL HELPERS
  // ----------------------------------------------------------

  const openCreateModal = () => {
    setEditingSubject(null);

    reset({
      subjectId: "",
      subjectName: "",
      courseId: "",
      semester: 1,
    });

    setIsModalOpen(true);
  };

  const openEditModal = (
    subject: Subject,
  ) => {
    setEditingSubject(subject);

    reset({
      subjectId:
        subject.subjectId,

      subjectName:
        subject.subjectName,

      courseId:
        subject.course.courseId,

      semester:
        Number(
          (
            subject as Subject & {
              semester: number;
            }
          ).semester,
        ),
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (
      createMutation.isPending ||
      updateMutation.isPending
    ) {
      return;
    }

    setIsModalOpen(false);
    setEditingSubject(null);

    reset({
      subjectId: "",
      subjectName: "",
      courseId: "",
      semester: 1,
    });
  };

  // ----------------------------------------------------------
  // CREATE / UPDATE
  // ----------------------------------------------------------

  const onSubmit = async (
    values: SubjectFormValues,
  ) => {
    const course =
      coursesQuery.data?.find(
        (item) =>
          item.courseId ===
          values.courseId,
      );

    if (!course) {
      toast.error(
        "Please select a valid course.",
      );

      return;
    }

    const subject: Subject & {
      semester: number;
    } = {
      subjectId:
        values.subjectId.trim(),

      subjectName:
        values.subjectName.trim(),

      course,

      semester:
        values.semester,
    };

    try {
      if (editingSubject) {
        await updateMutation.mutateAsync({
          id:
            editingSubject.subjectId,
          subject,
        });

        toast.success(
          "Subject updated successfully.",
        );
      } else {
        await createMutation.mutateAsync(
          subject,
        );

        toast.success(
          "Subject created successfully.",
        );
      }

      closeModal();
    } catch (error: any) {
      const status =
        error?.response?.status;

      if (status === 409) {
        toast.error(
          "A subject with this ID already exists.",
        );

        return;
      }

      const message =
        error?.response?.data;

      toast.error(
        typeof message === "string"
          ? message
          : editingSubject
            ? "Unable to update the subject."
            : "Unable to create the subject.",
      );
    }
  };

  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------

  const handleDelete = async () => {
    if (!subjectToDelete) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(
        subjectToDelete.subjectId,
      );

      toast.success(
        "Subject deleted successfully.",
      );

      setSubjectToDelete(null);
    } catch (error: any) {
      const status =
        error?.response?.status;

      if (status === 409) {
        const message =
          error?.response?.data;

        toast.error(
          typeof message === "string"
            ? message
            : "This subject still has linked records. Remove those records first.",
        );

        return;
      }

      const message =
        error?.response?.data;

      toast.error(
        typeof message === "string"
          ? message
          : "Unable to delete the subject.",
      );
    }
  };

  // ----------------------------------------------------------
  // TABLE COLUMNS
  // ----------------------------------------------------------

  const columns = [
    {
      key: "subjectId",
      header: "Subject ID",
      sortable: true,

      render: (
        subject: Subject,
      ) => (
        <span className="font-medium text-heading">
          {subject.subjectId}
        </span>
      ),
    },

    {
      key: "subjectName",
      header: "Subject Name",
      sortable: true,

      render: (
        subject: Subject,
      ) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <BookOpen size={17} />
          </div>

          <span className="font-medium text-heading">
            {subject.subjectName}
          </span>
        </div>
      ),
    },

    {
      key: "course",
      header: "Course",
      sortable: true,

      render: (
        subject: Subject,
      ) => (
        <div>
          <p className="font-medium text-heading">
            {subject.course.courseName}
          </p>

          <p className="text-body-sm text-neutral-500">
            {subject.course.courseId}
          </p>
        </div>
      ),
    },

    {
      key: "semester",
      header: "Semester",
      sortable: true,

      render: (
        subject: Subject,
      ) => (
        <span className="font-medium text-heading">
          Semester{" "}
          {
            (
              subject as Subject & {
                semester: number;
              }
            ).semester
          }
        </span>
      ),
    },

    {
      key: "department",
      header: "Department",
      sortable: true,

      render: (
        subject: Subject,
      ) => (
        <div>
          <p className="font-medium text-heading">
            {subject.course.department.deptName}
          </p>

          <p className="text-body-sm text-neutral-500">
            {subject.course.department.deptId}
          </p>
        </div>
      ),
    },

    {
      key: "actions",
      header: "Actions",

      render: (
        subject: Subject,
      ) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              openEditModal(subject)
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-primary-50 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label={`Edit ${subject.subjectName}`}
            title="Edit subject"
          >
            <Pencil size={17} />
          </button>

          <button
            type="button"
            onClick={() =>
              setSubjectToDelete(
                subject,
              )
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-danger-bg hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
            aria-label={`Delete ${subject.subjectName}`}
            title="Delete subject"
          >
            <Trash2 size={17} />
          </button>
        </div>
      ),
    },
  ];

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="space-y-6">

      {/* Page header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="pl-4 sm:pl-6 lg:pl-8">
          <p className="text-body-sm font-medium text-primary-600">
            Academic Management
          </p>

          <h1 className="mt-1 font-heading text-h2 text-heading">
            Subjects
          </h1>

          <p className="mt-2 max-w-2xl text-body text-neutral-500">
            Manage subjects, semesters, and
            course associations.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white shadow-sm transition-all duration-150 hover:bg-primary-700 hover:shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <Plus size={18} />

          Add Subject
        </button>
      </div>

      {/* Course filter */}

      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="max-w-sm">
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
        </div>
      </div>

      {/* Subjects table */}

      <DataTable<Subject>
        columns={columns}
        data={
          subjectsQuery.data ?? []
        }
        loading={
          subjectsQuery.isLoading
        }
        rowKey={(
          subject,
        ) =>
          subject.subjectId
        }
        emptyTitle="No subjects found"
        emptyMessage={
          courseFilter
            ? "There are no subjects in the selected course."
            : "No subjects have been added yet."
        }
        emptyAction={
          <button
            type="button"
            onClick={
              openCreateModal
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <Plus size={17} />

            Add Subject
          </button>
        }
      />

      {/* Create / Edit modal */}

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={
          editingSubject
            ? "Edit Subject"
            : "Add Subject"
        }
        description={
          editingSubject
            ? "Update the subject, semester, and course information below."
            : "Create a new subject and associate it with a course and semester."
        }
      >
        <form
          onSubmit={
            handleSubmit(
              onSubmit,
            )
          }
          className="space-y-5"
        >
          <Input
            label="Subject ID"
            placeholder="e.g. DBMS001"
            disabled={
              !!editingSubject
            }
            error={
              errors.subjectId
                ?.message
            }
            {...register(
              "subjectId",
            )}
          />

          <Input
            label="Subject Name"
            placeholder="e.g. Database Management Systems"
            error={
              errors.subjectName
                ?.message
            }
            {...register(
              "subjectName",
            )}
          />

          <Input
            label="Semester"
            type="number"
            min={1}
            max={8}
            placeholder="e.g. 7"
            hint="Enter a semester from 1 to 8."
            error={
              errors.semester
                ?.message
            }
            {...register(
              "semester",
              {
                valueAsNumber: true,
              },
            )}
          />

          <Select
            label="Course"
            required
            options={
              formCourseOptions
            }
            value={
              selectedCourseId
            }
            onChange={(
              event,
            ) =>
              setValue(
                "courseId",
                event.target.value,
                {
                  shouldValidate:
                    true,

                  shouldDirty:
                    true,
                },
              )
            }
            error={
              errors.courseId
                ?.message
            }
          />

          {/* Modal actions */}

          <div className="flex flex-col-reverse gap-3 border-t border-neutral-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              disabled={
                createMutation.isPending ||
                updateMutation.isPending
              }
              className="min-h-10 rounded-lg border border-neutral-300 px-4 py-2 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                createMutation.isPending ||
                updateMutation.isPending
              }
              className="min-h-10 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createMutation.isPending ||
              updateMutation.isPending
                ? "Saving..."
                : editingSubject
                  ? "Save Changes"
                  : "Create Subject"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}

      <ConfirmDialog
        open={
          !!subjectToDelete
        }
        onClose={() =>
          setSubjectToDelete(
            null,
          )
        }
        onConfirm={
          handleDelete
        }
        title="Delete subject?"
        recordName={
          subjectToDelete?.subjectName ??
          ""
        }
        actionLabel="Delete Subject"
        description="Deleting this subject is permanent. Any linked teaching assignments or student subject selections must be removed first."
      />
    </div>
  );
}