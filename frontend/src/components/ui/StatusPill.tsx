import {
    useEffect,
    useRef,
    useState,
  } from "react";
  import { motion } from "framer-motion";

  type StatusVariant =
    | "present"
    | "absent"
    | "active"
    | "inactive"
    | "pending"
    | "exam";

  export interface StatusPillProps {
    status: string;
    variant?: StatusVariant;
    animateChange?: boolean;
    className?: string;
  }

  function cn(...classes: Array<string | undefined>) {
    return classes.filter(Boolean).join(" ");
  }

  function getVariant(
    status: string,
  ): StatusVariant {
    const normalized =
      status.trim().toLowerCase();

    switch (normalized) {
      case "present":
        return "present";

      case "absent":
        return "absent";

      case "active":
        return "active";

      case "inactive":
        return "inactive";

      case "pending":
        return "pending";

      case "final":
      case "final exam":
      case "internal":
      case "internal 1":
      case "internal 2":
      case "internal 3":
      case "internal-1":
      case "internal-2":
      case "internal-3":
        return "exam";

      default:
        return "inactive";
    }
  }

  const variantClasses: Record<
    StatusVariant,
    string
  > = {
    present:
      "bg-primary-50 text-primary-700",

    absent:
      "bg-danger-bg text-danger-text",

    active:
      "bg-secondary-50 text-secondary-700",

    inactive:
      "bg-neutral-100 text-neutral-500",

    pending:
      "bg-accent-50 text-accent-800",

    exam:
      "bg-accent-50 text-accent-800",
  };

  export default function StatusPill({
    status,
    variant,
    animateChange = false,
    className,
  }: StatusPillProps) {
    const resolvedVariant =
      variant ?? getVariant(status);

    const changeToken =
      `${resolvedVariant}:${status}`;

    const previousToken =
      useRef(changeToken);

    const [pulseKey, setPulseKey] =
      useState(0);

    useEffect(() => {
      if (
        previousToken.current !==
        changeToken
      ) {
        previousToken.current =
          changeToken;

        setPulseKey((current) =>
          current + 1,
        );
      }
    }, [changeToken]);

    const shouldPulse =
      animateChange && pulseKey > 0;

    return (
      <motion.span
        key={`${changeToken}-${pulseKey}`}
        initial={false}
        animate={
          shouldPulse
            ? {
                scale: [1, 1.15, 1],
              }
            : {
                scale: 1,
              }
        }
        transition={
          shouldPulse
            ? {
                duration: 0.3,
                ease: "easeOut",
              }
            : {
                duration: 0,
              }
        }
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-1 text-caption font-semibold leading-none transition-colors duration-300",
          variantClasses[
            resolvedVariant
          ],
          className,
        )}
      >
        {status}
      </motion.span>
    );
  }