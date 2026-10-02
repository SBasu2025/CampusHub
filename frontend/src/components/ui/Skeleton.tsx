import type { HTMLAttributes } from "react";

export interface SkeletonProps
  extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Skeleton({
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cn(
        "animate-shimmer rounded-md bg-neutral-200",
        className,
      )}
    />
  );
}