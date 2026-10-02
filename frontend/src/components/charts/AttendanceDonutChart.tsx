import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  type PieSectorDataItem,
} from "recharts";

import EmptyState from "../ui/EmptyState";

import {
  useCountUp,
} from "../../lib/hooks/useCountUp";

import {
  toAttendanceDonutData,
} from "../../lib/utils/charts";

// ============================================================
// TYPES
// ============================================================

export interface AttendanceDonutDatum {
  name:
    | "Present"
    | "Absent";

  value: number;

  color?: string;
}

export interface AttendanceDonutChartProps {
  data: AttendanceDonutDatum[];

  percentage?: number;

  caption?: string;

  title?: string;

  size?:
    | "sm"
    | "md"
    | "lg";

  loading?: boolean;

  className?: string;

  /**
   * Show the persistent Present / Absent legend.
   *
   * Default:
   * true
   */
  showLegend?: boolean;

  /**
   * Show the caption below the percentage
   * inside the donut.
   *
   * Default:
   * true
   */
  showCenterCaption?: boolean;
}

// ============================================================
// SIZE CONFIG
// ============================================================

const sizeConfig = {
  sm: {
    height: 190,
    outerRadius: 60,
    innerRadius: 41,
  },

  md: {
    height: 220,
    outerRadius: 76,
    innerRadius: 52,
  },

  lg: {
    height: 280,
    outerRadius: 102,
    innerRadius: 70,
  },
};

// ============================================================
// CLASS HELPER
// ============================================================

function cn(
  ...classes: Array<
    string | undefined | false
  >
): string {
  return classes
    .filter(Boolean)
    .join(" ");
}

// ============================================================
// PERCENTAGE NORMALIZATION
// ============================================================

function normalizePercentage(
  percentage: number | undefined,
  present: number,
  total: number,
): number {
  if (
    typeof percentage ===
      "number" &&
    Number.isFinite(
      percentage,
    )
  ) {
    return Math.max(
      0,
      Math.min(
        100,
        percentage,
      ),
    );
  }

  if (total === 0) {
    return 0;
  }

  return Math.round(
    (present / total) * 100,
  );
}

// ============================================================
// ACTIVE SHAPE
// ============================================================

function ActiveShape(
  props: PieSectorDataItem,
) {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    cornerRadius,
    fill,
  } = props;

  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={
        innerRadius
      }
      outerRadius={
        (outerRadius ?? 0) +
        5
      }
      startAngle={
        startAngle
      }
      endAngle={
        endAngle
      }
      cornerRadius={
        cornerRadius
      }
      fill={fill}
    />
  );
}

// ============================================================
// TOOLTIP
// ============================================================

function CustomTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;

  payload?: Array<{
    name?: string;

    value?: number;
  }>;

  total: number;
}) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }

  const item =
    payload[0];

  const name =
    item.name ??
    "Attendance";

  const value =
    item.value ?? 0;

  const percentage =
    total > 0
      ? Math.round(
          (value / total) * 100,
        )
      : 0;

  return (
    <div className="min-w-[132px] rounded-xl border border-default bg-surface-overlay px-3 py-2 shadow-lg">
      <p className="font-heading text-sm font-semibold leading-tight text-heading">
        {name}: {value}{" "}
        {value === 1
          ? "session"
          : "sessions"}
      </p>

      <p className="mt-1 text-xs font-medium text-muted">
        {percentage}%
      </p>
    </div>
  );
}

// ============================================================
// CENTER LABEL
// ============================================================

function CenterLabel({
  percentage,
  caption,
  showCaption,
}: {
  percentage: number;

  caption: string;

  showCaption: boolean;
}) {
  const animatedPercentage =
    useCountUp(
      percentage,
      900,
    );

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <span className="font-heading text-[1.55rem] font-extrabold leading-none tracking-tight text-heading tabular-nums">
        {Math.round(
          animatedPercentage,
        )}
        %
      </span>

      {showCaption && (
        <span className="mt-1 text-[0.58rem] font-semibold leading-tight text-muted">
          {caption}
        </span>
      )}
    </div>
  );
}

// ============================================================
// LOADING CHART
// ============================================================

