import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  Pencil,
  Plus,
  Trash2,
  UserRoundCheck,
  UserRoundX,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Avatar from "../../../components/ui/Avatar";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import DataTable from "../../../components/ui/DataTable";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import StatusPill from "../../../components/ui/StatusPill";
import Modal from "../../../components/ui/Modal";

import type { Student } from "../../../lib/api/types";

import { useCourses } from "../courses/useCourses";

import {
  useCreateStudent,
  useDeleteStudent,
  usePromoteStudent,
  useSetStudentActive,
  useStudents,
  useUpdateStudent,
} from "./useStudents";

// ============================================================
// VALIDATION
// ============================================================

const PHONE_NUMBER_REGEX =
  /^\+?[0-9]{7,15}$/;

const studentSchema = z.object({
  studentName: z
    .string()
    .trim()
    .min(
      1,
      "Student name is required.",
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

  courseId: z
    .string()
    .trim()
    .min(
      1,
      "Course is required.",
    ),

  section: z
    .string()
    .trim()
    .min(
      1,
      "Section is required.",
    ),

  semester: z
    .number()
    .int(
      "Semester must be a whole number.",
    )
    .min(
      1,
      "Semester must be at least 1.",
    )
    .max(
      8,
      "Semester cannot be greater than 8.",
    ),
});

type StudentFormValues =
  z.infer<typeof studentSchema>;

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

  // Backend currently returns duplicate-phone
  // errors as plain text.
  if (
    typeof data === "string" &&
    data.trim()
  ) {
    return data.trim();
  }

  // Also support:
  // { message: "..." }
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

  // Also support:
  // { error: "..." }
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

export default function AdminStudents() {
  const navigate =
    useNavigate();

  // ----------------------------------------------------------
  // FILTERS
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // MODALS
  // ----------------------------------------------------------

  const [
    isModalOpen,
    setIsModalOpen,
  ] = useState(false);

  const [
    editingStudent,
    setEditingStudent,
  ] = useState<Student | null>(
    null,
  );

  const [
    deletingStudent,
    setDeletingStudent,
  ] = useState<Student | null>(
    null,
  );

  const [
    promotingStudent,
    setPromotingStudent,
  ] = useState<Student | null>(
    null,
  );

  const [
    statusStudent,
    setStatusStudent,
  ] = useState<Student | null>(
    null,
  );

  // ----------------------------------------------------------
  // QUERIES
  // ----------------------------------------------------------

  const {
    data: courses = [],
    isLoading: coursesLoading,
  } = useCourses();

  const {
    data: students = [],
    isLoading: studentsLoading,
    isError: studentsError,
    refetch: refetchStudents,
  } = useStudents({
    courseId:
      courseFilter || undefined,

    section:
      sectionFilter || undefined,

    semester:
      semesterFilter
        ? Number(semesterFilter)
        : undefined,
  });

  // ----------------------------------------------------------
  // MUTATIONS
  // ----------------------------------------------------------

  const createStudent =
    useCreateStudent();

  const updateStudent =
    useUpdateStudent();

  const deleteStudent =
    useDeleteStudent();

  const promoteStudent =
    usePromoteStudent();

  const setStudentActive =
    useSetStudentActive();

  // ----------------------------------------------------------
  // FORM
  // ----------------------------------------------------------

  const form =
    useForm<StudentFormValues>({
      resolver:
        zodResolver(
          studentSchema,
        ),

      defaultValues: {
        studentName: "",
        phoneNumber: "",
        courseId: "",
        section: "",
        semester: 1,
      },
    });

  const isEditing =
    editingStudent !== null;

  const isSaving =
    createStudent.isPending ||
    updateStudent.isPending;

  // ----------------------------------------------------------
  // COURSE OPTIONS
  // ----------------------------------------------------------

  const courseOptions =
    useMemo(
      () =>
        courses.map(
          (course) => ({
            value:
              course.courseId,

            label:
              `${course.courseName} (${course.courseId})`,
          }),
        ),
      [courses],
    );

  const formCourseOptions =
    useMemo(
      () => [
        {
          value: "",
          label: "Select course",
        },

        ...courses.map(
          (course) => ({
            value:
              course.courseId,

            label:
              `${course.courseName} (${course.courseId})`,
          }),
        ),
      ],
      [courses],
    );

  const courseFilterOptions =
    useMemo(
      () => [
        {
          value: "",
          label: "All courses",
        },

        ...courseOptions,
      ],
      [courseOptions],
    );

  const semesterOptions = [
    {
      value: "",
      label: "All semesters",
    },
    {
      value: "1",
      label: "Semester 1",
    },
    {
      value: "2",
      label: "Semester 2",
    },
    {
      value: "3",
      label: "Semester 3",
    },
    {
      value: "4",
      label: "Semester 4",
    },
    {
      value: "5",
      label: "Semester 5",
    },
    {
      value: "6",
      label: "Semester 6",
    },
    {
      value: "7",
      label: "Semester 7",
    },
    {
      value: "8",
      label: "Semester 8",
    },
  ];

  // ----------------------------------------------------------
  // MODAL HELPERS
  // ----------------------------------------------------------

  const openCreateModal =
    () => {
      setEditingStudent(null);

      form.reset({
        studentName: "",
        phoneNumber: "",
        courseId: "",
        section: "",
        semester: 1,
      });

      setIsModalOpen(true);
    };

  const openEditModal = (
    student: Student,
  ) => {
    setEditingStudent(student);

    form.reset({
      studentName:
        student.studentName,

      phoneNumber:
        student.phoneNumber ?? "",

      courseId:
        student.course.courseId,

      section:
        student.section,

      semester:
        student.semester,
    });

    setIsModalOpen(true);
  };

  const closeModal =
    () => {
      if (isSaving) {
        return;
      }

      setIsModalOpen(false);
      setEditingStudent(null);

      form.reset({
        studentName: "",
        phoneNumber: "",
        courseId: "",
        section: "",
        semester: 1,
      });
    };

  // ----------------------------------------------------------
  // CREATE / UPDATE
  // ----------------------------------------------------------

  const onSubmit =
    async (
      values: StudentFormValues,
    ) => {
      const course =
        courses.find(
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

      try {
        if (editingStudent) {
          await updateStudent.mutateAsync(
            {
              id:
                editingStudent.studentId,

              student: {
                studentName:
                  values.studentName.trim(),

                phoneNumber:
                  values.phoneNumber.trim(),

                section:
                  values.section.trim(),

                semester:
                  values.semester,

                course,
              },
            },
          );

          toast.success(
            "Student updated successfully.",
          );
        } else {
          await createStudent.mutateAsync(
            {
              studentName:
                values.studentName.trim(),

              phoneNumber:
                values.phoneNumber.trim(),

              section:
                values.section.trim(),

              semester:
                values.semester,

              course,
            },
          );

          toast.success(
            "Student created successfully.",
          );
        }

        closeModal();

      } catch (error) {
        toast.error(
          getResponseErrorMessage(
            error,
            editingStudent
              ? "Unable to update the student."
              : "Unable to create the student.",
          ),
        );
      }
    };

  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------

  const handleDelete =
    async () => {
      if (!deletingStudent) {
        return;
      }

      try {
        await deleteStudent.mutateAsync(
          deletingStudent.studentId,
        );

        toast.success(
          "Student deleted successfully.",
        );

        setDeletingStudent(null);

      } catch (error) {
        toast.error(
          getResponseErrorMessage(
            error,
            "Unable to delete the student.",
          ),
        );
      }
    };

  // ----------------------------------------------------------
  // PROMOTE
  // ----------------------------------------------------------

  const handlePromote =
    async () => {
      if (!promotingStudent) {
        return;
      }

      /*
       * Semester 8 is the final semester.
       * Never allow a Semester 8 -> Semester 9 promotion.
       *
       * Backend validation also remains authoritative.
       */
      if (
        promotingStudent.semester >= 8
      ) {
        toast.error(
          "Semester 8 students cannot be promoted further.",
        );

        setPromotingStudent(null);

        return;
      }

      try {
        await promoteStudent.mutateAsync(
          promotingStudent.studentId,
        );

        toast.success(
          `${promotingStudent.studentName} was promoted successfully.`,
        );

        setPromotingStudent(null);

      } catch (error) {
        toast.error(
          getResponseErrorMessage(
            error,
            "Unable to promote the student.",
          ),
        );
      }
    };

  // ----------------------------------------------------------
  // ACTIVATE / DEACTIVATE
  // ----------------------------------------------------------

  const handleToggleStatus =
    async () => {
      if (!statusStudent) {
        return;
      }

      try {
        await setStudentActive.mutateAsync(
          {
            id:
              statusStudent.studentId,

            active:
              !statusStudent.active,
          },
        );

        toast.success(
          statusStudent.active
            ? "Student account deactivated."
            : "Student account activated.",
        );

        setStatusStudent(null);

      } catch (error) {
        toast.error(
          getResponseErrorMessage(
            error,
            "Unable to update student status.",
          ),
        );
      }
    };

  // ----------------------------------------------------------
  // TABLE COLUMNS
  // ----------------------------------------------------------

  const columns = [
    {
      key: "student",
      header: "Student",
      sortable: true,

      render: (
        student: Student,
      ) => (
        <div className="flex items-center gap-3">
          <Avatar
            name={
              student.studentName
            }
            id={
              student.studentId
            }
            size="sm"
          />

          <div className="min-w-0">
            <p className="truncate font-medium text-heading">
              {
                student.studentName
              }
            </p>

            <p className="text-body-sm text-muted">
              {student.studentId}
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
        student: Student,
      ) => (
        <div>
          <p className="font-medium text-heading">
            {
              student.course
                .courseName
            }
          </p>

          <p className="text-body-sm text-muted">
            {
              student.course
                .courseId
            }
          </p>
        </div>
      ),
    },

    {
      key: "section",
      header: "Section",
      sortable: true,

      render: (
        student: Student,
      ) => (
        <span className="inline-flex items-center rounded-full bg-secondary-50 px-2.5 py-1 text-body-sm font-medium text-secondary-700">
          {student.section}
        </span>
      ),
    },

    {
      key: "semester",
      header: "Semester",
      sortable: true,

      render: (
        student: Student,
      ) => (
        <span className="inline-flex items-center rounded-full bg-tertiary-100 px-2.5 py-1 text-body-sm font-medium text-neutral-700">
          {student.semester}
        </span>
      ),
    },

    {
      key: "active",
      header: "Status",
      sortable: true,

      render: (
        student: Student,
      ) => (
        <StatusPill
          status={
            student.active
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
        student: Student,
      ) => {

        const isSemester8 =
          student.semester >= 8;

        return (
          <div className="flex items-center justify-end gap-1">

            {/* VIEW */}

            <Button
              variant="icon"
              size="sm"
              title="View student"
              aria-label={`View ${student.studentName}`}
              onClick={() =>
                navigate(
                  `/admin/students/${encodeURIComponent(
                    student.studentId,
                  )}`,
                )
              }
            >
              <Eye
                size={17}
                aria-hidden="true"
              />
            </Button>

            {/* EDIT */}

            <Button
              variant="icon"
              size="sm"
              title="Edit student"
              aria-label={`Edit ${student.studentName}`}
              onClick={() =>
                openEditModal(
                  student,
                )
              }
            >
              <Pencil
                size={17}
                aria-hidden="true"
              />
            </Button>

            {/* PROMOTE */}

            <Button
              variant="icon"
              size="sm"
              title={
                isSemester8
                  ? "Semester 8 students cannot be promoted"
                  : "Promote student"
              }
              aria-label={
                isSemester8
                  ? `${student.studentName} is already in Semester 8`
                  : `Promote ${student.studentName}`
              }
              disabled={
                isSemester8 ||
                promoteStudent.isPending
              }
              onClick={() => {

                if (isSemester8) {
                  return;
                }

                setPromotingStudent(
                  student,
                );
              }}
            >
              <UserPlus
                size={17}
                aria-hidden="true"
              />
            </Button>

            {/* ACTIVATE / DEACTIVATE */}

            <Button
              variant="icon"
              size="sm"
              title={
                student.active
                  ? "Deactivate"
                  : "Activate"
              }
              aria-label={
                student.active
                  ? `Deactivate ${student.studentName}`
                  : `Activate ${student.studentName}`
              }
              onClick={() =>
                setStatusStudent(
                  student,
                )
              }
            >
              {student.active ? (
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

            {/* DELETE */}

            <Button
              variant="icon"
              size="sm"
              title="Delete student"
              aria-label={`Delete ${student.studentName}`}
              onClick={() =>
                setDeletingStudent(
                  student,
                )
              }
            >
              <Trash2
                size={17}
                aria-hidden="true"
              />
            </Button>

          </div>
        );
      },
    },
  ];

  // ----------------------------------------------------------
  // ERROR STATE
  // ----------------------------------------------------------

  if (studentsError) {
    return (
      <div className="space-y-6">

        <div className="pl-4 sm:pl-6 lg:pl-8">

          <p className="text-body-sm font-medium text-primary-600">
            Academic Management
          </p>

          <h1 className="mt-1 font-heading text-h2 text-heading">
            Students
          </h1>

          <p className="mt-2 text-body text-muted">
            Manage student records,
            academic details and account status.
          </p>

        </div>

        <Card className="border-danger/20 bg-danger-bg">

          <div className="p-1">

            <h2 className="font-heading text-h3 text-danger-text">
              Unable to load students
            </h2>

            <p className="mt-2 text-body-sm text-danger-text">
              Something went wrong while
              loading the student list.
            </p>

            <Button
              variant="secondary"
              size="md"
              className="mt-4"
              onClick={() =>
                void refetchStudents()
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

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div className="pl-4 sm:pl-6 lg:pl-8">

          <p className="text-body-sm font-medium text-primary-600">
            Academic Management
          </p>

          <h1 className="mt-1 font-heading text-h2 text-heading">
            Students
          </h1>

          <p className="mt-2 max-w-2xl text-body text-muted">
            Manage student records,
            academic details and account status.
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

          Add Student
        </Button>

      </div>

      {/* FILTERS */}

      <Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <Select
            label="Course"
            options={
              courseFilterOptions
            }
            value={
              courseFilter
            }
            onChange={(event) =>
              setCourseFilter(
                event.target.value,
              )
            }
            disabled={
              coursesLoading
            }
          />

          <Input
            label="Section"
            placeholder="e.g. A"
            value={
              sectionFilter
            }
            onChange={(event) =>
              setSectionFilter(
                event.target.value,
              )
            }
          />

          <Select
            label="Semester"
            options={
              semesterOptions
            }
            value={
              semesterFilter
            }
            onChange={(event) =>
              setSemesterFilter(
                event.target.value,
              )
            }
          />

        </div>

      </Card>

      {/* TABLE */}

      <DataTable<Student>
        columns={columns}
        data={students}
        loading={
          studentsLoading
        }
        rowKey={(student) =>
          student.studentId
        }
        pageSize={10}
        emptyTitle="No students found"
        emptyMessage="No students match the selected filters."
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

            Add Student
          </Button>
        }
      />

      {/* CREATE / EDIT MODAL */}

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={
          isEditing
            ? "Edit Student"
            : "Add Student"
        }
        description={
          isEditing
            ? "Update the student's academic information."
            : "Create a new student record."
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
              form="student-form"
              loading={isSaving}
            >
              {isEditing
                ? "Save Changes"
                : "Create Student"}
            </Button>
          </>
        }
      >
        <form
          id="student-form"
          onSubmit={form.handleSubmit(
            onSubmit,
          )}
          className="space-y-5"
        >

          {isEditing && (
            <Input
              label="Student ID"
              value={
                editingStudent?.studentId ??
                ""
              }
              disabled
            />
          )}

          <Input
            label="Student Name"
            placeholder="e.g. Baishakhi Paul"
            error={
              form.formState
                .errors
                .studentName
                ?.message
            }
            {...form.register(
              "studentName",
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
            label="Course"
            required
            options={
              formCourseOptions
            }
            value={form.watch(
              "courseId",
            )}
            onChange={(event) =>
              form.setValue(
                "courseId",
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
                .courseId
                ?.message
            }
            disabled={
              coursesLoading
            }
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

            <Input
              label="Section"
              placeholder="e.g. A"
              error={
                form.formState
                  .errors
                  .section
                  ?.message
              }
              {...form.register(
                "section",
              )}
            />

            <Input
              label="Semester"
              type="number"
              min={1}
              max={8}
              error={
                form.formState
                  .errors
                  .semester
                  ?.message
              }
              {...form.register(
                "semester",
                {
                  valueAsNumber:
                    true,
                },
              )}
            />

          </div>

        </form>
      </Modal>

      {/* PROMOTE CONFIRMATION */}

      <ConfirmDialog
        open={
          promotingStudent !==
          null
        }
        onClose={() =>
          setPromotingStudent(
            null,
          )
        }
        onConfirm={
          handlePromote
        }
        title="Promote student?"
        recordName={
          promotingStudent
            ?.studentName ??
          ""
        }
        actionLabel="Promote"
        description={
          promotingStudent
            ? `Promote ${promotingStudent.studentName} to Semester ${promotingStudent.semester + 1}?`
            : ""
        }
      />

      {/* STATUS CONFIRMATION */}

      <ConfirmDialog
        open={
          statusStudent !==
          null
        }
        onClose={() =>
          setStatusStudent(
            null,
          )
        }
        onConfirm={
          handleToggleStatus
        }
        title={
          statusStudent?.active
            ? "Deactivate student?"
            : "Activate student?"
        }
        recordName={
          statusStudent
            ?.studentName ??
          ""
        }
        actionLabel={
          statusStudent?.active
            ? "Deactivate"
            : "Activate"
        }
        description={
          statusStudent?.active
            ? "This will mark the student account as inactive."
            : "This will mark the student account as active again."
        }
      />

      {/* DELETE CONFIRMATION */}

      <ConfirmDialog
        open={
          deletingStudent !==
          null
        }
        onClose={() =>
          setDeletingStudent(
            null,
          )
        }
        onConfirm={
          handleDelete
        }
        title="Delete student?"
        recordName={
          deletingStudent
            ?.studentName ??
          ""
        }
        actionLabel="Delete"
        description="Deleting this student is permanent. Linked attendance, subject selections or other records may prevent deletion."
      />

    </div>
  );
}