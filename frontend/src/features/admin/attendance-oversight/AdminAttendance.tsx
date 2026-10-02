import { useMemo, useState } from "react";
import {
  ClipboardCheck,
  Pencil,
} from "lucide-react";
import toast from "react-hot-toast";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import DataTable from "../../../components/ui/DataTable";
import EmptyState from "../../../components/ui/EmptyState";
import Modal from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import Skeleton from "../../../components/ui/Skeleton";
import StatusPill from "../../../components/ui/StatusPill";

import type {
  Attendance,
} from "../../../lib/api/types";

import {
  useCourses,
} from "../courses/useCourses";

import {
  useStudents,
} from "../students/useStudents";

import {
  useSubjects,
} from "../subjects/useSubjects";

import {
  useClassSessions,
} from "../timetable/useClassSessions";

import {
  useAdminAttendance,
  useCorrectAttendance,
  useAdminAttendanceRecord,
} from "./useAdminAttendance";

// ============================================================
// TYPES
// ============================================================

type AttendanceView =
  | "session"
  | "subject"
  | "course"
  | "student";

type SelectedAttendanceRecord = {
  sessionId: string;
  studentId: string;
  currentStatus:
    | "Present"
    | "Absent";
};

// ============================================================
// HELPERS
// ============================================================

function formatDate(
  isoDate: string,
): string {
  const [year, month, day] =
    isoDate.split("-");

  if (
    !year ||
    !month ||
    !day
  ) {
    return isoDate;
  }

  return `${day}/${month}/${year}`;
}

function getStatus(
  status: string,
): "Present" | "Absent" {
  return status
    .trim()
    .toLowerCase() === "present"
    ? "Present"
    : "Absent";
}

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
    typeof response?.data ===
      "string" &&
    response.data.trim()
  ) {
    return response.data;
  }

  return fallback;
}

// ============================================================
// COMPONENT
// ============================================================

