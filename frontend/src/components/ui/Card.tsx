import type {
  HTMLAttributes,
  ReactNode,
} from "react";

import {
  motion,
} from "framer-motion";

// ============================================================
// TYPES
// ============================================================

export interface CardProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    "onClick"
  > {
  children: ReactNode;

  /**
   * Enables hover/tap interaction.
   */
  clickable?: boolean;

  /**
   * Called when a clickable card is activated.
   */
  onClick?: () => void;
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
// BASE CARD
// ============================================================

const cardClasses =
  "rounded-lg border border-neutral-200 bg-white p-6 shadow-sm";

// ============================================================
// COMPONENT
// ============================================================

export default function Card({
  children,
  clickable = false,
  onClick,
  className,
  ...props
}: CardProps) {
  const classes = cn(
    cardClasses,

    clickable
      ? "cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
      : undefined,

    className,
  );

  // ----------------------------------------------------------
  // NON-CLICKABLE CARD
  // ----------------------------------------------------------

  if (!clickable) {
    return (
      <div
        {...props}
        className={classes}
      >
        {children}
      </div>
    );
  }

  // ----------------------------------------------------------
  // CLICKABLE CARD
  // ----------------------------------------------------------

  return (
    <motion.div
      role={
        onClick
          ? "button"
          : undefined
      }
      tabIndex={
        onClick
          ? 0
          : undefined
      }
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) {
          return;
        }

        if (
          event.key ===
            "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();

          onClick();
        }
      }}
      whileTap={{
        scale: 0.99,
      }}
      transition={{
        duration: 0.15,
        ease: "easeOut",
      }}
      className="w-full"
    >
      <div
        {...props}
        className={classes}
      >
        {children}
      </div>
    </motion.div>
  );
}