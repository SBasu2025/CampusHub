import { UserRound } from "lucide-react";
import { motion } from "framer-motion";

import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import Skeleton from "../../../components/ui/Skeleton";
import StatusPill from "../../../components/ui/StatusPill";
import { useAuthStore } from "../../../lib/auth/store";
import { useStudentProfessors } from "./useStudentProfessors";

export default function StudentProfessors() {
  const user = useAuthStore(
    (state) => state.user,
  );

  const studentId =
    user?.role === "STUDENT"
      ? user.id
      : "";

  const query =
    useStudentProfessors(
      studentId,
    );

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="pl-6 sm:pl-8">
        <h1 className="font-heading text-h1 text-heading">
          My Professors
        </h1>

        <p className="mt-1 text-body-sm text-muted">
          Professors associated with your
          selected subjects.
        </p>
      </div>

      {query.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <Card key={index}>
              <Skeleton className="h-40 w-full" />
            </Card>
          ))}
        </div>
      ) : query.isError ? (
        <EmptyState
          title="Unable to load professors"
          description="Please check the backend and try again."
          action={{
            label: "Try again",
            onClick: () =>
              void query.refetch(),
          }}
        />
      ) : (
        (query.data ?? []).length ===
        0 ? (
          <EmptyState
            icon={
              <UserRound className="h-6 w-6" />
            }
            title="No professors found"
            description="Professors appear here when they are associated with your selected subjects."
          />
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.05,
                },
              },
            }}
          >
            {(query.data ?? []).map(
              (professor) => (
                <motion.div
                  key={
                    professor.profId
                  }
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: 10,
                    },
                    show: {
                      opacity: 1,
                      y: 0,
                    },
                  }}
                >
                  <Card className="h-full">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                        <UserRound className="h-6 w-6" />
                      </div>

                      <StatusPill
                        status={
                          professor.active
                            ? "Active"
                            : "Inactive"
                        }
                      />
                    </div>

                    <h2 className="mt-5 font-heading text-h3 text-heading">
                      {
                        professor.professorName
                      }
                    </h2>

                    <p className="mt-1 text-caption text-muted">
                      {professor.profId}
                    </p>

                    <p className="mt-4 text-body-sm text-muted">
                      {
                        professor
                          .department
                          ?.deptName ??
                        "Department unavailable"
                      }
                    </p>
                  </Card>
                </motion.div>
              ),
            )}
          </motion.div>
        )
      )}
    </div>
  );
}