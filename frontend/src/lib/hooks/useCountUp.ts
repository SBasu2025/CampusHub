import {
  useEffect,
  useState,
} from "react";

// ============================================================
// DEFAULT CONFIG
// ============================================================

const DEFAULT_DURATION =
  900;

// ============================================================
// EASING
// ============================================================
//
// Ease-out cubic:
//
// Starts quickly and settles smoothly.
//
// This is appropriate for KPI counters because the number
// appears responsive immediately without feeling abrupt.
// ============================================================

function easeOutCubic(
  progress: number,
): number {
  return (
    1 -
    Math.pow(
      1 - progress,
      3,
    )
  );
}

// ============================================================
// REDUCED MOTION
// ============================================================

function prefersReducedMotion(): boolean {
  if (
    typeof window ===
    "undefined"
  ) {
    return false;
  }

  return window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
}

// ============================================================
// COUNT-UP HOOK
// ============================================================

export function useCountUp(
  value: number,

  duration =
    DEFAULT_DURATION,
): number {
  const [
    displayValue,
    setDisplayValue,
  ] = useState(0);

  useEffect(() => {
    // --------------------------------------------------------
    // INVALID NUMBER
    // --------------------------------------------------------

    if (
      !Number.isFinite(
        value,
      )
    ) {
      setDisplayValue(0);

      return;
    }

    // --------------------------------------------------------
    // REDUCED MOTION / ZERO DURATION
    // --------------------------------------------------------

    if (
      prefersReducedMotion() ||
      duration <= 0
    ) {
      setDisplayValue(
        value,
      );

      return;
    }

    // --------------------------------------------------------
    // ANIMATION STATE
    // --------------------------------------------------------

    let animationFrame = 0;

    let startTime:
      | number
      | null = null;

    // --------------------------------------------------------
    // ANIMATION FRAME
    // --------------------------------------------------------

    const animate = (
      timestamp: number,
    ) => {
      if (
        startTime ===
        null
      ) {
        startTime =
          timestamp;
      }

      const elapsed =
        timestamp -
        startTime;

      const progress =
        Math.min(
          elapsed /
            duration,
          1,
        );

      const easedProgress =
        easeOutCubic(
          progress,
        );

      setDisplayValue(
        easedProgress *
          value,
      );

      if (
        progress < 1
      ) {
        animationFrame =
          requestAnimationFrame(
            animate,
          );
      }
    };

    // --------------------------------------------------------
    // RESET
    // --------------------------------------------------------

    setDisplayValue(0);

    // --------------------------------------------------------
    // START
    // --------------------------------------------------------

    animationFrame =
      requestAnimationFrame(
        animate,
      );

    // --------------------------------------------------------
    // CLEANUP
    // --------------------------------------------------------

    return () => {
      cancelAnimationFrame(
        animationFrame,
      );
    };
  }, [
    value,
    duration,
  ]);

  return displayValue;
}