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

import type {
  Course,
} from "../../../lib/api/types";

import { useDepartments } from "../departments/useDepartments";

import {
  useCourses,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
} from "./useCourses";


const courseSchema = z.object({
  courseId: z
    .string()
    .trim()
    .min(1, "Course ID is required."),

  courseName: z
    .string()
    .trim()
    .min(1, "Course name is required."),

  departmentId: z
    .string()
    .trim()
    .min(1, "Department is required."),
});


type CourseFormValues =
  z.infer<typeof courseSchema>;


export default function AdminCourses() {
  const [
    departmentFilter,
    setDepartmentFilter,
  ] = useState("");


  const [
    isModalOpen,
    setIsModalOpen,
  ] = useState(false);


  const [
    editingCourse,
    setEditingCourse,
  ] = useState<Course | null>(null);


  const [
    courseToDelete,
    setCourseToDelete,
  ] = useState<Course | null>(null);


  const departmentsQuery =
    useDepartments();


  const coursesQuery =
    useCourses(
      departmentFilter || undefined,
    );


  const createMutation =
    useCreateCourse();


  const updateMutation =
    useUpdateCourse();


  const deleteMutation =
    useDeleteCourse();


  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: {
      errors,
    },
  } = useForm<CourseFormValues>({
    resolver:
      zodResolver(courseSchema),

    defaultValues: {
      courseId: "",
      courseName: "",
      departmentId: "",
    },
  });


  const selectedDepartmentId =
    watch("departmentId");


  /*
   * Department options for the
   * table filter.
   */
  const departmentOptions =
    useMemo(
      () => [
        {
          value: "",
          label: "All departments",
        },

        ...(departmentsQuery.data ??
          []).map(
            (department) => ({
              value:
                department.deptId,

              label:
                `${department.deptName} (${department.deptId})`,
            }),
          ),
      ],
      [departmentsQuery.data],
    );


  /*
   * Department options for the
   * create/edit form.
   */
  const formDepartmentOptions =
  useMemo(
    () => [
      {
        value: "",
        label: "Select department",
      },

      ...(departmentsQuery.data ?? []).map(
        (department) => ({
          value: department.deptId,

          label:
            `${department.deptName} (${department.deptId})`,
        }),
      ),
    ],
    [departmentsQuery.data],
  );


  const openCreateModal =
    () => {
      setEditingCourse(null);

      reset({
        courseId: "",
        courseName: "",
        departmentId: "",
      });

      setIsModalOpen(true);
    };


  const openEditModal =
    (course: Course) => {
      setEditingCourse(course);

      reset({
        courseId:
          course.courseId,

        courseName:
          course.courseName,

        departmentId:
          course.department.deptId,
      });

      setIsModalOpen(true);
    };


  const closeModal =
    () => {
      if (
        createMutation.isPending ||
        updateMutation.isPending
      ) {
        return;
      }

      setIsModalOpen(false);
      setEditingCourse(null);

      reset({
        courseId: "",
        courseName: "",
        departmentId: "",
      });
    };


  const onSubmit =
    async (
      values: CourseFormValues,
    ) => {
      /*
       * Course requires a full
       * Department object.
       *
       * We therefore find the selected
       * department from the already
       * loaded department list.
       */
      const department =
        departmentsQuery.data?.find(
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


      const course: Course = {
        courseId:
          values.courseId.trim(),

        courseName:
          values.courseName.trim(),

        department,
      };


      try {
        if (editingCourse) {
          await updateMutation.mutateAsync(
            {
              id:
                editingCourse.courseId,

              course,
            },
          );

          toast.success(
            "Course updated successfully.",
          );
        } else {
          await createMutation.mutateAsync(
            course,
          );

          toast.success(
            "Course created successfully.",
          );
        }

        closeModal();
      } catch (error: any) {
        const status =
          error?.response?.status;


        if (status === 409) {
          toast.error(
            "A course with this ID already exists.",
          );

          return;
        }


        const message =
          error?.response?.data;


        toast.error(
          typeof message ===
          "string"
            ? message
            : editingCourse
              ? "Unable to update the course."
              : "Unable to create the course.",
        );
      }
    };


  const handleDelete =
    async () => {
      if (!courseToDelete) {
        return;
      }


      try {
        await deleteMutation.mutateAsync(
          courseToDelete.courseId,
        );

        toast.success(
          "Course deleted successfully.",
        );

        setCourseToDelete(null);
      } catch (error: any) {
        const status =
          error?.response?.status;


        if (status === 409) {
          toast.error(
            "This course still has students or subjects linked to it. Remove those records first.",
          );

          return;
        }


        const message =
          error?.response?.data;


        toast.error(
          typeof message ===
          "string"
            ? message
            : "Unable to delete the course.",
        );
      }
    };


  const columns = [
    {
      key: "courseId",

      header: "Course ID",

      sortable: true,

      render: (
        course: Course,
      ) => (
        <span className="font-medium text-heading">
          {course.courseId}
        </span>
      ),
    },


    {
      key: "courseName",

      header: "Course Name",

      sortable: true,

      render: (
        course: Course,
      ) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <BookOpen size={17} />
          </div>

          <span className="font-medium text-heading">
            {course.courseName}
          </span>
        </div>
      ),
    },


    {
      key: "department",

      header: "Department",

      sortable: true,

      render: (
        course: Course,
      ) => (
        <div>
          <p className="font-medium text-heading">
            {course.department.deptName}
          </p>

          <p className="text-body-sm text-neutral-500">
            {course.department.deptId}
          </p>
        </div>
      ),
    },


    {
      key: "actions",

      header: "Actions",

      render: (
        course: Course,
      ) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              openEditModal(course)
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-primary-50 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label={`Edit ${course.courseName}`}
            title="Edit course"
          >
            <Pencil size={17} />
          </button>


          <button
            type="button"
            onClick={() =>
              setCourseToDelete(course)
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-danger-50 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
            aria-label={`Delete ${course.courseName}`}
            title="Delete course"
          >
            <Trash2 size={17} />
          </button>
        </div>
      ),
    },
  ];


  return (
    <div className="space-y-6">

      {/* Page header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div className="pl-4 sm:pl-6 lg:pl-8">
          <p className="text-body-sm font-medium text-primary-600">
            Academic Management
          </p>

          <h1 className="mt-1 font-heading text-h2 text-heading">
            Courses
          </h1>

          <p className="mt-2 max-w-2xl text-body text-neutral-500">
            Manage courses and their department
            associations.
          </p>
        </div>


        <button
          type="button"
          onClick={
            openCreateModal
          }
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white shadow-sm transition-all duration-150 hover:bg-primary-700 hover:shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <Plus size={18} />

          Add Course
        </button>

      </div>


      {/* Department filter */}

      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">

        <div className="max-w-sm">

          <Select
            label="Department"
            options={
              departmentOptions
            }
            value={
              departmentFilter
            }
            onChange={(
              event,
            ) =>
              setDepartmentFilter(
                event.target.value,
              )
            }
          />

        </div>

      </div>


      {/* Courses table */}

      <DataTable<Course>
        columns={columns}
        data={
          coursesQuery.data ??
          []
        }
        loading={
          coursesQuery.isLoading
        }
        rowKey={(
          course,
        ) =>
          course.courseId
        }
        emptyTitle="No courses found"
        emptyMessage={
          departmentFilter
            ? "There are no courses in the selected department."
            : "No courses have been added yet."
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

            Add Course
          </button>
        }
      />


      {/* Create / Edit modal */}

      <Modal
        open={isModalOpen}
        onClose={
          closeModal
        }
        title={
          editingCourse
            ? "Edit Course"
            : "Add Course"
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
            label="Course ID"
            placeholder="e.g. CSE001"
            disabled={
              !!editingCourse
            }
            error={
              errors.courseId
                ?.message
            }
            {...register(
              "courseId",
            )}
          />


          <Input
            label="Course Name"
            placeholder="e.g. Database Management Systems"
            error={
              errors.courseName
                ?.message
            }
            {...register(
              "courseName",
            )}
          />


          <Select
            label="Department"
            required
            options={
              formDepartmentOptions
            }
            value={
              selectedDepartmentId
            }
            onChange={(
              event,
            ) =>
              setValue(
                "departmentId",
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
              errors.departmentId
                ?.message
            }
          />


          {/* Modal actions */}

          <div className="flex flex-col-reverse gap-3 border-t border-neutral-200 pt-5 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={
                closeModal
              }
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
                : editingCourse
                  ? "Save Changes"
                  : "Create Course"}
            </button>

          </div>

        </form>

      </Modal>


      {/* Delete confirmation */}

      <ConfirmDialog
        open={
          !!courseToDelete
        }
        onClose={() =>
          setCourseToDelete(
            null,
          )
        }
        onConfirm={
          handleDelete
        }
        title="Delete course?"
        recordName={
          courseToDelete?.courseName ??
          ""
        }
        actionLabel="Delete Course"
      />

    </div>
  );
}