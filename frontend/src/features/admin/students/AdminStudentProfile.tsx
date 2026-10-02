import {
    ArrowLeft,
    BookOpen,
    CalendarDays,
    GraduationCap,
    UserRound,
    Users,
  } from "lucide-react";

  import {
    useNavigate,
    useParams,
  } from "react-router-dom";

  import Avatar from "../../../components/ui/Avatar";
  import Button from "../../../components/ui/Button";
  import Card from "../../../components/ui/Card";
  import EmptyState from "../../../components/ui/EmptyState";
  import Skeleton from "../../../components/ui/Skeleton";
  import StatusPill from "../../../components/ui/StatusPill";

  import {
    useStudent,
  } from "./useStudents";

  // ============================================================
  // COMPONENT
  // ============================================================

  export default function AdminStudentProfile() {
    const navigate =
      useNavigate();

    const {
      id = "",
    } = useParams<{
      id: string;
    }>();

    // ----------------------------------------------------------
    // LOAD THE SPECIFIC STUDENT
    // ----------------------------------------------------------

    const studentQuery =
      useStudent(id);

    // ----------------------------------------------------------
    // LOADING
    // ----------------------------------------------------------

    if (
      studentQuery.isLoading
    ) {
      return (
        <div className="space-y-6">
          <Button
            variant="ghost"
            size="md"
            type="button"
            onClick={() =>
              navigate(
                "/admin/students",
              )
            }
          >
            <ArrowLeft
              size={17}
              aria-hidden="true"
            />

            Back to Students
          </Button>

          <Card>
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />

              <div className="space-y-2">
                <Skeleton className="h-6 w-56" />

                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </Card>

          <Card>
            <Skeleton className="h-7 w-48" />

            <Skeleton className="mt-2 h-4 w-72" />

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Skeleton className="h-28 w-full" />

              <Skeleton className="h-28 w-full" />

              <Skeleton className="h-28 w-full" />

              <Skeleton className="h-28 w-full" />
            </div>
          </Card>
        </div>
      );
    }

    // ----------------------------------------------------------
    // ERROR / NOT FOUND
    // ----------------------------------------------------------

    if (
      studentQuery.isError ||
      !studentQuery.data
    ) {
      return (
        <div className="space-y-6">
          <Button
            variant="ghost"
            size="md"
            type="button"
            onClick={() =>
              navigate(
                "/admin/students",
              )
            }
          >
            <ArrowLeft
              size={17}
              aria-hidden="true"
            />

            Back to Students
          </Button>

          <Card>
            <EmptyState
              icon={
                <UserRound
                  size={24}
                />
              }
              title="Student not found"
              description="The selected student could not be loaded. The student may have been removed or the ID may be invalid."
              action={{
                label:
                  "Back to Students",

                onClick: () =>
                  navigate(
                    "/admin/students",
                  ),
              }}
            />
          </Card>
        </div>
      );
    }

    const student =
      studentQuery.data;

    // ----------------------------------------------------------
    // RENDER
    // ----------------------------------------------------------

    return (
      <div className="space-y-6">
        {/* ====================================================
            BACK
            ==================================================== */}

        <Button
          variant="ghost"
          size="md"
          type="button"
          onClick={() =>
            navigate(
              "/admin/students",
            )
          }
        >
          <ArrowLeft
            size={17}
            aria-hidden="true"
          />

          Back to Students
        </Button>

        {/* ====================================================
            STUDENT HEADER
            ==================================================== */}

        <Card>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar
                name={
                  student.studentName
                }
                id={
                  student.studentId
                }
                size="xl"
              />

              <div className="min-w-0">
                <p className="text-caption font-medium text-primary-600">
                  STUDENT PROFILE
                </p>

                <h1 className="mt-1 truncate font-heading text-h1 text-heading">
                  {
                    student.studentName
                  }
                </h1>

                <p className="mt-1 font-mono text-body-sm text-muted">
                  {
                    student.studentId
                  }
                </p>
              </div>
            </div>

            <StatusPill
              status={
                student.active
                  ? "Active"
                  : "Inactive"
              }
              animateChange
            />
          </div>
        </Card>

        {/* ====================================================
            ACADEMIC INFORMATION
            ==================================================== */}

        <Card>
          <div>
            <h2 className="font-heading text-h2 text-heading">
              Academic Information
            </h2>

            <p className="mt-1 text-body-sm text-muted">
              Current academic details for this student.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">

            {/* ------------------------------------------------
                COURSE
                ------------------------------------------------ */}

            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <GraduationCap
                    size={18}
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-caption text-muted">
                    Course
                  </p>

                  <p className="mt-1 font-heading text-body-sm font-semibold text-heading">
                    {
                      student.course
                        .courseName
                    }
                  </p>

                  <p className="mt-1 font-mono text-caption text-muted">
                    {
                      student.course
                        .courseId
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------
                DEPARTMENT
                ------------------------------------------------ */}

            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600">
                  <BookOpen
                    size={18}
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-caption text-muted">
                    Department
                  </p>

                  <p className="mt-1 font-heading text-body-sm font-semibold text-heading">
                    {
                      student.course
                        .department
                        .deptName
                    }
                  </p>

                  <p className="mt-1 font-mono text-caption text-muted">
                    {
                      student.course
                        .department
                        .deptId
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------
                SEMESTER
                ------------------------------------------------ */}

            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <CalendarDays
                    size={18}
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <p className="text-caption text-muted">
                    Semester
                  </p>

                  <p className="mt-1 font-heading text-body-sm font-semibold text-heading">
                    Semester{" "}
                    {
                      student.semester
                    }
                  </p>

                  <p className="mt-1 text-caption text-muted">
                    Current academic semester
                  </p>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------
                SECTION
                ------------------------------------------------ */}

            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <Users
                    size={18}
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <p className="text-caption text-muted">
                    Section
                  </p>

                  <p className="mt-1 font-heading text-body-sm font-semibold text-heading">
                    Section{" "}
                    {
                      student.section
                    }
                  </p>

                  <p className="mt-1 text-caption text-muted">
                    Current class section
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ====================================================
            ACCOUNT INFORMATION
            ==================================================== */}

        <Card>
          <div>
            <h2 className="font-heading text-h2 text-heading">
              Account Information
            </h2>

            <p className="mt-1 text-body-sm text-muted">
              CampusHub account information for this student.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">

            <div className="rounded-lg border border-neutral-200 p-5">
              <p className="text-caption text-muted">
                Student ID
              </p>

              <p className="mt-2 font-mono text-body-sm font-semibold text-heading">
                {
                  student.studentId
                }
              </p>
            </div>

            <div className="rounded-lg border border-neutral-200 p-5">
              <p className="text-caption text-muted">
                Student Name
              </p>

              <p className="mt-2 text-body-sm font-semibold text-heading">
                {
                  student.studentName
                }
              </p>
            </div>

            <div className="rounded-lg border border-neutral-200 p-5">
              <p className="text-caption text-muted">
                Account Status
              </p>

              <div className="mt-2">
                <StatusPill
                  status={
                    student.active
                      ? "Active"
                      : "Inactive"
                  }
                />
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 p-5">
              <p className="text-caption text-muted">
                Academic Group
              </p>

              <p className="mt-2 text-body-sm font-semibold text-heading">
                {
                  student.course
                    .courseName
                }{" "}
                · Section{" "}
                {
                  student.section
                }
              </p>
            </div>
          </div>
        </Card>

        {/* ====================================================
            BACK
            ==================================================== */}

        <div className="flex justify-start">
          <Button
            variant="secondary"
            type="button"
            onClick={() =>
              navigate(
                "/admin/students",
              )
            }
          >
            <ArrowLeft
              size={16}
              aria-hidden="true"
            />

            Back to Students
          </Button>
        </div>
      </div>
    );
  }