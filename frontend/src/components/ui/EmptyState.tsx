import type { ReactNode } from "react";

import Button from "./Button";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: EmptyStateAction;
  className?: string;
}

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function DefaultEmptyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        d="M8 7h8M8 11h5M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-56 w-full flex-col items-center justify-center px-6 py-10 text-center",
        className,
      )}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600"
        aria-hidden="true"
      >
        {icon ?? <DefaultEmptyIcon />}
      </div>

      <h3 className="mt-4 font-heading text-h3 text-heading">
        {title}
      </h3>

      <p className="mt-1 max-w-md text-body-sm text-muted">
        {description}
      </p>

      {action && (
        <div className="mt-5">
          <Button
            variant="primary"
            size="md"
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            loading={action.loading}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}