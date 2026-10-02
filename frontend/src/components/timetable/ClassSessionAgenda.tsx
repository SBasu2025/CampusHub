import { useState } from "react";
import type { ReactNode } from "react";
import type { ClassSession } from "../../lib/api/types";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from "lucide-react";

import {
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";

import { motion } from "framer-motion";

import {
  isPast,
  isToday,
  toIsoDate,
} from "../../lib/utils/classSession";

import EmptyState from "../ui/EmptyState";

// ============================================================
// TYPES
// ============================================================

type AgendaMode =
  | "agenda"
  | "calendar";

export interface ClassSessionAgendaProps {
  sessions: ClassSession[];
  mode?: AgendaMode;

  onSessionClick?: (
    session: ClassSession,
  ) => void;

  /*
   * Optional action rendered at the right side of each
   * session row.
   *
   * Example:
   * Mark Attendance
   */
  renderAction?: (
    session: ClassSession,
  ) => ReactNode;

  /*
   * Used for today-only views where repeating a date heading
   * for every group is unnecessary.
   */
  hideDateHeadings?: boolean;

  emptyMessage?: string;
  className?: string;
}

interface SessionGroup {
  date: string;
  sessions: ClassSession[];
}

// ============================================================
// HELPERS
// ============================================================

function cn(
  ...classes: Array<
    string | undefined
  >
) {
  return classes
    .filter(Boolean)
    .join(" ");
}

function getSubjectColor(
  subjectId: string,
) {
  const colors = [
    "bg-primary-500",
    "bg-secondary-500",
    "bg-primary-600",
    "bg-secondary-600",
    "bg-primary-700",
    "bg-secondary-700",
  ];

  let hash = 0;

  for (
    let index = 0;
    index < subjectId.length;
    index += 1
  ) {
    hash =
      (hash * 31 +
        subjectId.charCodeAt(index)) |
      0;
  }

  return colors[
    Math.abs(hash) % colors.length
  ];
}

function formatTime(
  time: string,
) {
  if (!time) {
    return "—";
  }

  const parts = time.split(":");

  if (parts.length < 2) {
    return time;
  }

  return `${parts[0]}:${parts[1]}`;
}

function getDateHeading(
  isoDate: string,
) {
  const date = parseISO(
    isoDate,
  );

  if (isToday(isoDate)) {
    return `Today — ${format(
      date,
      "d MMM yyyy",
    )}`;
  }

  const tomorrow =
    new Date();

  tomorrow.setDate(
    tomorrow.getDate() + 1,
  );

  if (
    isoDate ===
    toIsoDate(tomorrow)
  ) {
    return `Tomorrow — ${format(
      date,
      "d MMM yyyy",
    )}`;
  }

  return format(
    date,
    "EEE, d MMM yyyy",
  );
}

function getSessionSubject(
  session: ClassSession,
) {
  return (
    session.teaching?.subject
      ?.subjectName ??
    "Unknown Subject"
  );
}

function getSessionSubjectId(
  session: ClassSession,
) {
  return (
    session.teaching?.subject
      ?.subjectId ??
    session.sessionId
  );
}

function sortSessions(
  sessions: ClassSession[],
) {
  return [...sessions].sort(
    (first, second) => {
      const dateComparison =
        first.day.localeCompare(
          second.day,
        );

      if (
        dateComparison !== 0
      ) {
        return dateComparison;
      }

      const timeComparison =
        first.startTime.localeCompare(
          second.startTime,
        );

      if (
        timeComparison !== 0
      ) {
        return timeComparison;
      }

      return first.sessionId.localeCompare(
        second.sessionId,
      );
    },
  );
}

function groupSessions(
  sessions: ClassSession[],
): SessionGroup[] {
  const grouped = new Map<
    string,
    ClassSession[]
  >();

  for (const session of sessions) {
    const existing =
      grouped.get(
        session.day,
      ) ?? [];

    existing.push(
      session,
    );

    grouped.set(
      session.day,
      existing,
    );
  }

  return Array.from(
    grouped.entries(),
  ).map(
    ([
      date,
      groupedSessions,
    ]) => ({
      date,
      sessions:
        groupedSessions,
    }),
  );
}

// ============================================================
// SESSION ROW
// ============================================================

function SessionRow({
  session,
  onSessionClick,
  renderAction,
  muted = false,
}: {
  session: ClassSession;

  onSessionClick?: (
    session: ClassSession,
  ) => void;

  renderAction?: (
    session: ClassSession,
  ) => ReactNode;

  muted?: boolean;
}) {
  const subjectName =
    getSessionSubject(
      session,
    );

  const subjectId =
    getSessionSubjectId(
      session,
    );

  const content = (
    <>
      {/* ======================================================
          SESSION INFORMATION
          ====================================================== */}

      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
            muted
              ? "bg-neutral-300"
              : getSubjectColor(
                  subjectId,
                ),
          )}
        />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p
              className={cn(
                "font-heading text-body-sm font-semibold",
                muted
                  ? "text-neutral-400"
                  : "text-heading",
              )}
            >
              {subjectName}
            </p>

            <span
              className={cn(
                "text-caption",
                muted
                  ? "text-neutral-400"
                  : "text-muted",
              )}
            >
              {session.course
                ?.courseName ??
                "Unknown Course"}
            </span>
          </div>

          <div
            className={cn(
              "mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption",
              muted
                ? "text-neutral-400"
                : "text-muted",
            )}
          >
            <span>
              Section{" "}
              {session.section ||
                "—"}
            </span>

            <span>
              Semester{" "}
              {session.semester ??
                "—"}
            </span>

            <span className="font-mono">
              {session.sessionId}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================
          TIME
          ====================================================== */}

      <div
        className={cn(
          "flex shrink-0 items-center gap-1.5 text-body-sm font-medium",
          muted
            ? "text-neutral-400"
            : "text-heading",
        )}
      >
        <Clock3
          aria-hidden="true"
          className="h-4 w-4"
        />

        <span>
          {formatTime(
            session.startTime,
          )}
          {" – "}
          {formatTime(
            session.endTime,
          )}
        </span>
      </div>
    </>
  );

  /*
   * IMPORTANT:
   *
   * When renderAction exists, the outer element MUST NOT be
   * a <button> because renderAction itself commonly contains
   * a button.
   *
   * This prevents invalid nested interactive elements such as:
   *
   * <button>
   *   ...
   *   <button>Mark Attendance</button>
   * </button>
   */
  if (renderAction) {
    return (
      <div
        className={cn(
          "flex w-full flex-col gap-3 rounded-md border border-neutral-200 bg-surface-card px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between",
          muted
            ? "border-neutral-100 bg-neutral-50/70"
            : "hover:border-primary-200 hover:bg-primary-50/30",
        )}
      >
        {content}

        <div className="shrink-0 sm:ml-4">
          {renderAction(
            session,
          )}
        </div>
      </div>
    );
  }

  /*
   * Normal non-clickable agenda row.
   */
  if (!onSessionClick) {
    return (
      <div
        className={cn(
          "flex flex-col gap-3 rounded-md border border-neutral-200 bg-surface-card px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between",
          muted
            ? "border-neutral-100 bg-neutral-50/70"
            : "hover:border-primary-200 hover:bg-primary-50/30",
        )}
      >
        {content}
      </div>
    );
  }

  /*
   * Clickable session row.
   *
   * This is only used when there is NO separate renderAction.
   */
  return (
    <button
      type="button"
      onClick={() =>
        onSessionClick(
          session,
        )
      }
      className={cn(
        "group flex w-full flex-col gap-3 rounded-md border border-neutral-200 bg-surface-card px-4 py-3.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 sm:flex-row sm:items-center sm:justify-between",
        muted
          ? "border-neutral-100 bg-neutral-50/70"
          : "hover:-translate-y-px hover:border-primary-200 hover:bg-primary-50/30 hover:shadow-sm active:scale-[0.995]",
      )}
    >
      {content}
    </button>
  );
}

