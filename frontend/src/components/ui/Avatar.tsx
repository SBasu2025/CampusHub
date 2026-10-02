import type { HTMLAttributes } from "react";

type AvatarSize =
  | "sm"
  | "md"
  | "lg"
  | "xl";

export interface AvatarProps
  extends Omit<
    HTMLAttributes<HTMLSpanElement>,
    "color"
  > {
  name: string;
  id: string;
  size?: AvatarSize;
}

const sizeClasses: Record<
  AvatarSize,
  string
> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

const colorClasses = [
  "bg-primary-500",
  "bg-secondary-500",
  "bg-primary-600",
  "bg-secondary-600",
  "bg-primary-700",
  "bg-secondary-700",
];

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`
    .toUpperCase();
}

function getDeterministicColor(
  id: string,
) {
  let hash = 0;

  for (let index = 0; index < id.length; index += 1) {
    hash =
      (hash * 31 +
        id.charCodeAt(index)) |
      0;
  }

  const positiveHash =
    Math.abs(hash);

  return colorClasses[
    positiveHash % colorClasses.length
  ];
}

export default function Avatar({
  name,
  id,
  size = "md",
  className,
  ...props
}: AvatarProps) {
  const initials = getInitials(name);
  const backgroundClass =
    getDeterministicColor(id);

  return (
    <span
      {...props}
      role="img"
      aria-label={`${name} avatar`}
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-heading font-semibold text-white",
        sizeClasses[size],
        backgroundClass,
        className,
      )}
    >
      {initials}
    </span>
  );
}