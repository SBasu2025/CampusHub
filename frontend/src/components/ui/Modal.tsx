import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import { X } from "lucide-react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const focusableSelector = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  showCloseButton = true,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  const dialogRef =
    useRef<HTMLDivElement>(null);

  const previousActiveElement =
    useRef<HTMLElement | null>(null);

  // Keep the latest onClose function available to
  // the keyboard handler without causing the
  // focus-management effect to re-run on every render.
  const onCloseRef =
    useRef<() => void>(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousActiveElement.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const dialog = dialogRef.current;

    if (dialog) {
      const focusableElements =
        dialog.querySelectorAll<HTMLElement>(
          focusableSelector,
        );

      const firstFocusable =
        focusableElements[0];

      firstFocusable?.focus();
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (
        event.key !== "Tab" ||
        !dialogRef.current
      ) {
        return;
      }

      const focusableElements =
        dialogRef.current.querySelectorAll<HTMLElement>(
          focusableSelector,
        );

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstFocusable =
        focusableElements[0];

      const lastFocusable =
        focusableElements[
          focusableElements.length - 1
        ];

      if (
        event.shiftKey &&
        document.activeElement ===
          firstFocusable
      ) {
        event.preventDefault();
        lastFocusable.focus();
        return;
      }

      if (
        !event.shiftKey &&
        document.activeElement ===
          lastFocusable
      ) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      previousActiveElement.current?.focus();
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="presentation"
        >
          {/* Visual backdrop */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
          />

          {/* Clickable backdrop */}
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="absolute inset-0 z-[5] cursor-default border-0 bg-transparent p-0"
          />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={
              description
                ? descriptionId
                : undefined
            }
            className={cn(
              "relative z-10 w-full overflow-hidden rounded-lg border border-neutral-200 bg-surface-card shadow-lg",
              sizeClasses[size],
            )}
            initial={{
              opacity: 0,
              y: 12,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -8,
              scale: 0.98,
            }}
            transition={{
              duration: 0.25,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="font-heading text-h3 text-heading"
                >
                  {title}
                </h2>

                {description && (
                  <p
                    id={descriptionId}
                    className="mt-1 text-body-sm text-muted"
                  >
                    {description}
                  </p>
                )}
              </div>

              {showCloseButton && (
                <button
                  type="button"
                  aria-label="Close dialog"
                  onClick={onClose}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors duration-150 hover:bg-neutral-100 hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 active:scale-[0.97]"
                >
                  <X
                    aria-hidden="true"
                    className="h-5 w-5"
                  />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex flex-col-reverse gap-2 border-t border-neutral-200 bg-neutral-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}