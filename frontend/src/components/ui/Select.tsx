import type {
    SelectHTMLAttributes,
  } from "react";

  export interface SelectOption {
    value: string;
    label: string;
  }

  export interface SelectProps
    extends Omit<
      SelectHTMLAttributes<HTMLSelectElement>,
      "size"
    > {
    label?: string;
    options: SelectOption[];
    error?: string;
    helperText?: string;
    required?: boolean;
  }

  export function Select({
    label,
    options,
    error,
    helperText,
    required,
    className = "",
    id,
    ...props
  }: SelectProps) {
    const selectId =
      id ??
      (label
        ? label
            .toLowerCase()
            .replace(/\s+/g, "-")
        : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-2 block text-body-sm font-medium text-heading"
          >
            {label}

            {required && (
              <span className="ml-1 text-danger">
                *
              </span>
            )}
          </label>
        )}

        <select
          id={selectId}
          className={`min-h-11 w-full rounded-lg border bg-white px-3.5 py-2.5 text-body text-heading shadow-sm outline-none transition-all duration-150 ${
            error
              ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20"
              : "border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          } disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 ${className}`}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${selectId}-error`
              : helperText
                ? `${selectId}-helper`
                : undefined
          }
          {...props}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p
            id={`${selectId}-error`}
            className="mt-1.5 text-body-sm text-danger"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p
            id={`${selectId}-helper`}
            className="mt-1.5 text-body-sm text-neutral-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }