import {
  motion,
} from "framer-motion";

import {
  CalendarDays,
} from "lucide-react";

import ClassSessionAgenda from "../../../components/timetable/ClassSessionAgenda";

import Card from "../../../components/ui/Card";

import EmptyState from "../../../components/ui/EmptyState";

import Skeleton from "../../../components/ui/Skeleton";

import {
  useAuthStore,
} from "../../../lib/auth/store";

import {
  useStudentTimetable,
} from "./useStudentTimetable";

// ============================================================
// COMPONENT
// ============================================================

export default function StudentTimetable() {
  // ----------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------

  const user =
    useAuthStore(
      (state) =>
        state.user,
    );

  const studentId =
    user?.role ===
    "STUDENT"
      ? user.id
      : "";

  // ----------------------------------------------------------
  // QUERY
  // ----------------------------------------------------------

  const query =
    useStudentTimetable(
      studentId,
    );

  // ----------------------------------------------------------
  // AUTH GUARD
  // ----------------------------------------------------------

  if (!user) {
    return null;
  }

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  if (
    query.isLoading
  ) {
    return (
      <div className="space-y-6">
        <div className="pl-6 sm:pl-8">
          <Skeleton className="h-4 w-24" />

          <Skeleton className="mt-2 h-9 w-48" />

          <Skeleton className="mt-2 h-4 w-80" />
        </div>

        <Card>
          <div className="space-y-3">
            {Array.from({
              length: 5,
            }).map(
              (_, index) => (
                <Skeleton
                  key={index}
                  className="h-20 w-full"
                />
              ),
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ----------------------------------------------------------
  // ERROR
  // ----------------------------------------------------------

  if (
    query.isError
  ) {
    return (
      <EmptyState
        title="Unable to load timetable"
        description="Your dated class sessions could not be retrieved from CampusHub."
        action={{
          label:
            "Try again",

          onClick: () => {
            void query.refetch();
          },
        }}
      />
    );
  }

  const sessions =
    query.data ?? [];

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ====================================================
          HEADER
          ==================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.35,
          ease: [
            0.16,
            1,
            0.3,
            1,
          ],
        }}
        className="pl-6 sm:pl-8"
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary-600" />

          <p className="text-body-sm font-medium text-primary-600">
            Schedule
          </p>
        </div>

        <h1 className="mt-1 font-heading text-h1 text-heading">
          Timetable
        </h1>

        <p className="mt-1 max-w-2xl text-body-sm text-muted">
          Your dated class occurrences, arranged chronologically from today through upcoming sessions.
        </p>
      </motion.div>

      {/* ====================================================
          AGENDA
          ==================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.35,
          delay: 0.05,
          ease: [
            0.16,
            1,
            0.3,
            1,
          ],
        }}
      >
        <Card>
          <ClassSessionAgenda
            sessions={
              sessions
            }
            emptyMessage="No class sessions are scheduled yet."
          />
        </Card>
      </motion.div>
    </div>
  );
}