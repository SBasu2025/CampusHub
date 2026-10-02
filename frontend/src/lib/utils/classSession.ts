import type {
  ClassSession,
} from "../api/types";

// ============================================================
// ISO DATE
// ============================================================
//
// CampusHub stores ClassSession.day as:
//
// YYYY-MM-DD
//
// Example:
// 2026-09-19
//
// This format is used internally for:
// - storing the date
// - comparing dates
// - sorting dates
// - checking today/past/upcoming
//
// Display formatting can be done separately in UI components.
// ============================================================

export const toIsoDate = (
  date: Date,
): string => {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
};

// ============================================================
// SESSION ID GENERATION
// ============================================================
//
// FINALIZED RULE:
//
// CS + YYMMDD + NN
//
// Example:
//
// ISO date:
// 2026-09-19
//
// YYMMDD:
// 260919
//
// First session:
//
// CS26091901
//
// Second session:
//
// CS26091902
//
// Different date:
//
// 2026-09-20
// -> CS26092001
//
// The sequence restarts for every calendar date.
// ============================================================

export const generateSessionId = (
  isoDate: string,

  existingSessions: ClassSession[],
): string => {
  // ----------------------------------------------------------
  // BASIC DATE FORMAT VALIDATION
  // ----------------------------------------------------------

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      isoDate,
    )
  ) {
    throw new Error(
      `Invalid ClassSession date "${isoDate}". Expected YYYY-MM-DD.`,
    );
  }

  // ----------------------------------------------------------
  // EXTRACT YYMMDD
  // ----------------------------------------------------------
  //
  // 2026-09-19
  //      ↓
  // 26-09-19
  //      ↓
  // 260919
  // ----------------------------------------------------------

  const yymmdd =
    isoDate
      .slice(2)
      .replace(
        /-/g,
        "",
      );

  // ----------------------------------------------------------
  // SESSION PREFIX FOR THIS DATE
  // ----------------------------------------------------------

  const prefix =
    `CS${yymmdd}`;

  // ----------------------------------------------------------
  // FIND EXISTING SESSIONS ON THIS DATE
  // ----------------------------------------------------------
  //
  // Example:
  //
  // CS26091901
  // CS26091902
  //
  // both match.
  //
  // CS26092001
  //
  // does NOT match.
  // ----------------------------------------------------------

  const matchingSessions =
    existingSessions.filter(
      (
        session,
      ) =>
        session.sessionId.startsWith(
          prefix,
        ),
    );

  // ----------------------------------------------------------
  // NEXT SEQUENCE NUMBER
  // ----------------------------------------------------------

  const sequenceNumber =
    matchingSessions.length +
    1;

  // ----------------------------------------------------------
  // VARCHAR(10) LIMIT
  // ----------------------------------------------------------
  //
  // CS + YYMMDD + NN
  //
  // = 10 characters
  //
  // Therefore:
  //
  // 01 -> 99
  //
  // is the supported range.
  // ----------------------------------------------------------

  if (
    sequenceNumber >
    99
  ) {
    throw new Error(
      `Cannot generate another ClassSession ID for ${isoDate}. ` +
        "More than 99 sessions already exist on this date.",
    );
  }

  // ----------------------------------------------------------
  // ZERO-PAD SEQUENCE
  // ----------------------------------------------------------

  const sequence =
    String(
      sequenceNumber,
    ).padStart(
      2,
      "0",
    );

  // ----------------------------------------------------------
  // FINAL ID
  // ----------------------------------------------------------

  return `${prefix}${sequence}`;
};

// ============================================================
// TODAY
// ============================================================
//
// Since ClassSession.day is stored as YYYY-MM-DD,
// direct string comparison is safe here.
// ============================================================

export const isToday = (
  isoDate: string,
): boolean => {
  return (
    isoDate ===
    toIsoDate(
      new Date(),
    )
  );
};

// ============================================================
// PAST
// ============================================================
//
// Example:
//
// today:
// 2026-09-19
//
// 2026-09-18 -> true
// 2026-09-19 -> false
// 2026-09-20 -> false
// ============================================================

export const isPast = (
  isoDate: string,
): boolean => {
  return (
    isoDate <
    toIsoDate(
      new Date(),
    )
  );
};

// ============================================================
// UPCOMING
// ============================================================

export const isUpcoming = (
  isoDate: string,
): boolean => {
  return (
    isoDate >
    toIsoDate(
      new Date(),
    )
  );
};

// ============================================================
// SESSION DATE STATE
// ============================================================

export type SessionDateState =
  | "past"
  | "today"
  | "upcoming";

export const getSessionDateState = (
  isoDate: string,
): SessionDateState => {
  if (
    isToday(
      isoDate,
    )
  ) {
    return "today";
  }

  if (
    isPast(
      isoDate,
    )
  ) {
    return "past";
  }

  return "upcoming";
};