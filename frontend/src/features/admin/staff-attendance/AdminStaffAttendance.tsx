import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CalendarDays,
  Check,
  Pencil,
  Users,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import DataTable from "../../../components/ui/DataTable";
import EmptyState from "../../../components/ui/EmptyState";
import Modal from "../../../components/ui/Modal";
import StatusPill from "../../../components/ui/StatusPill";
import Tabs from "../../../components/ui/Tabs";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";

import type {
  Admin,
  Professor,
  StaffAttendance,
} from "../../../lib/api/types";

import type {
  StaffAttendanceStatus,
} from "../../../lib/api/endpoints/staffAttendances";

import {
  useAuthStore,
} from "../../../lib/auth/store";

import {
  useAdmins,
} from "../accounts/useAdminAccounts";

import {
  useProfessors,
} from "../professors/useProfessors";

import {
  useAdminStaffAttendance,
  useCreateAdminStaffAttendance,
  useCreateProfessorStaffAttendance,
  useDeleteStaffAttendance,
  useProfessorStaffAttendance,
  useStaffAttendanceByDay,
  useStaffAttendances,
  useUpdateStaffAttendance,
} from "./useStaffAttendance";

import {
  getApiErrorMessage,
} from "../../../lib/utils/errors";

import {
  toIsoDate,
} from "../../../lib/utils/classSession";

type MainTab =
  | "mark"
  | "history";

type HistoryFilter =
  | "all"
  | "professor"
  | "admin"
  | "date";

interface RosterPerson {
  key: string;
  type: "professor" | "admin";
  id: string;
  name: string;
  active: boolean;
}

interface EditingRecord {
  record: StaffAttendance;
}

interface DeletingRecord {
  record: StaffAttendance;
}

function ownerKey(
  type: "professor" | "admin",
  id: string,
): string {
  return `${type}:${id}`;
}

