import { motion } from "framer-motion";

export interface StepperStep {
  id: string;
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  className?: string;
}

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Stepper({
  steps,
  currentStep,
  className,
}: StepperProps) {
  const clampedStep = Math.min(
    Math.max(currentStep, 0),
    Math.max(steps.length - 1, 0),
  );

  const progressPercent =
    steps.length <= 1
      ? 0
      : (clampedStep /
          (steps.length - 1)) *
        100;

  return (
    <div
      className={cn(
        "w-full",
        className,
      )}
      aria-label="Progress"
    >
      <div className="relative">
        {/* Background connecting line */}
        {steps.length > 1 && (
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-5 hidden h-px bg-neutral-200 md:block"
          >
            <motion.div
              className="h-full origin-left bg-primary-500"
              initial={false}
              animate={{
                width: `${progressPercent}%`,
              }}
              transition={{
                duration: 0.25,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          </div>
        )}

        <ol className="relative grid gap-4 md:grid-cols-1">
          {steps.map((step, index) => {
            const isCompleted =
              index < clampedStep;

            const isCurrent =
              index === clampedStep;

            const isUpcoming =
              index > clampedStep;

            return (
              <li
                key={step.id}
                className={cn(
                  "flex items-start gap-3 md:flex-row md:items-start",
                  "md:min-h-10",
                )}
              >
                <div className="relative z-10 flex shrink-0 flex-col items-center">
                  <div
                    aria-current={
                      isCurrent
                        ? "step"
                        : undefined
                    }
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-surface-card font-heading text-sm font-semibold transition-colors duration-200",
                      isCompleted
                        ? "border-primary-500 bg-primary-500 text-white"
                        : isCurrent
                          ? "border-primary-500 text-primary-600"
                          : "border-neutral-200 text-neutral-400",
                    )}
                  >
                    {isCompleted ? (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="h-5 w-5"
                      >
                        <path
                          d="m5 12 4 4L19 6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                </div>

                <div className="min-w-0 pt-1">
                  <p
                    className={cn(
                      "text-body-sm font-semibold",
                      isCompleted ||
                        isCurrent
                        ? "text-heading"
                        : "text-neutral-400",
                    )}
                  >
                    {step.label}
                  </p>

                  {step.description && (
                    <p
                      className={cn(
                        "mt-0.5 text-caption",
                        isUpcoming
                          ? "text-neutral-400"
                          : "text-muted",
                      )}
                    >
                      {step.description}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}