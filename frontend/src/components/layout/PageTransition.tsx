import type {
  ReactNode,
} from "react";

import {
  motion,
} from "framer-motion";

// ============================================================
// TYPES
// ============================================================

interface PageTransitionProps {
  children: ReactNode;

  /**
   * True only for the first protected page rendered after login.
   * This lets the initial dashboard entry feel slower than normal
   * section-to-section navigation. The parent AnimatePresence must also
   * allow its initial animation on the first protected render.
   */
  isInitialEntry?: boolean;
}

// ============================================================
// PAGE TRANSITION
// ============================================================
//
// Shared by every protected page.
//
// ENTER:
//   opacity 0 -> 1
//   y 8 -> 0
//
// EXIT:
//   opacity 1 -> 0
//   y 0 -> -8
//
// MotionConfig in AppProviders handles reduced-motion
// preferences globally.
// ============================================================

export function PageTransition({
  children,
  isInitialEntry = false,
}: PageTransitionProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -8,
      }}
      transition={{
        duration: isInitialEntry
          ? 0.9
          : 0.35,
        ease: [
          0.16,
          1,
          0.3,
          1,
        ] as const,
      }}
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;