function LoadingChart({
  title,
  size,
  className,
  showLegend,
}: {
  title?: string;

  size:
    | "sm"
    | "md"
    | "lg";

  className?: string;

  showLegend: boolean;
}) {
  const config =
    sizeConfig[size];

  return (
    <div
      className={cn(
        "w-full",
        className,
      )}
    >
      {title && (
        <h3 className="mb-3 font-heading text-h3 text-heading">
          {title}
        </h3>
      )}

      <div
        className="relative mx-auto w-full max-w-[360px]"
        style={{
          height:
            config.height,
        }}
        role="status"
        aria-label="Loading attendance chart"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="animate-pulse rounded-full border-[18px] border-neutral-200"
            style={{
              width:
                config.outerRadius *
                2,

              height:
                config.outerRadius *
                2,
            }}
          />
        </div>
      </div>

      {showLegend && (
        <div className="mt-2 flex items-center justify-center gap-5">
          <div className="h-3 w-20 animate-pulse rounded bg-neutral-200" />

          <div className="h-3 w-20 animate-pulse rounded bg-neutral-200" />
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function AttendanceDonutChart({
  data,
  percentage,
  caption = "Attendance",
  title,
  size = "md",
  loading = false,
  className,
  showLegend = true,
  showCenterCaption = true,
}: AttendanceDonutChartProps) {
  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  if (loading) {
    return (
      <LoadingChart
        title={title}
        size={size}
        className={
          className
        }
        showLegend={
          showLegend
        }
      />
    );
  }

  // ----------------------------------------------------------
  // DATA EXTRACTION
  // ----------------------------------------------------------

  const present =
    data.find(
      (item) =>
        item.name ===
        "Present",
    )?.value ?? 0;

  const absent =
    data.find(
      (item) =>
        item.name ===
        "Absent",
    )?.value ?? 0;

  const total =
    present + absent;

  // ----------------------------------------------------------
  // PERCENTAGE
  // ----------------------------------------------------------

  const calculatedPercentage =
    normalizePercentage(
      percentage,
      present,
      total,
    );

  // ----------------------------------------------------------
  // SIZE
  // ----------------------------------------------------------

  const config =
    sizeConfig[size];

  // ----------------------------------------------------------
  // CHART DATA
  // ----------------------------------------------------------

  const chartData =
    toAttendanceDonutData(
      present,
      absent,
    );

  // ----------------------------------------------------------
  // EMPTY
  // ----------------------------------------------------------

  if (total === 0) {
    return (
      <div
        className={cn(
          "w-full rounded-lg bg-surface-card",
          className,
        )}
      >
        {title && (
          <h3 className="mb-3 font-heading text-h3 text-heading">
            {title}
          </h3>
        )}

        <EmptyState
          title="No attendance recorded"
          description="There are no attendance records available for this view yet."
        />
      </div>
    );
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div
      className={cn(
        "w-full",
        className,
      )}
    >
      {title && (
        <h3 className="mb-3 font-heading text-h3 text-heading">
          {title}
        </h3>
      )}

      {/* ====================================================
          CHART
          ==================================================== */}

      <div
        className="relative mx-auto w-full max-w-[360px] min-w-0"
        style={{
          height:
            config.height,
        }}
      >
        <div className="h-full w-full max-[159px]:hidden">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={160}
          >
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={
                  config.innerRadius
                }
                outerRadius={
                  config.outerRadius
                }
                paddingAngle={3}
                cornerRadius={6}
                startAngle={90}
                endAngle={-270}
                stroke="none"
                isAnimationActive
                animationBegin={100}
                animationDuration={800}
                animationEasing="ease-out"
                activeShape={
                  ActiveShape
                }
              >
                {chartData.map(
                  (entry) => (
                    <Cell
                      key={
                        entry.name
                      }
                      fill={
                        entry.color
                      }
                    />
                  ),
                )}
              </Pie>

              <Tooltip
                content={
                  <CustomTooltip
                    total={total}
                  />
                }
                offset={14}
                allowEscapeViewBox={{
                  x: true,
                  y: true,
                }}
                wrapperStyle={{
                  zIndex: 50,
                  pointerEvents:
                    "none",
                  transform:
                    "translate(32px, -58px)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <CenterLabel
            percentage={
              calculatedPercentage
            }
            caption={
              caption
            }
            showCaption={
              showCenterCaption
            }
          />
        </div>

        {/* Very narrow fallback */}
        <div className="hidden h-full max-[159px]:flex items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <span className="font-heading text-[1.55rem] font-extrabold leading-none tracking-tight text-heading tabular-nums">
              {Math.round(
                calculatedPercentage,
              )}
              %
            </span>

            {showCenterCaption && (
              <span className="mt-1 text-[0.58rem] font-semibold leading-tight text-muted">
                {caption}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ====================================================
          LEGEND
          ==================================================== */}

      {showLegend && (
        <div className="mt-2 flex flex-col items-center justify-center gap-2 min-[360px]:flex-row min-[360px]:gap-5">
          {chartData.map(
            (entry) => (
              <div
                key={
                  entry.name
                }
                className="flex items-center gap-2"
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      entry.color,
                  }}
                />

                <span className="text-caption text-muted">
                  {entry.name}{" "}
                  <span className="font-semibold text-heading tabular-nums">
                    {
                      entry.value
                    }
                  </span>
                </span>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}