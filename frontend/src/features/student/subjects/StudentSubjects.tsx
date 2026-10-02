import {
  useMemo,
} from "react";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

import {
  ArrowRight,
  BookPlus,
} from "lucide-react";

import toast from "react-hot-toast";

import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import Skeleton from "../../../components/ui/Skeleton";
import { useAuthStore } from "../../../lib/auth/store";
import { getApiErrorMessage } from "../../../lib/utils/errors";
import { useStudentSubjects } from "./useStudentSubjects";

export default function StudentSubjects() {
  const user = useAuthStore(
    (state) => state.user,
  );

  const studentId =
    user?.role === "STUDENT"
      ? user.id
      : "";

  const {
    student,
    selected,
    available,
    selectMutation,
  } = useStudentSubjects(
    studentId,
  );

  const selectedIds =
    useMemo(
      () =>
        new Set(
          (
            selected.data ?? []
          ).map(
            (row) =>
              row.subject.subjectId,
          ),
        ),
      [selected.data],
    );

  const selectedSubjects =
    selected.data ?? [];

  const availableSubjects =
    (available.data ?? []).filter(
      (subject) =>
        !selectedIds.has(
          subject.subjectId,
        ),
    );

  async function select(
    subjectId: string,
  ) {
    try {
      await selectMutation.mutateAsync(
        subjectId,
      );

      toast.success(
        "Subject selected.",
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(error),
      );
    }
  }

  if (!user) {
    return null;
  }

  if (
    student.isLoading ||
    selected.isLoading ||
    available.isLoading
  ) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-60" />

        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <Card key={index}>
              <Skeleton className="h-56 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (
    student.isError ||
    selected.isError ||
    available.isError ||
    !student.data
  ) {
    return (
      <EmptyState
        title="Unable to load subjects"
        description="Please check the backend and try again."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="pl-6 sm:pl-8">
        <h1 className="font-heading text-h1 text-heading">
          My Subjects
        </h1>

        <p className="mt-1 text-body-sm text-muted">
          Choose from subjects available for
          your current course.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="h-full">
          <div className="flex items-center justify-between gap-4 border-b border-default pb-4">
            <div>
              <h2 className="font-heading text-h3 text-heading">
                Available Subjects
              </h2>

              <p className="mt-1 text-caption text-muted">
                {
                  availableSubjects.length
                }{" "}
                available
              </p>
            </div>

            <BookPlus className="h-5 w-5 text-primary-600" />
          </div>

          <div className="mt-4 space-y-3">
            <AnimatePresence mode="popLayout">
              {availableSubjects.map(
                (subject) => (
                  <motion.div
                    key={
                      subject.subjectId
                    }
                    layoutId={`subject-${subject.subjectId}`}
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
                      x: 40,
                    }}
                    className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-heading text-body-sm font-semibold text-heading">
                        {
                          subject.subjectName
                        }
                      </p>

                      <p className="mt-1 text-caption text-muted">
                        {
                          subject.subjectId
                        }{" "}
                        ·{" "}
                        {
                          subject.course
                            .courseName
                        }
                      </p>
                    </div>

                    <Button
                      size="sm"
                      loading={
                        selectMutation.isPending &&
                        selectMutation.variables ===
                          subject.subjectId
                      }
                      onClick={() =>
                        void select(
                          subject.subjectId,
                        )
                      }
                    >
                      Select
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ),
              )}
            </AnimatePresence>

            {availableSubjects.length ===
              0 && (
              <EmptyState
                title="No subjects left to select"
                description="All available subjects for your course are already selected."
              />
            )}
          </div>
        </Card>

        <Card className="h-full">
          <div className="flex items-center justify-between gap-4 border-b border-default pb-4">
            <div>
              <h2 className="font-heading text-h3 text-heading">
                My Selected Subjects
              </h2>

              <p className="mt-1 text-caption text-muted">
                {
                  selectedSubjects.length
                }{" "}
                selected
              </p>
            </div>

            <span className="rounded-full bg-primary-50 px-3 py-1 text-caption font-semibold text-primary-700">
              Semester{" "}
              {student.data.semester}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <AnimatePresence mode="popLayout">
              {selectedSubjects.map(
                (row) => (
                  <motion.div
                    key={
                      row.subject
                        .subjectId
                    }
                    layoutId={`subject-${row.subject.subjectId}`}
                    initial={{
                      opacity: 0,
                      x: -40,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    exit={{
                      opacity: 0,
                      x: 40,
                    }}
                    className="flex items-center justify-between gap-4 rounded-lg border border-primary-100 bg-primary-50/50 p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-heading text-body-sm font-semibold text-heading">
                        {
                          row.subject
                            .subjectName
                        }
                      </p>

                      <p className="mt-1 text-caption text-muted">
                        {
                          row.subject
                            .subjectId
                        }{" "}
                        ·{" "}
                        {
                          row.subject
                            .course
                            .courseName
                        }
                      </p>
                    </div>
                  </motion.div>
                ),
              )}
            </AnimatePresence>

            {selectedSubjects.length ===
              0 && (
              <EmptyState
                title="No selected subjects"
                description="Choose a subject from the left column to get started."
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}