// ============================================================
// AGENDA VIEW
// ============================================================

function AgendaView({
  sessions,
  onSessionClick,
  renderAction,
  hideDateHeadings = false,
  emptyMessage,
}: {
  sessions: ClassSession[];

  onSessionClick?: (
    session: ClassSession,
  ) => void;

  renderAction?: (
    session: ClassSession,
  ) => ReactNode;

  hideDateHeadings?: boolean;

  emptyMessage: string;
}) {
  /*
   * IMPORTANT:
   *
   * Calculate the derived values BEFORE useState so the hook
   * is always called on every render.
   *
   * The old version returned early before useState when
   * sessions.length === 0, which could create a hook-order
   * problem when the list changed from empty -> non-empty.
   */
  const sorted =
    sortSessions(sessions);

  const groups =
    groupSessions(sorted);

  const todayIso =
    toIsoDate(new Date());

  const earlierGroups =
    groups.filter(
      (group) =>
        group.date <
        todayIso,
    );

  const currentGroups =
    groups.filter(
      (group) =>
        group.date >=
        todayIso,
    );

  const [
    showEarlier,
    setShowEarlier,
  ] = useState(
    currentGroups.length ===
      0,
  );

  // ----------------------------------------------------------
  // EMPTY
  // ----------------------------------------------------------

  if (
    sessions.length === 0
  ) {
    return (
      <EmptyState
        title="No sessions found"
        description={
          emptyMessage
        }
      />
    );
  }

  // ----------------------------------------------------------
  // NO DATE HEADINGS
  // ----------------------------------------------------------

  if (
    hideDateHeadings
  ) {
    return (
      <div className="space-y-2.5">
        {sorted.map(
          (session) => (
            <SessionRow
              key={
                session.sessionId
              }
              session={
                session
              }
              onSessionClick={
                onSessionClick
              }
              renderAction={
                renderAction
              }
            />
          ),
        )}
      </div>
    );
  }

  // ----------------------------------------------------------
  // NORMAL AGENDA
  // ----------------------------------------------------------

  return (
    <div className="space-y-7">
      {/* ======================================================
          CURRENT / UPCOMING GROUPS
          ====================================================== */}

      {currentGroups.length >
        0 && (
        <div className="space-y-6">
          {currentGroups.map(
            (
              group,
              groupIndex,
            ) => (
              <motion.section
                key={
                  group.date
                }
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.3,
                  delay:
                    groupIndex *
                    0.06,
                  ease: [
                    0.16,
                    1,
                    0.3,
                    1,
                  ],
                }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <h3 className="font-heading text-body-sm font-semibold text-heading">
                    {getDateHeading(
                      group.date,
                    )}
                  </h3>

                  <div className="h-px flex-1 bg-neutral-200" />
                </div>

                <div className="space-y-2.5">
                  {group.sessions.map(
                    (
                      session,
                    ) => (
                      <SessionRow
                        key={
                          session.sessionId
                        }
                        session={
                          session
                        }
                        onSessionClick={
                          onSessionClick
                        }
                        renderAction={
                          renderAction
                        }
                      />
                    ),
                  )}
                </div>
              </motion.section>
            ),
          )}
        </div>
      )}

      {/* ======================================================
          EARLIER SESSIONS
          ====================================================== */}

      {earlierGroups.length >
        0 && (
        <section>
          <button
            type="button"
            onClick={() =>
              setShowEarlier(
                (
                  current,
                ) =>
                  !current,
              )
            }
            className="flex w-full items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-left transition-colors duration-150 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
          >
            <span className="font-heading text-body-sm font-semibold text-neutral-500">
              Earlier sessions
            </span>

            <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-caption font-semibold text-neutral-600">
              {earlierGroups.reduce(
                (
                  total,
                  group,
                ) =>
                  total +
                  group.sessions
                    .length,
                0,
              )}
            </span>

            <ChevronDown
              aria-hidden="true"
              className={cn(
                "ml-auto h-4 w-4 text-neutral-500 transition-transform duration-200",
                showEarlier
                  ? "rotate-180"
                  : undefined,
              )}
            />
          </button>

          {showEarlier && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              transition={{
                duration: 0.25,
                ease: [
                  0.16,
                  1,
                  0.3,
                  1,
                ],
              }}
              className="overflow-hidden"
            >
              <div className="space-y-6 pt-5">
                {earlierGroups
                  .slice()
                  .reverse()
                  .map(
                    (
                      group,
                      groupIndex,
                    ) => (
                      <motion.section
                        key={
                          group.date
                        }
                        initial={{
                          opacity: 0,
                          y: 8,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          duration: 0.3,
                          delay:
                            groupIndex *
                            0.06,
                          ease: [
                            0.16,
                            1,
                            0.3,
                            1,
                          ],
                        }}
                      >
                        <div className="mb-3 flex items-center gap-3">
                          <h3 className="font-heading text-body-sm font-semibold text-neutral-400">
                            {getDateHeading(
                              group.date,
                            )}
                          </h3>

                          <div className="h-px flex-1 bg-neutral-200" />
                        </div>

                        <div className="space-y-2.5">
                          {group.sessions.map(
                            (
                              session,
                            ) => (
                              <SessionRow
                                key={
                                  session.sessionId
                                }
                                session={
                                  session
                                }
                                onSessionClick={
                                  onSessionClick
                                }
                                renderAction={
                                  renderAction
                                }
                                muted
                              />
                            ),
                          )}
                        </div>
                      </motion.section>
                    ),
                  )}
              </div>
            </motion.div>
          )}
        </section>
      )}
    </div>
  );
}

