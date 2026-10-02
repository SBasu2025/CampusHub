import type {
  ReactNode,
} from "react";

import Card from "./Card";

import {
  useCountUp,
} from "../../lib/hooks/useCountUp";

// ============================================================
// TYPES
// ============================================================

type TrendDirection =
  | "up"
  | "down"
  | "neutral";

export interface KPIStatCardProps {
  /**
   * Small label above the main number.
   */
  label: string;

  /**
   * Numeric KPI value.
   */
  value: number;

  /**
   * Icon rendered in the right-hand badge.
   */
  icon: ReactNode;

  /**
   * Optional descriptive/trend text.
   */
  trend?: string;

  /**
   * Controls trend text semantics.
   */
  trendDirection?: TrendDirection;

  /**
   * Optional suffix.
   *
   * Example:
   * "%"
   */
  valueSuffix?: string;

  /**
   * Optional prefix.
   *
   * Example:
   * "₹"
   */
  valuePrefix?: string;

  /**
   * Additional Tailwind classes.
   */
  className?: string;
}

// ============================================================
// HELPERS
// ============================================================

const cn = (
  ...classes: Array<
    string | undefined | false
  >
): string =>
  classes
    .filter(Boolean)
    .join(" ");

// ============================================================
// COMPONENT
// ============================================================

export default function KPIStatCard({
  label,
  value,
  icon,
  trend,
  trendDirection = "neutral",
  valueSuffix = "",
  valuePrefix = "",
  className,
}: KPIStatCardProps) {
  // ----------------------------------------------------------
  // NUMBER ANIMATION
  // ----------------------------------------------------------

  const animatedValue =
    useCountUp(
      value,
      900,
    );

  // ----------------------------------------------------------
  // NUMBER FORMAT
  // ----------------------------------------------------------

  const formattedValue =
    Math.round(
      animatedValue,
    ).toLocaleString();

  // ----------------------------------------------------------
  // TREND COLOR
  // ----------------------------------------------------------

  const trendClass =
    trendDirection ===
    "up"
      ? "text-emerald-600"
      : trendDirection ===
          "down"
        ? "text-danger"
        : "text-neutral-500";

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* ==================================================
            VALUE
            ================================================== */}

        <div className="min-w-0">
          {/* Label */}
          <p className="text-caption text-neutral-500">
            {label}
          </p>

          {/* Main KPI */}
          <p className="mt-2 font-heading text-3xl font-extrabold leading-none tracking-tight text-neutral-800 tabular-nums">
            {valuePrefix}

            {formattedValue}

            {valueSuffix}
          </p>

          {/* Trend */}
          {trend && (
            <p
              className={cn(
                "mt-2 text-caption font-medium",
                trendClass,
              )}
            >
              {trend}
            </p>
          )}
        </div>

        {/* ==================================================
            ICON
            ================================================== */}

        <div
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600"
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}