function formatDate(
  isoDate: string,
): string {
  const date = new Date(
    `${isoDate}T00:00:00`,
  );

  if (
    Number.isNaN(date.getTime())
  ) {
    return isoDate;
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function getOwnerName(
  record: StaffAttendance,
): string {
  return (
    record.professor
      ?.professorName ??
    record.admin?.adminName ??
    "Unknown staff"
  );
}

function getOwnerId(
  record: StaffAttendance,
): string {
  return (
    record.professor
      ?.profId ??
    record.admin?.adminId ??
    "—"
  );
}

function getOwnerType(
  record: StaffAttendance,
): "Professor" | "Admin" {
  return record.professor
    ? "Professor"
    : "Admin";
}

export default function AdminStaffAttendance() {
  const [
    activeTab,
    setActiveTab,
  ] = useState<MainTab>("mark");

  const currentUser =
    useAuthStore(
      (state) => state.user,
    );

  const currentAdminId =
    currentUser?.role === "ADMIN"
      ? currentUser.id
      : "";

  const SUPER_ADMIN_ID =
    "ADMIN_hrmNZO331@";

  const today = toIsoDate(
    new Date(),
  );

  // ==========================================================
  // REFERENCE DATA
  // ==========================================================

  const professorsQuery =
    useProfessors();

  const adminsQuery =
    useAdmins(
      currentAdminId ===
        SUPER_ADMIN_ID,
    );

  // ==========================================================
  // TODAY'S RECORDS
  // ==========================================================

  const todayQuery =
    useStaffAttendanceByDay(
      today,
    );

  // ==========================================================
  // ALL HISTORY
  // ==========================================================

  const allHistoryQuery =
    useStaffAttendances();

  // ==========================================================
  // HISTORY FILTERS
  // ==========================================================

  const [
    historyFilter,
    setHistoryFilter,
  ] = useState<HistoryFilter>(
    "all",
  );

  const [
    selectedProfessorId,
    setSelectedProfessorId,
  ] = useState("");

  const [
    selectedAdminId,
    setSelectedAdminId,
  ] = useState("");

  const [
    selectedDate,
    setSelectedDate,
  ] = useState("");

  const professorHistoryQuery =
    useProfessorStaffAttendance(
      selectedProfessorId,
    );

  const adminHistoryQuery =
    useAdminStaffAttendance(
      currentAdminId ===
        SUPER_ADMIN_ID
        ? selectedAdminId
        : "",
    );

  const dateHistoryQuery =
    useStaffAttendanceByDay(
      selectedDate,
    );

  // ==========================================================
  // MUTATIONS
  // ==========================================================

  const createProfessorMutation =
    useCreateProfessorStaffAttendance();

  const createAdminMutation =
    useCreateAdminStaffAttendance();

  const updateMutation =
    useUpdateStaffAttendance();

  const deleteMutation =
    useDeleteStaffAttendance();

  // ==========================================================
  // TODAY'S ATTENDANCE STATE
  // ==========================================================

  const [
    todaySelections,
    setTodaySelections,
  ] = useState<
    Record<
      string,
      StaffAttendanceStatus | undefined
    >
  >({});

  // ==========================================================
  // EDIT / DELETE STATE
  // ==========================================================

  const [
    editingRecord,
    setEditingRecord,
  ] = useState<
    EditingRecord | null
  >(null);

  const [
    deletingRecord,
    setDeletingRecord,
  ] = useState<
    DeletingRecord | null
  >(null);

  const [
    editStatus,
    setEditStatus,
  ] = useState<StaffAttendanceStatus>(
    "Present",
  );

  // ==========================================================
  // COMBINED PROFESSOR + ADMIN ROSTER
  // ==========================================================

  const roster = useMemo(() => {
    const professorRows: RosterPerson[] = (
      professorsQuery.data ?? []
    ).map(
      (
        professor: Professor,
      ) => ({
        key: ownerKey(
          "professor",
          professor.profId,
        ),
        type: "professor",
        id: professor.profId,
        name: professor.professorName,
        active: professor.active,
      }),
    );

    const adminRows: RosterPerson[] = (
      currentAdminId ===
        SUPER_ADMIN_ID
        ? adminsQuery.data ?? []
        : []
    )
      .filter(
        (admin: Admin) =>
          admin.adminId !==
          currentAdminId,
      )
      .map(
        (admin: Admin) => ({
          key: ownerKey(
            "admin",
            admin.adminId,
          ),
          type: "admin",
          id: admin.adminId,
          name: admin.adminName,
          active: admin.active,
        }),
      );

    return [
      ...professorRows,
      ...adminRows,
    ].sort((first, second) =>
      first.name.localeCompare(
        second.name,
      ),
    );
  }, [
    adminsQuery.data,
    currentAdminId,
    professorsQuery.data,
  ]);

  // ==========================================================
  // TODAY'S EXISTING RECORDS
  // ==========================================================

  const todayRecordMap =
    useMemo(() => {
      const map = new Map<
        string,
        StaffAttendance
      >();

      for (const record of
        todayQuery.data ?? []) {
        if (record.professor) {
          map.set(
            ownerKey(
              "professor",
              record.professor.profId,
            ),
            record,
          );
        }

        if (record.admin) {
          map.set(
            ownerKey(
              "admin",
              record.admin.adminId,
            ),
            record,
          );
        }
      }

      return map;
    }, [todayQuery.data]);

  // ==========================================================
  // PREFILL TODAY'S EXISTING STATUS
  // ==========================================================

  useEffect(() => {
    setTodaySelections(
      (current) => {
        const next = {
          ...current,
        };

        for (const [
          key,
          record,
        ] of todayRecordMap.entries()) {
          const normalized =
            record.status
              .trim()
              .toLowerCase();

          if (
            normalized ===
              "present" ||
            normalized === "absent"
          ) {
            next[key] =
              normalized ===
              "present"
                ? "Present"
                : "Absent";
          }
        }

        return next;
      },
    );
  }, [todayRecordMap]);

  // ==========================================================
  // TODAY SUMMARY
  // ==========================================================

  const todaySummary = useMemo(() => {
    const recorded =
      roster.filter(
        (person) =>
          todayRecordMap.has(
            person.key,
          ),
      ).length;

    const selected =
      roster.filter(
        (person) =>
          Boolean(
            todaySelections[
              person.key
            ],
          ),
      ).length;

    const present =
      roster.filter(
        (person) =>
          todaySelections[
            person.key
          ] === "Present",
      ).length;

    const absent =
      roster.filter(
        (person) =>
          todaySelections[
            person.key
          ] === "Absent",
      ).length;

    return {
      total: roster.length,
      recorded,
      selected,
      present,
      absent,
      unmarked:
        roster.length - selected,
    };
  }, [
    roster,
    todayRecordMap,
    todaySelections,
  ]);

  // ==========================================================
  // HISTORY DATA
  // ==========================================================

  const historyRecords =
    useMemo(() => {
      switch (historyFilter) {
        case "professor":
          return (
            professorHistoryQuery.data ??
            []
          );

        case "admin":
          return (
            adminHistoryQuery.data ??
            []
          );

        case "date":
          return (
            dateHistoryQuery.data ??
            []
          );

        case "all":
        default:
          return (
            allHistoryQuery.data ??
            []
          );
      }
    }, [
      adminHistoryQuery.data,
      allHistoryQuery.data,
      dateHistoryQuery.data,
      historyFilter,
      professorHistoryQuery.data,
    ]);

  const historyLoading =
    historyFilter ===
    "professor"
      ? professorHistoryQuery.isLoading
      : historyFilter ===
          "admin"
        ? adminHistoryQuery.isLoading
        : historyFilter ===
            "date"
          ? dateHistoryQuery.isLoading
          : allHistoryQuery.isLoading;

  const historyError =
    historyFilter ===
    "professor"
      ? professorHistoryQuery.isError
      : historyFilter ===
          "admin"
        ? adminHistoryQuery.isError
        : historyFilter ===
            "date"
          ? dateHistoryQuery.isError
          : allHistoryQuery.isError;

  // ==========================================================
  // TODAY ACTIONS
  // ==========================================================

  function setTodayStatus(
    key: string,
    status: StaffAttendanceStatus,
  ) {
    setTodaySelections(
      (current) => ({
        ...current,
        [key]: status,
      }),
    );
  }

  function markAllPresent() {
    setTodaySelections(
      Object.fromEntries(
        roster.map((person) => [
          person.key,
          "Present" as const,
        ]),
      ),
    );
  }

  function clearAllUnmarked() {
    setTodaySelections(
      (current) => {
        const next = {
          ...current,
        };

        for (const person of
          roster) {
          if (
            !todayRecordMap.has(
              person.key,
            )
          ) {
            next[person.key] =
              undefined;
          }
        }

        return next;
      },
    );
  }

  async function saveTodayAttendance() {
    const changed =
      roster.filter((person) => {
        const selected =
          todaySelections[
            person.key
          ];

        if (!selected) {
          return false;
        }

        const existing =
          todayRecordMap.get(
            person.key,
          );

        if (!existing) {
          return true;
        }

        return (
          existing.status
            .trim()
            .toLowerCase() !==
          selected.toLowerCase()
        );
      });

    const unmarked =
      roster.filter(
        (person) =>
          !todaySelections[
            person.key
          ],
      );

    if (unmarked.length > 0) {
      toast.error(
        `Please mark ${unmarked.length} remaining staff member${
          unmarked.length ===
          1
            ? ""
            : "s"
        }.`,
      );

      return;
    }

    if (changed.length === 0) {
      toast.success(
        "Today's staff attendance is already up to date.",
      );

      return;
    }

    const results =
      await Promise.allSettled(
        changed.map((person) => {
          const status =
            todaySelections[
              person.key
            ] as StaffAttendanceStatus;

          const existing =
            todayRecordMap.get(
              person.key,
            );

          if (existing) {
            return updateMutation.mutateAsync(
              {
                attendanceId:
                  existing.attendanceId,
                status,
              },
            );
          }

          if (
            person.type ===
            "professor"
          ) {
            return createProfessorMutation.mutateAsync(
              {
                professor: {
                  profId:
                    person.id,
                },
                day: today,
                status,
              },
            );
          }

          return createAdminMutation.mutateAsync(
            {
              admin: {
                adminId:
                  person.id,
              },
              day: today,
              status,
            },
          );
        }),
      );

    const successful =
      results.filter(
        (result) =>
          result.status ===
          "fulfilled",
      ).length;

    const failed =
      results.length -
      successful;

    await todayQuery.refetch();

    if (failed === 0) {
      toast.success(
        `${successful} staff attendance record${
          successful === 1
            ? ""
            : "s"
        } saved.`,
      );

      return;
    }

    const firstFailure =
      results.find(
        (result) =>
          result.status ===
          "rejected",
      );

    const failureMessage =
      firstFailure?.status ===
      "rejected"
        ? getApiErrorMessage(
            firstFailure.reason,
          )
        : "One or more records failed.";

    toast.error(
      `${successful} of ${results.length} saved. ${failed} failed — ${failureMessage}`,
    );
  }

  // ==========================================================
  // HISTORY ACTIONS
  // ==========================================================

  function openEdit(
    record: StaffAttendance,
  ) {
    const normalized =
      record.status
        .trim()
        .toLowerCase();

    setEditStatus(
      normalized === "absent"
        ? "Absent"
        : "Present",
    );

    setEditingRecord({
      record,
    });
  }

  async function saveEdit() {
    if (!editingRecord) {
      return;
    }

    try {
      await updateMutation.mutateAsync(
        {
          attendanceId:
            editingRecord.record
              .attendanceId,
          status: editStatus,
        },
      );

      toast.success(
        "Staff attendance updated.",
      );

      setEditingRecord(null);

      await Promise.all([
        allHistoryQuery.refetch(),
        historyFilter ===
        "professor"
          ? professorHistoryQuery.refetch()
          : Promise.resolve(),
        historyFilter ===
          "admin" &&
        currentAdminId ===
          SUPER_ADMIN_ID
          ? adminHistoryQuery.refetch()
          : Promise.resolve(),
        historyFilter ===
        "date"
          ? dateHistoryQuery.refetch()
          : Promise.resolve(),
      ]);

      await todayQuery.refetch();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error),
      );
    }
  }

  async function confirmDelete() {
    if (!deletingRecord) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(
        deletingRecord.record
          .attendanceId,
      );

      toast.success(
        "Staff attendance record deleted.",
      );

      setDeletingRecord(null);

      await Promise.all([
        allHistoryQuery.refetch(),
        historyFilter ===
        "professor"
          ? professorHistoryQuery.refetch()
          : Promise.resolve(),
        historyFilter ===
          "admin" &&
        currentAdminId ===
          SUPER_ADMIN_ID
          ? adminHistoryQuery.refetch()
          : Promise.resolve(),
        historyFilter ===
        "date"
          ? dateHistoryQuery.refetch()
          : Promise.resolve(),
      ]);

      await todayQuery.refetch();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error),
      );
    }
  }

  // ==========================================================
  // HISTORY FILTER
  // ==========================================================

  function changeHistoryFilter(
    filter: HistoryFilter,
  ) {
    if (
      filter === "admin" &&
      currentAdminId !==
        SUPER_ADMIN_ID
    ) {
      setSelectedAdminId("");
      setHistoryFilter("all");
      return;
    }

    setHistoryFilter(filter);

    if (
      filter !==
      "professor"
    ) {
      setSelectedProfessorId("");
    }

    if (
      filter !== "admin"
    ) {
      setSelectedAdminId("");
    }

    if (filter !== "date") {
      setSelectedDate("");
    }
  }

  // ==========================================================
  // LOADING / ERROR STATE
  // ==========================================================

  const isSpecialAdmin =
    currentAdminId ===
    SUPER_ADMIN_ID;

  const referenceLoading =
    professorsQuery.isLoading ||
    (isSpecialAdmin &&
      adminsQuery.isLoading) ||
    todayQuery.isLoading;

  const referenceError =
    professorsQuery.isError ||
    (isSpecialAdmin &&
      adminsQuery.isError) ||
    todayQuery.isError;

  // ==========================================================
  // TABLE COLUMNS
  // ==========================================================

  const historyColumns = [
    {
      key: "staff",
      header: "Staff Member",
      render: (
        record: StaffAttendance,
      ) => (
        <div>
          <p className="font-medium text-heading">
            {getOwnerName(record)}
          </p>

          <p className="mt-1 text-caption text-muted">
            {getOwnerType(record)} ·{" "}
            {getOwnerId(record)}
          </p>
        </div>
      ),
    },
    {
      key: "day",
      header: "Date",
      accessor: "day" as const,
      sortable: true,
      render: (
        record: StaffAttendance,
      ) => (
        <span className="text-body-sm text-heading">
          {formatDate(
            record.day,
          )}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (
        record: StaffAttendance,
      ) => (
        <StatusPill
          status={
            record.status
          }
          animateChange
        />
      ),
    },
    {
      key: "attendanceId",
      header: "Attendance ID",
      render: (
        record: StaffAttendance,
      ) => (
        <span className="font-mono text-[11px] text-muted">
          {record.attendanceId}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (
        record: StaffAttendance,
      ) => (
        <div
          className="flex items-center gap-1.5"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          <Button
            variant="icon"
            aria-label={`Edit attendance for ${getOwnerName(record)}`}
            onClick={() =>
              openEdit(record)
            }
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <Button
            variant="icon"
            aria-label={`Delete attendance for ${getOwnerName(record)}`}
            onClick={() =>
              setDeletingRecord({
                record,
              })
            }
          >
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        </div>
      ),
    },
  ];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-h1 text-heading">
          Staff Attendance
        </h1>

        <p className="mt-1 text-body-sm text-muted">
          Mark today's attendance for
          professors and administrators,
          or review historical staff
          attendance records.
        </p>
      </div>

      <Card>
        <Tabs
          tabs={[
            {
              id: "mark",
              label:
                "Mark Today's Attendance",
            },
            {
              id: "history",
              label:
                "History / Reports",
            },
          ]}
          activeTab={activeTab}
          onChange={(tab) =>
            setActiveTab(
              tab as MainTab,
            )
          }
          ariaLabel="Staff attendance views"
        />
      </Card>

      {activeTab === "mark" ? (
        <div className="space-y-6">
          <Card className="bg-gradient-brand text-white">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-caption text-white/70">
                  Today
                </p>

                <h2 className="mt-1 font-heading text-h2">
                  {formatDate(today)}
                </h2>

                <p className="mt-2 text-body-sm text-white/80">
                  Select Present or Absent
                  for every staff member.
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
                <CalendarDays className="h-7 w-7" />
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <p className="text-caption text-muted">
                Staff
              </p>

              <p className="mt-2 font-heading text-2xl font-bold text-heading tabular-nums">
                {todaySummary.total}
              </p>
            </Card>

            <Card>
              <p className="text-caption text-muted">
                Recorded
              </p>

              <p className="mt-2 font-heading text-2xl font-bold text-heading tabular-nums">
                {todaySummary.recorded}
              </p>
            </Card>

            <Card>
              <p className="text-caption text-muted">
                Present
              </p>

              <p className="mt-2 font-heading text-2xl font-bold text-primary-700 tabular-nums">
                {todaySummary.present}
              </p>
            </Card>

            <Card>
              <p className="text-caption text-muted">
                Absent
              </p>

              <p className="mt-2 font-heading text-2xl font-bold text-danger-text tabular-nums">
                {todaySummary.absent}
              </p>
            </Card>
          </div>

          {referenceLoading ? (
            <Card>
              <div className="space-y-3">
                {Array.from({
                  length: 8,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-lg bg-neutral-100"
                  />
                ))}
              </div>
            </Card>
          ) : referenceError ? (
            <EmptyState
              title="Unable to load staff roster"
              description="Please check the backend and try again."
              action={{
                label: "Try again",
                onClick: () => {
                  void professorsQuery.refetch();
                  if (isSpecialAdmin) {
                    void adminsQuery.refetch();
                  }
                  void todayQuery.refetch();
                },
              }}
            />
          ) : roster.length ===
            0 ? (
            <EmptyState
              icon={
                <Users className="h-6 w-6" />
              }
              title="No staff found"
              description="There are currently no professors or administrators available for attendance marking."
            />
          ) : (
            <Card>
              <div className="flex flex-col gap-4 border-b border-default pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-heading text-h3 text-heading">
                    Combined Staff Roster
                  </h2>

                  <p className="mt-1 text-body-sm text-muted">
                    Existing records for today
                    are pre-filled. Only new
                    or changed statuses are
                    submitted. Your own admin
                    attendance is never available
                    for self-marking.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={
                      markAllPresent
                    }
                  >
                    <Check className="h-4 w-4" />
                    Mark All Present
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={
                      clearAllUnmarked
                    }
                  >
                    Clear New
                  </Button>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {roster.map(
                  (person) => {
                    const selected =
                      todaySelections[
                        person.key
                      ];

                    const existing =
                      todayRecordMap.get(
                        person.key,
                      );

                    return (
                      <div
                        key={person.key}
                        className="flex flex-col gap-4 rounded-lg border border-neutral-200 p-4 transition-all duration-150 hover:border-primary-200 hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-heading text-body-sm font-semibold text-heading">
                              {person.name}
                            </p>

                            <StatusPill
                              status={
                                person.type ===
                                "professor"
                                  ? "Professor"
                                  : "Admin"
                              }
                              variant={
                                person.type ===
                                "professor"
                                  ? "active"
                                  : "pending"
                              }
                            />

                            <StatusPill
                              status={
                                person.active
                                  ? "Active"
                                  : "Inactive"
                              }
                              variant={
                                person.active
                                  ? "active"
                                  : "inactive"
                              }
                            />
                          </div>

                          <p className="mt-1 font-mono text-[11px] text-muted">
                            {person.id}
                          </p>

                          {existing && (
                            <p className="mt-1 text-caption text-muted">
                              Recorded today
                            </p>
                          )}
                        </div>

                        <div
                          className="flex items-center gap-2"
                          role="group"
                          aria-label={`Attendance status for ${person.name}`}
                        >
                          <button
                            type="button"
                            aria-pressed={
                              selected ===
                              "Present"
                            }
                            onClick={() =>
                              setTodayStatus(
                                person.key,
                                "Present",
                              )
                            }
                            className={`min-w-24 rounded-md border px-3 py-2.5 text-body-sm font-semibold transition-all duration-150 active:scale-[0.97] ${
                              selected ===
                              "Present"
                                ? "border-primary-500 bg-primary-50 text-primary-700 shadow-sm"
                                : "border-neutral-200 bg-white text-neutral-500 hover:border-primary-200 hover:bg-primary-50"
                            }`}
                          >
                            Present
                          </button>

                          <button
                            type="button"
                            aria-pressed={
                              selected ===
                              "Absent"
                            }
                            onClick={() =>
                              setTodayStatus(
                                person.key,
                                "Absent",
                              )
                            }
                            className={`min-w-24 rounded-md border px-3 py-2.5 text-body-sm font-semibold transition-all duration-150 active:scale-[0.97] ${
                              selected ===
                              "Absent"
                                ? "border-danger bg-danger-bg text-danger-text shadow-sm"
                                : "border-neutral-200 bg-white text-neutral-500 hover:border-danger hover:bg-danger-bg"
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-default pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-body-sm text-muted">
                  {todaySummary.selected}{" "}
                  of{" "}
                  {todaySummary.total}{" "}
                  marked ·{" "}
                  {todaySummary.unmarked}{" "}
                  unmarked
                </p>

                <Button
                  loading={
                    createProfessorMutation.isPending ||
                    createAdminMutation.isPending ||
                    updateMutation.isPending
                  }
                  onClick={() =>
                    void saveTodayAttendance()
                  }
                >
                  <Check className="h-4 w-4" />
                  Save All
                </Button>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Select
                label="Filter By"
                value={historyFilter}
                onChange={(event) =>
                  changeHistoryFilter(
                    event.target
                      .value as HistoryFilter,
                  )
                }
                options={[
                  {
                    value: "all",
                    label: "All Staff",
                  },
                  {
                    value:
                      "professor",
                    label: "Professor",
                  },
                  ...(isSpecialAdmin
                    ? [
                        {
                          value: "admin" as const,
                          label: "Admin",
                        },
                      ]
                    : []),
                  {
                    value: "date",
                    label: "Date",
                  },
                ]}
              />

              {historyFilter ===
                "professor" && (
                <Select
                  label="Professor"
                  value={
                    selectedProfessorId
                  }
                  onChange={(event) =>
                    setSelectedProfessorId(
                      event.target
                        .value,
                    )
                  }
                  options={[
                    {
                      value: "",
                      label:
                        "Choose a professor",
                    },
                    ...(
                      professorsQuery.data ??
                      []
                    ).map(
                      (
                        professor,
                      ) => ({
                        value:
                          professor.profId,
                        label:
                          `${professor.professorName} (${professor.profId})`,
                      }),
                    ),
                  ]}
                />
              )}

              {historyFilter ===
                "admin" &&
                isSpecialAdmin && (
                <Select
                  label="Admin"
                  value={
                    selectedAdminId
                  }
                  onChange={(event) =>
                    setSelectedAdminId(
                      event.target
                        .value,
                    )
                  }
                  options={[
                    {
                      value: "",
                      label:
                        "Choose an admin",
                    },
                    ...(
                      adminsQuery.data ??
                      []
                    ).map(
                      (admin) => ({
                        value:
                          admin.adminId,
                        label:
                          `${admin.adminName} (${admin.adminId})`,
                      }),
                    ),
                  ]}
                />
              )}

              {historyFilter ===
                "date" && (
                <Input
                  label="Date"
                  type="date"
                  value={selectedDate}
                  onChange={(event) =>
                    setSelectedDate(
                      event.target
                        .value,
                    )
                  }
                />
              )}
            </div>

            {historyFilter !==
              "all" && (
              <p className="mt-4 text-caption text-muted">
                Choose a specific filter
                value to load matching
                attendance records.
              </p>
            )}
          </Card>

          {historyFilter !==
            "all" &&
            ((historyFilter ===
              "professor" &&
              !selectedProfessorId) ||
              (historyFilter ===
                "admin" &&
                !selectedAdminId) ||
              (historyFilter ===
                "date" &&
                !selectedDate)) ? (
            <EmptyState
              title="Choose a filter value"
              description="Select the professor, admin or calendar date whose staff attendance you want to review."
            />
          ) : historyError ? (
            <EmptyState
              title="Unable to load attendance history"
              description="Please check the backend and try again."
              action={{
                label: "Try again",
                onClick: () => {
                  if (
                    historyFilter ===
                    "professor"
                  ) {
                    void professorHistoryQuery.refetch();
                  } else if (
                    historyFilter ===
                    "admin"
                  ) {
                    void adminHistoryQuery.refetch();
                  } else if (
                    historyFilter ===
                    "date"
                  ) {
                    void dateHistoryQuery.refetch();
                  } else {
                    void allHistoryQuery.refetch();
                  }
                },
              }}
            />
          ) : (
            <DataTable
              data={historyRecords
                .slice()
                .sort((first, second) =>
                  `${second.day}-${second.attendanceId}`.localeCompare(
                    `${first.day}-${first.attendanceId}`,
                  ),
                )}
              columns={historyColumns}
              rowKey="attendanceId"
              loading={historyLoading}
              emptyTitle="No attendance records found"
              emptyMessage={
                historyFilter ===
                "all"
                  ? "No staff attendance has been recorded yet."
                  : "No staff attendance records match the selected filter."
              }
              pageSize={10}
            />
          )}
        </div>
      )}

      <Modal
        open={Boolean(
          editingRecord,
        )}
        onClose={() => {
          if (
            !updateMutation.isPending
          ) {
            setEditingRecord(null);
          }
        }}
        title="Edit Staff Attendance"
        description={
          editingRecord
            ? `${getOwnerName(
                editingRecord.record,
              )} · ${formatDate(
                editingRecord.record.day,
              )}`
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                setEditingRecord(
                  null,
                )
              }
              disabled={
                updateMutation.isPending
              }
            >
              Cancel
            </Button>

            <Button
              loading={
                updateMutation.isPending
              }
              onClick={() =>
                void saveEdit()
              }
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-neutral-50 p-4">
            <p className="text-caption text-muted">
              Staff member
            </p>

            <p className="mt-1 font-heading text-body-sm font-semibold text-heading">
              {editingRecord
                ? getOwnerName(
                    editingRecord.record,
                  )
                : "—"}
            </p>

            <p className="mt-1 font-mono text-[11px] text-muted">
              {editingRecord
                ? editingRecord.record
                    .attendanceId
                : "—"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-body-sm font-medium text-heading">
              Attendance Status
            </p>

            <div
              className="grid grid-cols-2 gap-2"
              role="group"
              aria-label="Attendance status"
            >
              <button
                type="button"
                aria-pressed={
                  editStatus ===
                  "Present"
                }
                onClick={() =>
                  setEditStatus(
                    "Present",
                  )
                }
                className={`rounded-md border px-4 py-3 text-sm font-semibold transition-all duration-150 active:scale-[0.97] ${
                  editStatus ===
                  "Present"
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-neutral-200 text-neutral-500 hover:bg-primary-50"
                }`}
              >
                Present
              </button>

              <button
                type="button"
                aria-pressed={
                  editStatus ===
                  "Absent"
                }
                onClick={() =>
                  setEditStatus(
                    "Absent",
                  )
                }
                className={`rounded-md border px-4 py-3 text-sm font-semibold transition-all duration-150 active:scale-[0.97] ${
                  editStatus ===
                  "Absent"
                    ? "border-danger bg-danger-bg text-danger-text"
                    : "border-neutral-200 text-neutral-500 hover:bg-danger-bg"
                }`}
              >
                Absent
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(
          deletingRecord,
        )}
        onClose={() => {
          if (
            !deleteMutation.isPending
          ) {
            setDeletingRecord(null);
          }
        }}
        onConfirm={
          confirmDelete
        }
        recordName={
          deletingRecord
            ? getOwnerName(
                deletingRecord.record,
              )
            : "this staff member's attendance"
        }
        actionLabel="Delete"
        title="Delete attendance record"
        description={
          deletingRecord
            ? `Delete the staff attendance record for ${getOwnerName(
                deletingRecord.record,
              )} on ${formatDate(
                deletingRecord.record.day,
              )}? This permanently removes that dated attendance record.`
            : undefined
        }
      />
    </div>
  );
}