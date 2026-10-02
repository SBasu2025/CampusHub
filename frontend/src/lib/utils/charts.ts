// ============================================================
// ATTENDANCE CHART UTILITIES
// ============================================================
//
// Centralized attendance-chart data transformation.
//
// Semantic rule:
//
// Present -> primary-500
// Absent  -> danger
//
// Do not create alternative attendance color mappings in
// individual screens.
// ============================================================

export interface AttendanceDonutDataPoint {
  name:
    | "Present"
    | "Absent";

  value: number;

  color: string;
}

// ============================================================
// ATTENDANCE DONUT DATA
// ============================================================

export const toAttendanceDonutData = (
  present: number,

  absent: number,
): AttendanceDonutDataPoint[] => {
  const safePresent =
    Number.isFinite(
      present,
    )
      ? Math.max(
          0,
          present,
        )
      : 0;

  const safeAbsent =
    Number.isFinite(
      absent,
    )
      ? Math.max(
          0,
          absent,
        )
      : 0;

  return [
    {
      name: "Present",

      value:
        safePresent,

      color:
        "var(--color-primary-500)",
    },

    {
      name: "Absent",

      value:
        safeAbsent,

      color:
        "var(--color-danger)",
    },
  ];
};