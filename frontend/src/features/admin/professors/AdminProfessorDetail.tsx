import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  GraduationCap,
  UserRound,
} from "lucide-react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import Avatar from "../../../components/ui/Avatar";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import DataTable from "../../../components/ui/DataTable";
import EmptyState from "../../../components/ui/EmptyState";
import Skeleton from "../../../components/ui/Skeleton";
import StatusPill from "../../../components/ui/StatusPill";
import Tabs from "../../../components/ui/Tabs";
import ClassSessionAgenda from "../../../components/timetable/ClassSessionAgenda";

import type {
  Professor,
  Teaching,
} from "../../../lib/api/types";
import {
  useProfessor,
  useProfessorSubjects,
  useProfessorTimetable,
} from "./useProfessors";

// ============================================================
// COMPONENT
// ============================================================

export default function AdminProfessorDetail() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const { id } =
    useParams<{
      id: string;
    }>();

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "teaching",
  );

  const routeProfessorId = useMemo(() => {
    if (!id) {
      return "";
    }

    try {
      const base64 = id
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      const padding = "=".repeat(
        (4 - (base64.length % 4)) % 4,
      );

      return atob(
        `${base64}${padding}`,
      );
    } catch {
      return "";
    }
  }, [id]);

  const professorFromNavigation =
    (location.state as {
      professor?: Professor;
    } | null)?.professor;

  const professorId =
    professorFromNavigation?.profId ??
    routeProfessorId;

  // ----------------------------------------------------------
  // QUERIES
  // ----------------------------------------------------------

  const professorQuery =
    useProfessor(
      professorId,
    );

  const subjectsQuery =
    useProfessorSubjects(
      professorId,
    );

  const timetableQuery =
    useProfessorTimetable(
      professorId,
    );

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  if (
    !professorFromNavigation &&
    professorQuery.isLoading
  ) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-32" />

          <div className="mt-3">
            <Skeleton className="h-8 w-72" />
          </div>
        </div>

        <Card>
          <div className="flex items-center gap-5">
            <Skeleton className="h-16 w-16 rounded-full" />

            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </Card>

        <Card>
          <Skeleton className="h-12 w-full" />

          <div className="mt-6 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  // ----------------------------------------------------------
  // PROFESSOR NOT FOUND
  // ----------------------------------------------------------

  if (
    !professorFromNavigation &&
    (
      professorQuery.isError ||
      !professorQuery.data
    )
  ) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="md"
          onClick={() =>
            navigate(
              "/admin/professors",
            )
          }
        >
          <ArrowLeft
            size={17}
            aria-hidden="true"
          />

          Back to Professors
        </Button>

        <Card>
          <EmptyState
            icon={
              <UserRound
                size={24}
              />
            }
            title="Professor not found"
            description="The professor may have been deleted or the requested ID does not exist."
            action={{
              label:
                "Back to Professors",

              onClick: () =>
                navigate(
                  "/admin/professors",
                ),
            }}
          />
        </Card>
      </div>
    );
  }

  const professor =
    professorFromNavigation ??
    professorQuery.data;

  if (!professor) {
    return null;
  }

  const teachings =
    subjectsQuery.data ??
    [];

  const timetable =
    timetableQuery.data ??
    [];

  // ----------------------------------------------------------
  // TEACHING TABLE
  // ----------------------------------------------------------

  const teachingColumns = [
    {
      key: "subject",
      header: "Subject",
      sortable: true,

      render: (
        teaching: Teaching,
      ) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <BookOpen
              size={17}
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <p className="truncate font-medium text-heading">
              {
                teaching.subject
                  .subjectName
              }
            </p>

            <p className="text-body-sm text-muted">
              {
                teaching.subject
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
              teaching.subject
                .course.courseName
            }
          </p>

          <p className="text-body-sm text-muted">
            {
              teaching.subject
                .course.courseId
            }
          </p>
        </div>
      ),
    },

    {
      key: "department",
      header: "Department",
      sortable: true,

      render: (
        teaching: Teaching,
      ) => (
        <div>
          <p className="font-medium text-heading">
            {
              teaching.subject
                .course
                .department
                .deptName
            }
          </p>

          <p className="text-body-sm text-muted">
            {
              teaching.subject
                .course
                .department
                .deptId
            }
          </p>
        </div>
      ),
    },
  ];

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Back button */}

      <Button
        variant="ghost"
        size="md"
        onClick={() =>
          navigate(
            "/admin/professors",
          )
        }
      >
        <ArrowLeft
          size={17}
          aria-hidden="true"
        />

        Back to Professors
      </Button>

      {/* Profile header */}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar
              name={
                professor.professorName
              }
              id={
                professor.profId
              }
              size="xl"
            />

            <div className="min-w-0">
              <p className="text-caption text-primary-600">
                PROFESSOR
              </p>

              <h1 className="mt-1 truncate font-heading text-h1 text-heading">
                {
                  professor.professorName
                }
              </h1>

              <p className="mt-1 font-mono text-body-sm text-muted">
                {professor.profId}
              </p>
            </div>
          </div>

          <StatusPill
            status={
              professor.active
                ? "Active"
                : "Inactive"
            }
            animateChange
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-neutral-200 pt-6 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600">
              <GraduationCap
                size={18}
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-caption text-muted">
                Department
              </p>

              <p className="mt-1 font-medium text-heading">
                {
                  professor
                    .department
                    .deptName
                }
              </p>

              <p className="text-body-sm text-muted">
                {
                  professor
                    .department
                    .deptId
                }
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <UserRound
                size={18}
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-caption text-muted">
                Account Status
              </p>

              <p className="mt-1 font-medium text-heading">
                {professor.active
                  ? "Active account"
                  : "Inactive account"}
              </p>

              <p className="text-body-sm text-muted">
                Managed by administrators
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}

      <Card className="p-0">
        <Tabs
          tabs={[
            {
              id: "teaching",
              label:
                "Teaching Assignments",
            },
            {
              id: "timetable",
              label:
                "Timetable",
            },
          ]}
          activeTab={
            activeTab
          }
          onChange={
            setActiveTab
          }
          ariaLabel="Professor details"
          className="px-4 sm:px-6"
        />

        <div className="p-4 sm:p-6">
          {/* Teaching assignments */}

          {activeTab ===
            "teaching" && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading text-h3 text-heading">
                  Teaching Assignments
                </h2>

                <p className="mt-1 text-body-sm text-muted">
                  Subjects currently assigned
                  to this professor.
                </p>
              </div>

              <DataTable<Teaching>
                columns={
                  teachingColumns
                }
                data={teachings}
                loading={
                  subjectsQuery.isLoading
                }
                rowKey={(teaching) =>
                  `${teaching.id.profId}-${teaching.id.subjectId}`
                }
                emptyTitle="No teaching assignments"
                emptyMessage="This professor does not currently have any teaching assignments."
              />
            </div>
          )}

          {/* Timetable */}

          {activeTab ===
            "timetable" && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading text-h3 text-heading">
                  Timetable
                </h2>

                <p className="mt-1 text-body-sm text-muted">
                  Dated class sessions assigned
                  to this professor.
                </p>
              </div>

              {timetableQuery.isError ? (
                <Card className="border-danger/20 bg-danger-bg">
                  <EmptyState
                    icon={
                      <CalendarDays
                        size={24}
                      />
                    }
                    title="Unable to load timetable"
                    description="Something went wrong while loading this professor's class sessions."
                    action={{
                      label:
                        "Try Again",

                      onClick: () =>
                        void timetableQuery.refetch(),
                    }}
                  />
                </Card>
              ) : (
                <ClassSessionAgenda
                  sessions={
                    timetable
                  }
                  mode="agenda"
                  emptyMessage="No class sessions assigned to this professor."
                />
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}