export default function AdminAttendance() {
  // ----------------------------------------------------------
  // FILTER MODE
  // ----------------------------------------------------------

  const [
    viewBy,
    setViewBy,
  ] =
    useState<AttendanceView>(
      "session",
    );

  const [
    selectedFilterId,
    setSelectedFilterId,
  ] = useState("");

  // ----------------------------------------------------------
  // EDIT MODAL
  // ----------------------------------------------------------

  const [
    editingRecord,
    setEditingRecord,
  ] =
    useState<SelectedAttendanceRecord | null>(
      null,
    );

  const [
    editStatus,
    setEditStatus,
  ] = useState<
    "Present" | "Absent"
  >("Present");

  // ----------------------------------------------------------
  // REFERENCE QUERIES
  // ----------------------------------------------------------

  const coursesQuery =
    useCourses();

  const subjectsQuery =
    useSubjects();

  const studentsQuery =
    useStudents();

  const sessionsQuery =
    useClassSessions();

  // ----------------------------------------------------------
  // ATTENDANCE QUERY
  // ----------------------------------------------------------

  const attendanceFilter =
    selectedFilterId
      ? {
          type: viewBy,
          id: selectedFilterId,
        } as const
      : null;

  const attendanceQuery =
    useAdminAttendance(
      attendanceFilter,
    );

  // ----------------------------------------------------------
  // SINGLE RECORD QUERY
  // ----------------------------------------------------------

  const singleRecordQuery =
    useAdminAttendanceRecord(
      editingRecord?.sessionId ??
        "",
      editingRecord?.studentId ??
        "",
    );

  // ----------------------------------------------------------
  // MUTATION
  // ----------------------------------------------------------

  const correctMutation =
    useCorrectAttendance();

  // ----------------------------------------------------------
  // FILTER LABELS
  // ----------------------------------------------------------

  const filterOptions =
    useMemo(
      () => [
        {
          value: "session",
          label: "Class Session",
        },
        {
          value: "subject",
          label: "Subject",
        },
        {
          value: "course",
          label: "Course",
        },
        {
          value: "student",
          label: "Student",
        },
      ],
      [],
    );

  // ----------------------------------------------------------
  // REFERENCE OPTIONS
  // ----------------------------------------------------------

  const sessionOptions =
    useMemo(
      () =>
        (
          sessionsQuery.data ??
          []
        )
          .slice()
          .sort((first, second) =>
            `${second.day}-${second.startTime}`.localeCompare(
              `${first.day}-${first.startTime}`,
            ),
          )
          .map((session) => ({
            value:
              session.sessionId,

            label:
              `${formatDate(session.day)} · ${session.teaching.subject.subjectName} · ${session.section} · ${session.teaching.professor.professorName}`,
          })),
      [sessionsQuery.data],
    );

  const subjectOptions =
    useMemo(
      () =>
        (
          subjectsQuery.data ??
          []
        )
          .slice()
          .sort((first, second) =>
            first.subjectName.localeCompare(
              second.subjectName,
            ),
          )
          .map((subject) => ({
            value:
              subject.subjectId,

            label:
              `${subject.subjectName} (${subject.subjectId})`,
          })),
      [subjectsQuery.data],
    );

  const courseOptions =
    useMemo(
      () =>
        (
          coursesQuery.data ??
          []
        )
          .slice()
          .sort((first, second) =>
            first.courseName.localeCompare(
              second.courseName,
            ),
          )
          .map((course) => ({
            value:
              course.courseId,

            label:
              `${course.courseName} (${course.courseId})`,
          })),
      [coursesQuery.data],
    );

  const studentOptions =
    useMemo(
      () =>
        (
          studentsQuery.data ??
          []
        )
          .slice()
          .sort((first, second) =>
            first.studentName.localeCompare(
              second.studentName,
            ),
          )
          .map((student) => ({
            value:
              student.studentId,

            label:
              `${student.studentName} (${student.studentId})`,
          })),
      [studentsQuery.data],
    );

  // ----------------------------------------------------------
  // CURRENT FILTER OPTIONS
  // ----------------------------------------------------------

  const currentFilterOptions =
    useMemo(() => {
      switch (viewBy) {
        case "session":
          return sessionOptions;

        case "subject":
          return subjectOptions;

        case "course":
          return courseOptions;

        case "student":
          return studentOptions;
      }
    }, [
      courseOptions,
      sessionOptions,
      studentOptions,
      subjectOptions,
      viewBy,
    ]);

  const currentFilterLabel =
    useMemo(() => {
      switch (viewBy) {
        case "session":
          return "Class Session";

        case "subject":
          return "Subject";

        case "course":
          return "Course";

        case "student":
          return "Student";
      }
    }, [viewBy]);

  // ----------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------

  const attendanceRecords =
    attendanceQuery.data ??
    [];

  const presentCount =
    attendanceRecords.filter(
      (record) =>
        getStatus(
          record.status,
        ) === "Present",
    ).length;

  const absentCount =
    attendanceRecords.filter(
      (record) =>
        getStatus(
          record.status,
        ) === "Absent",
    ).length;

  const totalCount =
    presentCount +
    absentCount;

  const attendancePercentage =
    totalCount > 0
      ? Math.round(
          (presentCount /
            totalCount) *
            100,
        )
      : 0;

  // ----------------------------------------------------------
  // FILTER CHANGE
  // ----------------------------------------------------------

  function handleViewByChange(
    value: string,
  ) {
    const nextView =
      value as AttendanceView;

    setViewBy(nextView);
    setSelectedFilterId("");
    setEditingRecord(null);
  }

  // ----------------------------------------------------------
  // OPEN EDIT
  // ----------------------------------------------------------

  function openEdit(
    record: Attendance,
  ) {
    const currentStatus =
      getStatus(record.status);

    setEditingRecord({
      sessionId:
        record.id.sessionId,

      studentId:
        record.id.studentId,

      currentStatus,
    });

    setEditStatus(
      currentStatus,
    );
  }

  // ----------------------------------------------------------
  // CLOSE EDIT
  // ----------------------------------------------------------

  function closeEdit() {
    if (
      correctMutation.isPending
    ) {
      return;
    }

    setEditingRecord(null);
    setEditStatus("Present");
  }

  // ----------------------------------------------------------
  // SAVE CORRECTION
  // ----------------------------------------------------------

  async function handleCorrection() {
    if (!editingRecord) {
      return;
    }

    if (
      editStatus ===
      editingRecord.currentStatus
    ) {
      toast.error(
        "No attendance change was made.",
      );

      return;
    }

    try {
      await correctMutation.mutateAsync(
        {
          sessionId:
            editingRecord.sessionId,

          studentId:
            editingRecord.studentId,

          status:
            editStatus,
        },
      );

      toast.success(
        "Attendance corrected successfully.",
      );

      closeEdit();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to correct attendance.",
        ),
      );
    }
  }

  // ----------------------------------------------------------
  // TABLE COLUMNS
  // ----------------------------------------------------------

  const columns = [
    {
      key: "student",
      header: "Student",
      sortable: true,

      render: (
        record: Attendance,
      ) => (
        <div>
          <p className="font-medium text-heading">
            {
              record.student
                .studentName
            }
          </p>

          <p className="font-mono text-caption text-muted">
            {
              record.student
                .studentId
            }
          </p>
        </div>
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
              record.classSession
                .teaching
                .subject
                .subjectName
            }
          </p>

          <p className="text-caption text-muted">
            {
              record.classSession
                .teaching
                .subject
                .subjectId
            }
          </p>
        </div>
      ),
    },

    {
      key: "course",
      header: "Course",
      sortable: true,

      render: (
        record: Attendance,
      ) => (
        <div>
          <p className="font-medium text-heading">
            {
              record.classSession
                .course
                .courseName
            }
          </p>

          <p className="text-caption text-muted">
            {
              record.classSession
                .course
                .courseId
            }
          </p>
        </div>
      ),
    },

    {
      key: "session",
      header: "Session",
      sortable: true,

      render: (
        record: Attendance,
      ) => (
        <div>
          <p className="font-mono text-caption font-semibold text-heading">
            {
              record.classSession
                .sessionId
            }
          </p>

          <p className="mt-1 text-body-sm text-muted">
            {
              formatDate(
                record
                  .classSession
                  .day,
              )
            }
          </p>
        </div>
      ),
    },

    {
      key: "status",
      header: "Status",
      sortable: true,

      render: (
        record: Attendance,
      ) => (
        <StatusPill
          status={getStatus(
            record.status,
          )}
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
        record: Attendance,
      ) => (
        <div className="flex justify-end">
          <Button
            variant="icon"
            size="sm"
            title="Correct attendance"
            aria-label={`Correct attendance for ${record.student.studentName}`}
            onClick={() =>
              openEdit(record)
            }
          >
            <Pencil
              size={17}
              aria-hidden="true"
            />
          </Button>
        </div>
      ),
    },
  ];

  // ----------------------------------------------------------
  // LOADING REFERENCE DATA
  // ----------------------------------------------------------

  const referenceLoading =
    sessionsQuery.isLoading ||
    subjectsQuery.isLoading ||
    coursesQuery.isLoading ||
    studentsQuery.isLoading;

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="pl-4 sm:pl-6 lg:pl-8">
        <p className="text-body-sm font-medium text-primary-600">
          Oversight
        </p>

        <h1 className="mt-1 font-heading text-h2 text-heading">
          Attendance
        </h1>

        <p className="mt-2 max-w-3xl text-body text-muted">
          Review attendance records across
          sessions, subjects, courses and students.
          Administrators can correct an existing
          attendance status.
        </p>
      </div>

      {/* Filter controls */}

      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
          <Select
            label="View By"
            options={
              filterOptions
            }
            value={viewBy}
            onChange={(event) =>
              handleViewByChange(
                event.target.value,
              )
            }
          />

          <Select
            label={
              currentFilterLabel
            }
            options={[
              {
                value: "",
                label:
                  `Select a ${currentFilterLabel.toLowerCase()}`,
              },
              ...(currentFilterOptions ??
                []),
            ]}
            value={
              selectedFilterId
            }
            onChange={(event) =>
              setSelectedFilterId(
                event.target.value,
              )
            }
            disabled={
              referenceLoading
            }
          />
        </div>
      </Card>

      {/* Summary */}

      {selectedFilterId &&
        !attendanceQuery.isLoading &&
        !attendanceQuery.isError && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <p className="text-caption text-muted">
                Total Records
              </p>

              <p className="mt-2 font-heading text-display text-heading tabular-nums">
                {totalCount}
              </p>
            </Card>

            <Card>
              <p className="text-caption text-muted">
                Present
              </p>

              <p className="mt-2 font-heading text-display text-primary-600 tabular-nums">
                {presentCount}
              </p>
            </Card>

            <Card>
              <p className="text-caption text-muted">
                Absent
              </p>

              <p className="mt-2 font-heading text-display text-danger tabular-nums">
                {absentCount}
              </p>
            </Card>

            <Card className="bg-gradient-warm">
              <p className="text-caption text-neutral-700">
                Attendance
              </p>

              <p className="mt-2 font-heading text-display text-heading tabular-nums">
                {attendancePercentage}%
              </p>

              <p className="mt-1 text-body-sm text-neutral-700">
                Present / total records
              </p>
            </Card>
          </div>
        )}

      {/* Table area */}

      {!selectedFilterId ? (
        <Card>
          <EmptyState
            icon={
              <ClipboardCheck
                size={24}
              />
            }
            title="Choose an attendance view"
            description="Select Session, Subject, Course or Student above, then choose a record to inspect its attendance."
          />
        </Card>
      ) : attendanceQuery.isLoading ? (
        <Card>
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </Card>
      ) : attendanceQuery.isError ? (
        <Card className="border-danger/20 bg-danger-bg">
          <EmptyState
            icon={
              <ClipboardCheck
                size={24}
              />
            }
            title="Unable to load attendance"
            description="Something went wrong while loading the selected attendance records."
            action={{
              label: "Try Again",
              onClick: () =>
                void attendanceQuery.refetch(),
            }}
          />
        </Card>
      ) : (
        <DataTable<Attendance>
          columns={columns}
          data={
            attendanceRecords
          }
          loading={
            attendanceQuery.isLoading
          }
          rowKey={(record) =>
            `${record.id.sessionId}-${record.id.studentId}`
          }
          pageSize={10}
          emptyTitle="No attendance records"
          emptyMessage="There are no attendance records for the selected filter."
        />
      )}

      {/* ======================================================
          CORRECTION MODAL
          ====================================================== */}

      <Modal
        open={
          editingRecord !==
          null
        }
        onClose={
          closeEdit
        }
        title="Correct Attendance"
        description="Change the stored attendance status for this specific student and dated class session."
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={
                closeEdit
              }
              disabled={
                correctMutation.isPending
              }
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={
                handleCorrection
              }
              loading={
                correctMutation.isPending
              }
            >
              Save Correction
            </Button>
          </>
        }
      >
        {editingRecord && (
          <div className="space-y-5">
            {singleRecordQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : singleRecordQuery.isError ? (
              <Card className="border-danger/20 bg-danger-bg">
                <p className="text-body-sm text-danger-text">
                  The attendance record details
                  could not be loaded, but you can
                  still close this dialog.
                </p>
              </Card>
            ) : (
              <>
                <Card className="bg-neutral-50">
                  <div className="space-y-3">
                    <div>
                      <p className="text-caption text-muted">
                        Student
                      </p>

                      <p className="mt-1 font-medium text-heading">
                        {
                          singleRecordQuery
                            .data
                            ?.student
                            .studentName
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-caption text-muted">
                        Class Session
                      </p>

                      <p className="mt-1 font-mono text-body-sm font-semibold text-heading">
                        {
                          singleRecordQuery
                            .data
                            ?.classSession
                            .sessionId
                        }
                      </p>

                      <p className="mt-1 text-body-sm text-muted">
                        {
                          singleRecordQuery
                            .data
                            ?.classSession
                            .teaching
                            .subject
                            .subjectName
                        }{" "}
                        ·{" "}
                        {
                          singleRecordQuery
                            .data
                            ?.classSession
                            .day
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-caption text-muted">
                        Current Status
                      </p>

                      <div className="mt-2">
                        <StatusPill
                          status={
                            getStatus(
                              singleRecordQuery
                                .data
                                ?.status ??
                                editingRecord.currentStatus,
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                <Select
                  label="New Attendance Status"
                  required
                  options={[
                    {
                      value:
                        "Present",
                      label:
                        "Present",
                    },
                    {
                      value:
                        "Absent",
                      label:
                        "Absent",
                    },
                  ]}
                  value={
                    editStatus
                  }
                  onChange={(event) =>
                    setEditStatus(
                      event.target
                        .value as
                        | "Present"
                        | "Absent",
                    )
                  }
                />
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}