// ============================================================
// CALENDAR VIEW
// ============================================================

function CalendarView({
  sessions,
  onSessionClick,
  renderAction,
  emptyMessage,
}: {
  sessions: ClassSession[];

  onSessionClick?: (
    session: ClassSession,
  ) => void;

  renderAction?: (
    session: ClassSession,
  ) => ReactNode;

  emptyMessage: string;
}) {
  const sorted =
    sortSessions(sessions);

  const sessionDates =
    new Set(
      sorted.map(
        (session) =>
          session.day,
      ),
    );

  const initialDate =
    sorted.length
      ? parseISO(
          sorted[0].day,
        )
      : new Date();

  const [
    visibleMonth,
    setVisibleMonth,
  ] = useState(
    startOfMonth(initialDate),
  );

  const [
    selectedDate,
    setSelectedDate,
  ] = useState<
    string | null
  >(
    sorted.length
      ? sorted[0].day
      : null,
  );

  const days =
    eachDayOfInterval({
      start: startOfMonth(
        visibleMonth,
      ),
      end: endOfMonth(
        visibleMonth,
      ),
    });

  const leadingBlankDays =
    (startOfMonth(
      visibleMonth,
    ).getDay() + 6) %
    7;

  const selectedSessions =
    selectedDate
      ? sorted.filter(
          (session) =>
            session.day ===
            selectedDate,
        )
      : [];

  function changeMonth(
    offset: number,
  ) {
    const nextMonth =
      new Date(
        visibleMonth,
      );

    nextMonth.setMonth(
      nextMonth.getMonth() +
        offset,
    );

    const normalizedMonth =
      startOfMonth(
        nextMonth,
      );

    setVisibleMonth(
      normalizedMonth,
    );

    const nextMonthDays =
      eachDayOfInterval({
        start: startOfMonth(
          normalizedMonth,
        ),
        end: endOfMonth(
          normalizedMonth,
        ),
      });

    const firstSessionDay =
      nextMonthDays.find(
        (day) =>
          sessionDates.has(
            toIsoDate(day),
          ),
      );

    setSelectedDate(
      firstSessionDay
        ? toIsoDate(
            firstSessionDay,
          )
        : null,
    );
  }

  return (
    <div className="space-y-6">
      {/* ======================================================
          EMPTY STATE
          ====================================================== */}

      {sessions.length === 0 ? (
        <EmptyState
          title="No sessions found"
          description={
            emptyMessage
          }
        />
      ) : (
        <>
          {/* ==================================================
              MONTH CALENDAR
              ================================================== */}

          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-surface-card shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <h3 className="font-heading text-body-sm font-semibold text-heading">
                {format(
                  visibleMonth,
                  "MMMM yyyy",
                )}
              </h3>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() =>
                    changeMonth(
                      -1,
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors duration-150 hover:bg-neutral-100 hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 active:scale-[0.97]"
                >
                  <ChevronLeft
                    aria-hidden="true"
                    className="h-4 w-4"
                  />
                </button>

                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() =>
                    changeMonth(
                      1,
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors duration-150 hover:bg-neutral-100 hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 active:scale-[0.97]"
                >
                  <ChevronRight
                    aria-hidden="true"
                    className="h-4 w-4"
                  />
                </button>
              </div>
            </div>

            {/* ----------------------------------------------
                WEEKDAY HEADER
                ---------------------------------------------- */}

            <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50">
              {[
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
                "Sun",
              ].map(
                (day) => (
                  <div
                    key={day}
                    className="px-2 py-2 text-center text-caption font-semibold uppercase tracking-wide text-muted"
                  >
                    {day}
                  </div>
                ),
              )}
            </div>

            {/* ----------------------------------------------
                DAYS
                ---------------------------------------------- */}

            <div className="grid grid-cols-7">
              {Array.from({
                length:
                  leadingBlankDays,
              }).map(
                (_, index) => (
                  <div
                    key={`blank-${index}`}
                    className="min-h-16 border-b border-r border-neutral-100 bg-neutral-50/40"
                  />
                ),
              )}

              {days.map(
                (day) => {
                  const isoDate =
                    toIsoDate(
                      day,
                    );

                  const hasSessions =
                    sessionDates.has(
                      isoDate,
                    );

                  const selected =
                    selectedDate ===
                    isoDate;

                  const today =
                    isToday(
                      isoDate,
                    );

                  return (
                    <button
                      key={isoDate}
                      type="button"
                      onClick={() =>
                        setSelectedDate(
                          hasSessions
                            ? isoDate
                            : null,
                        )
                      }
                      className={cn(
                        "relative min-h-16 border-b border-r border-neutral-100 p-2 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-300",
                        hasSessions
                          ? "cursor-pointer hover:bg-primary-50/50"
                          : "cursor-default",
                        selected
                          ? "bg-primary-50"
                          : undefined,
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full text-caption font-medium",
                          today
                            ? "bg-primary-500 text-white"
                            : selected
                              ? "text-primary-700"
                              : "text-neutral-600",
                        )}
                      >
                        {format(
                          day,
                          "d",
                        )}
                      </span>

                      {hasSessions && (
                        <span
                          aria-label="Has scheduled sessions"
                          className="absolute bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary-500"
                        />
                      )}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* ==================================================
              SELECTED DATE SESSIONS
              ================================================== */}

          {selectedDate &&
          selectedSessions.length >
            0 ? (
            <div>
              <div className="mb-3 flex items-center gap-3">
                <h3 className="font-heading text-body-sm font-semibold text-heading">
                  {getDateHeading(
                    selectedDate,
                  )}
                </h3>

                <div className="h-px flex-1 bg-neutral-200" />
              </div>

              <div className="space-y-2.5">
                {selectedSessions.map(
                  (session) => (
                    <SessionRow
                      key={
                        session.sessionId
                      }
                      session={
                        session
                      }
                      onSessionClick={
                        onSessionClick
                      }
                      renderAction={
                        renderAction
                      }
                      muted={isPast(
                        session.day,
                      )}
                    />
                  ),
                )}
              </div>
            </div>
          ) : (
            <EmptyState
              title="No sessions on this date"
              description="Choose a date with a scheduled class to see its session details."
            />
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ClassSessionAgenda({
  sessions,
  mode = "agenda",

  onSessionClick,

  renderAction,

  hideDateHeadings = false,

  emptyMessage = "No sessions found for this filter.",

  className,
}: ClassSessionAgendaProps) {
  return (
    <div
      className={cn(
        "w-full",
        className,
      )}
    >
      {mode ===
      "calendar" ? (
        <CalendarView
          sessions={sessions}
          onSessionClick={
            onSessionClick
          }
          renderAction={
            renderAction
          }
          emptyMessage={
            emptyMessage
          }
        />
      ) : (
        <AgendaView
          sessions={sessions}
          onSessionClick={
            onSessionClick
          }
          renderAction={
            renderAction
          }
          hideDateHeadings={
            hideDateHeadings
          }
          emptyMessage={
            emptyMessage
          }
        />
      )}
    </div>
  );
}