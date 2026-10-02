import type {
    InputHTMLAttributes,
    ReactNode,
    SelectHTMLAttributes,
    TextareaHTMLAttributes,
  } from "react";

  type FieldBaseProps = {
    label: string;
    error?: string;
    hint?: string;
    leftIcon?: ReactNode;
    className?: string;
  };

  export interface InputProps
    extends FieldBaseProps,
      Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {}

  export interface TextareaProps
    extends FieldBaseProps,
      Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {}

  export interface SelectProps
    extends FieldBaseProps,
      Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> {}

  const fieldBase =
    "w-full rounded-md border bg-surface-card text-body text-heading placeholder:text-muted transition duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400";

  const fieldPadding = "px-3 py-2.5";

  function cn(...classes: Array<string | undefined>) {
    return classes.filter(Boolean).join(" ");
  }

  function FieldMessage({
    error,
    hint,
  }: {
    error?: string;
    hint?: string;
  }) {
    if (error) {
      return (
        <p
          role="alert"
          className="mt-1.5 text-caption text-danger-text"
        >
          {error}
        </p>
      );
    }

    if (hint) {
      return (
        <p className="mt-1.5 text-caption text-muted">
          {hint}
        </p>
      );
    }

    return null;
  }

  function FieldShell({
    label,
    error,
    leftIcon,
    children,
  }: {
    label: string;
    error?: string;
    leftIcon?: ReactNode;
    children: ReactNode;
  }) {
    return (
      <div className="w-full">
        <label className="mb-1.5 block text-label font-medium text-heading">
          {label}
        </label>

        <div className="relative">
          {leftIcon && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center text-muted"
            >
              {leftIcon}
            </span>
          )}

          {children}
        </div>

        <FieldMessage error={error} />
      </div>
    );
  }

  export function Input({
    label,
    error,
    hint,
    leftIcon,
    className,
    id,
    ...props
  }: InputProps) {
    const generatedId =
      id || `campushub-input-${label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}`;

    return (
      <div className="w-full">
        <FieldShell
          label={label}
          error={error}
          leftIcon={leftIcon}
        >
          <input
            {...props}
            id={generatedId}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error || hint
                ? `${generatedId}-message`
                : undefined
            }
            className={cn(
              fieldBase,
              fieldPadding,
              leftIcon ? "pl-10" : undefined,
              error
                ? "border-danger focus:border-danger focus:ring-danger/20 motion-safe:animate-shake"
                : "border-neutral-200",
              className,
            )}
          />
        </FieldShell>

        <div id={`${generatedId}-message`}>
          <FieldMessage error={error} hint={hint} />
        </div>
      </div>
    );
  }

  export function Textarea({
    label,
    error,
    hint,
    className,
    id,
    ...props
  }: TextareaProps) {
    const generatedId =
      id || `campushub-textarea-${label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}`;

    return (
      <div className="w-full">
        <label
          htmlFor={generatedId}
          className="mb-1.5 block text-label font-medium text-heading"
        >
          {label}
        </label>

        <textarea
          {...props}
          id={generatedId}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error || hint
              ? `${generatedId}-message`
              : undefined
          }
          className={cn(
            fieldBase,
            "min-h-28 resize-y px-3 py-2.5",
            error
              ? "border-danger focus:border-danger focus:ring-danger/20 motion-safe:animate-shake"
              : "border-neutral-200",
            className,
          )}
        />

        <div id={`${generatedId}-message`}>
          <FieldMessage error={error} hint={hint} />
        </div>
      </div>
    );
  }

  export function Select({
    label,
    error,
    hint,
    className,
    id,
    children,
    ...props
  }: SelectProps) {
    const generatedId =
      id || `campushub-select-${label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}`;

    return (
      <div className="w-full">
        <label
          htmlFor={generatedId}
          className="mb-1.5 block text-label font-medium text-heading"
        >
          {label}
        </label>

        <select
          {...props}
          id={generatedId}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error || hint
              ? `${generatedId}-message`
              : undefined
          }
          className={cn(
            fieldBase,
            "px-3 py-2.5",
            error
              ? "border-danger focus:border-danger focus:ring-danger/20 motion-safe:animate-shake"
              : "border-neutral-200",
            className,
          )}
        >
          {children}
        </select>

        <div id={`${generatedId}-message`}>
          <FieldMessage error={error} hint={hint} />
        </div>
      </div>
    );
  }