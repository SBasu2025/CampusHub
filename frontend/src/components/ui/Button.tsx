import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

import {
  Loader2,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "icon";

export type ButtonSize =
  | "sm"
  | "md"
  | "lg";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;

  size?: ButtonSize;

  /**
   * Shows an inline spinner and disables
   * the button while the operation runs.
   */
  loading?: boolean;

  children?: ReactNode;
}

// ============================================================
// CLASS HELPERS
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
// BASE
// ============================================================

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60";

// ============================================================
// SIZE
// ============================================================

const sizeClasses: Record<
  ButtonSize,
  string
> = {
  sm: "min-h-9 px-3 text-sm",

  md: "min-h-10 px-4 text-sm",

  lg: "min-h-11 px-5 text-base",
};

// ============================================================
// VARIANT
// ============================================================

const variantClasses: Record<
  ButtonVariant,
  string
> = {
  primary:
    "bg-gradient-brand text-white shadow-sm hover:-translate-y-px hover:brightness-105 hover:shadow-glow-primary active:scale-[0.97]",

  secondary:
    "border border-secondary-500 bg-transparent text-secondary-700 hover:bg-secondary-50 active:scale-[0.97]",

  ghost:
    "bg-transparent text-neutral-600 hover:bg-primary-50 hover:text-primary-600 active:scale-[0.97]",

  danger:
    "bg-danger text-white shadow-sm hover:-translate-y-px hover:brightness-105 hover:shadow-md active:scale-[0.97]",

  icon:
    "h-10 w-10 shrink-0 bg-transparent p-0 text-neutral-600 hover:bg-neutral-100 hover:text-primary-600 active:scale-[0.97]",
};

// ============================================================
// COMPONENT
// ============================================================

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  children,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  const isIcon =
    variant === "icon";

  const isDisabled =
    disabled || loading;

  return (
    <button
      {...props}
      type={type}
      disabled={
        isDisabled
      }
      aria-busy={
        loading
          ? true
          : undefined
      }
      className={cn(
        baseClasses,

        isIcon
          ? undefined
          : sizeClasses[size],

        variantClasses[variant],

        className,
      )}
    >
      {loading ? (
        <>
          <Loader2
            aria-hidden="true"
            className="h-4 w-4 shrink-0 animate-spin"
          />

          {/* Preserve button width while
              the spinner is displayed. */}
          {!isIcon && (
            <span className="invisible">
              {children}
            </span>
          )}
        </>
      ) : (
        children
      )}
    </button>
  );
}