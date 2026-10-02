import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  GraduationCap,
  UserRound,
  Users,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
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
  Attendance,
  SelectsSubject,
  Student,
} from "../../../lib/api/types";

import {
  useProfessorsForStudent,
  useStudent,
  useStudentAttendance,
  useStudentSelectedSubjects,
  useStudentTimetable,
} from "./useStudents";

// ============================================================
// COMPONENT
// ============================================================

export default function AdminStudentDetail() {
  const navigate =
    useNavigate();

  const {
    id = "",
  } = useParams<{
    id: string;
  }>();

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "overview",
  );

  // ----------------------------------------------------------
  // STUDENT
  // ----------------------------------------------------------

  const studentQuery =
    useStudent(id);

  // ----------------------------------------------------------
  // RELATED DATA
  // ----------------------------------------------------------

  const subjectsQuery =
    useStudentSelectedSubjects(
      id,
    );

  const professorsQuery =
    useProfessorsForStudent(
      id,
    );

  const attendanceQuery =
    useStudentAttendance(
      id,
    );

  const timetableQuery =
    useStudentTimetable(
      id,
    );

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
          <div className="flex items-center gap-5">
            <Skeleton className="h-16 w-16 rounded-full" />

            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />

              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-neutral-200 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
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
  // STUDENT NOT FOUND
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
            description="The student may have been deleted or the requested student ID does not exist."
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
  // RELATED DATA
  // ----------------------------------------------------------

  const selectedSubjects =
    subjectsQuery.data ??
    [];

  const professors =
    professorsQuery.data ??
    [];

  const attendance =
    attendanceQuery.data ??
    [];

  const timetable =
    timetableQuery.data ??
    [];

  // ----------------------------------------------------------
  // ATTENDANCE COUNTS
  // ----------------------------------------------------------

  const attendanceStats =
    useMemo(() => {
      let present = 0;
      let absent = 0;

      for (
        const record of
          attendance
      ) {
        const status =
          record.status
            .trim()
            .toLowerCase();

        if (
          status ===
          "present"
        ) {
          present += 1;
        }

        if (
          status ===
          "absent"
        ) {
          absent += 1;
        }
      }

      const total =
        present + absent;

      const percentage =
        total > 0
          ? (present / total) *
            100
          : 0;

      return {
        present,
        absent,
        total,
        percentage,
      };
    }, [
      attendance,
    ]);

  // ----------------------------------------------------------
  // ATTENDANCE TABLE
  // ----------------------------------------------------------

  const attendanceColumns = [
    {
      key: "date",
      header: "Date",
      sortable: true,

      render: (
        record: Attendance,
      ) => (
        <span className="font-medium text-heading">
          {record.classSession
            ?.day ??
            "—"}
        </span>
      ),
    },

    {
      key: "subject",
      header: "Subject",
      sortable: true,

      render: (
        record: Attendance,
      ) => (
        <div>
          <p className="font-medium text-heading">
            {
              record
                .classSession
                ?.teaching
                ?.subject
                ?.subjectName
            }
          </p>

          <p className="text-caption text-muted">
            {
              record
                .classSession
                ?.teaching
                ?.subject
                ?.subjectId
            }
          </p>
        </div>
      ),
    },

    {
      key: "time",
      header: "Time",

      render: (
        record: Attendance,
      ) => (
        <span className="text-body-sm text-muted">
          {record
            .classSession
            ?.startTime
            ?.slice(
              0,
              5,
            ) ?? "—"}
          {" – "}
          {record
            .classSession
            ?.endTime
            ?.slice(
              0,
              5,
            ) ?? "—"}
        </span>
      ),
    },

    {
      key: "status",
      header: "Status",
      sortable: true,

      render: (
        record: Attendance,
      ) => {
        const isPresent =
          record.status
            .trim()
            .toLowerCase() ===
          "present";

        return (
          <StatusPill
            status={
              isPresent
                ? "Present"
                : "Absent"
            }
            variant={
              isPresent
                ? "present"
                : "absent"
            }
          />
        );
      },
    },
  ];

  // ----------------------------------------------------------
  // SELECTED SUBJECTS TABLE
  // ----------------------------------------------------------

  const subjectColumns = [
    {
      key: "subject",
      header: "Subject",
      sortable: true,

      render: (
        record: SelectsSubject,
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
                record.subject
                  .subjectName
              }
            </p>

            <p className="text-body-sm text-muted">
              {
                record.subject
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
        record: SelectsSubject,
      ) => (
        <div>
          <p className="font-medium text-heading">
            {
              record.subject
                .course
                .courseName
            }
          </p>

          <p className="text-body-sm text-muted">
            {
              record.subject
                .course
                .courseId
            }
          </p>
        </div>
      ),
    },

    {
      key: "department",
      header: "Department",

      render: (
        record: SelectsSubject,
      ) => (
        <div>
          <p className="font-medium text-heading">
            {
              record.subject
                .course
                .department
                .deptName
            }
          </p>

          <p className="text-body-sm text-muted">
            {
              record.subject
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
  // PROFESSOR TABLE
  // ----------------------------------------------------------

  const professorColumns = [
    {
      key: "professor",
      header: "Professor",
      sortable: true,

      render: (
        professor: Student extends never
          ? never
          : typeof professors[number],
      ) => (
        <div className="flex items-center gap-3">
          <Avatar
            name={
              professor.professorName
            }
            id={
              professor.profId
            }
            size="sm"
          />

          <div className="min-w-0">
            <p className="truncate font-medium text-heading">
              {
                professor.professorName
              }
            </p>

            <p className="text-body-sm text-muted">
              {
                professor.profId
              }
            </p>
          </div>
        </div>
      ),
    },

    {
      key: "department",
      header: "Department",
      sortable: true,

      render: (
        professor: typeof professors[number],
      ) => (
        <div>
          <p className="font-medium text-heading">
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
      ),
    },

    {
      key: "status",
      header: "Status",

      render: (
        professor: typeof professors[number],
      ) => (
        <StatusPill
          status={
            professor.active
              ? "Active"
              : "Inactive"
          }
        />
      ),
    },
  ];

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6">
      {/* ====================================================
          BACK
          ==================================================== */}

      <Button
        variant="ghost"
        size="md"
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
          PROFILE HEADER
          ==================================================== */}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
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
              <p className="text-caption text-primary-600">
                STUDENT
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

        {/* ==================================================
            ACADEMIC SUMMARY
            ================================================== */}

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-neutral-200 pt-6 sm:grid-cols-2 lg:grid-cols-4">

          {/* Course */}

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <GraduationCap
                size={18}
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-caption text-muted">
                Course
              </p>

              <p className="mt-1 font-medium text-heading">
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
          </div>

          {/* Department */}

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600">
              <BookOpen
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
                  student.course
                    .department
                    .deptName
                }
              </p>

              <p className="text-body-sm text-muted">
                {
                  student.course
                    .department
                    .deptId
                }
              </p>
            </div>
          </div>

          {/* Semester */}

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-tertiary-100 text-neutral-700">
              <CalendarDays
                size={18}
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-caption text-muted">
                Semester
              </p>

              <p className="mt-1 font-medium text-heading">
                Semester{" "}
                {
                  student.semester
                }
              </p>

              <p className="text-body-sm text-muted">
                Current academic semester
              </p>
            </div>
          </div>

          {/* Section */}

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

              <p className="mt-1 font-medium text-heading">
                Section{" "}
                {
                  student.section
                }
              </p>

              <p className="text-body-sm text-muted">
                Current class section
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ====================================================
          TABS
          ==================================================== */}

      <Card className="p-0">
        <Tabs
          tabs={[
            {
              id: "overview",
              label: "Overview",
            },

            {
              id: "subjects",
              label: "Subjects",
            },

            {
              id: "attendance",
              label: "Attendance",
            },

            {
              id: "timetable",
              label: "Timetable",
            },
          ]}
          activeTab={
            activeTab
          }
          onChange={
            setActiveTab
          }
          ariaLabel="Student details"
          className="px-4 sm:px-6"
        />

        <div className="p-4 sm:p-6">

          {/* ==================================================
              OVERVIEW
              ================================================== */}

          {activeTab ===
            "overview" && (
            <div className="space-y-6">

              {/* Student account */}

              <div>
                <h2 className="font-heading text-h3 text-heading">
                  Student Information
                </h2>

                <p className="mt-1 text-body-sm text-muted">
                  Academic and account information for this student.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-caption text-muted">
                    Student ID
                  </p>

                  <p className="mt-1 font-mono text-body-sm font-semibold text-heading">
                    {
                      student.studentId
                    }
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-caption text-muted">
                    Account Status
                  </p>

                  <p className="mt-1 text-body-sm font-semibold text-heading">
                    {
                      student.active
                        ? "Active account"
                        : "Inactive account"
                    }
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-caption text-muted">
                    Course
                  </p>

                  <p className="mt-1 text-body-sm font-semibold text-heading">
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

                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-caption text-muted">
                    Department
                  </p>

                  <p className="mt-1 text-body-sm font-semibold text-heading">
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

              {/* Attendance snapshot */}

              <div>
                <h2 className="font-heading text-h3 text-heading">
                  Attendance Snapshot
                </h2>

                <p className="mt-1 text-body-sm text-muted">
                  Attendance records currently available for this student.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                <div className="rounded-lg bg-primary-50 p-4">
                  <p className="text-caption text-primary-700">
                    Present
                  </p>

                  <p className="mt-1 font-heading text-2xl font-bold text-primary-700">
                    {
                      attendanceStats.present
                    }
                  </p>
                </div>

                <div className="rounded-lg bg-danger-bg p-4">
                  <p className="text-caption text-danger-text">
                    Absent
                  </p>

                  <p className="mt-1 font-heading text-2xl font-bold text-danger-text">
                    {
                      attendanceStats.absent
                    }
                  </p>
                </div>

                <div className="rounded-lg bg-neutral-100 p-4">
                  <p className="text-caption text-neutral-600">
                    Attendance
                  </p>

                  <p className="mt-1 font-heading text-2xl font-bold text-neutral-800">
                    {
                      attendanceStats.percentage.toFixed(
                        1,
                      )
                    }
                    %
                  </p>
                </div>
              </div>

              {/* Subject / professor counts */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div className="rounded-lg border border-neutral-200 p-4">
                  <p className="text-caption text-muted">
                    Selected Subjects
                  </p>

                  <p className="mt-1 font-heading text-2xl font-bold text-heading">
                    {
                      selectedSubjects.length
                    }
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-200 p-4">
                  <p className="text-caption text-muted">
                    Associated Professors
                  </p>

                  <p className="mt-1 font-heading text-2xl font-bold text-heading">
                    {
                      professors.length
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================
              SUBJECTS
              ================================================== */}

          {activeTab ===
            "subjects" && (
            <div className="space-y-8">

              <div>
                <h2 className="font-heading text-h3 text-heading">
                  Selected Subjects
                </h2>

                <p className="mt-1 text-body-sm text-muted">
                  Subjects currently selected by this student.
                </p>
              </div>

              <DataTable<SelectsSubject>
                columns={
                  subjectColumns
                }
                data={
                  selectedSubjects
                }
                loading={
                  subjectsQuery.isLoading
                }
                rowKey={(
                  record,
                ) =>
                  `${record.id.studentId}-${record.id.subjectId}`
                }
                emptyTitle="No selected subjects"
                emptyMessage="This student does not currently have any selected subjects."
              />

              <div>
                <h2 className="font-heading text-h3 text-heading">
                  Associated Professors
                </h2>

                <p className="mt-1 text-body-sm text-muted">
                  Professors associated with the student's selected subjects.
                </p>
              </div>

              <DataTable
                columns={
                  professorColumns
                }
                data={
                  professors
                }
                loading={
                  professorsQuery.isLoading
                }
                rowKey={(
                  professor,
                ) =>
                  professor.profId
                }
                emptyTitle="No associated professors"
                emptyMessage="No professors are currently associated with this student's selected subjects."
              />
            </div>
          )}

          {/* ==================================================
              ATTENDANCE
              ================================================== */}

          {activeTab ===
            "attendance" && (
            <div className="space-y-5">

              <div>
                <h2 className="font-heading text-h3 text-heading">
                  Attendance History
                </h2>

                <p className="mt-1 text-body-sm text-muted">
                  All attendance records currently stored for this student.
                </p>
              </div>

              {attendanceQuery.isError ? (
                <Card className="border-danger/20 bg-danger-bg">
                  <EmptyState
                    icon={
                      <CalendarDays
                        size={24}
                      />
                    }
                    title="Unable to load attendance"
                    description="Something went wrong while loading this student's attendance records."
                    action={{
                      label:
                        "Try Again",

                      onClick:
                        () =>
                          void attendanceQuery.refetch(),
                    }}
                  />
                </Card>
              ) : (
                <DataTable<Attendance>
                  columns={
                    attendanceColumns
                  }
                  data={
                    attendance
                  }
                  loading={
                    attendanceQuery.isLoading
                  }
                  rowKey={(record) =>
                    `${record.id.sessionId}-${record.id.studentId}`
                  }
                  pageSize={10}
                  emptyTitle="No attendance records"
                  emptyMessage="No attendance has been recorded for this student yet."
                />
              )}
            </div>
          )}

          {/* ==================================================
              TIMETABLE
              ================================================== */}

          {activeTab ===
            "timetable" && (
            <div className="space-y-5">

              <div>
                <h2 className="font-heading text-h3 text-heading">
                  Timetable
                </h2>

                <p className="mt-1 text-body-sm text-muted">
                  Dated class sessions associated with this student's course, section and semester.
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
                    description="Something went wrong while loading this student's timetable."
                    action={{
                      label:
                        "Try Again",

                      onClick:
                        () =>
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
                  emptyMessage="No class sessions found for this student."
                />
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}