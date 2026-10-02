import { motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  Clock3,
} from "lucide-react";

import AttendanceDonutChart from "../../../components/charts/AttendanceDonutChart";
import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import Skeleton from "../../../components/ui/Skeleton";
import { toAttendanceDonutData } from "../../../lib/utils/charts";
import { useAuthStore } from "../../../lib/auth/store";
import { useProfessorSubjects } from "./useProfessorSubjects";

function summary(
  data: Array<{
    totalSessions: number;
    presentSessions: number;
  }>,
) {
  const total = data.reduce(
    (sum, item) =>
      sum + item.totalSessions,
    0,
  );

  const present = data.reduce(
    (sum, item) =>
      sum + item.presentSessions,
    0,
  );

  return {
    total,
    present,
    absent: Math.max(
      total - present,
      0,
    ),
    percentage: total
      ? Math.round(
          (present / total) * 100,
        )
      : 0,
  };
}

export default function ProfessorSubjects() {
  const user = useAuthStore(
    (state) => state.user,
  );

  const professorId =
    user?.role === "PROFESSOR"
      ? user.id
      : "";

  const {
    subjects,
    stats,
  } = useProfessorSubjects(
    professorId,
  );

  return (
    <div className="space-y-6">
      <div className="pl-6 sm:pl-8">
        <h1 className="font-heading text-h1 text-heading">
          My Subjects
        </h1>

        <p className="mt-1 text-body-sm text-muted">
          Teaching assignments and subject
          health at a glance.
        </p>
      </div>

      {subjects.isLoading ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <Card key={index}>
                <Skeleton className="h-44 w-full" />
              </Card>
            ),
          )}
        </div>
      ) : subjects.isError ? (
        <EmptyState
          title="Unable to load subjects"
          description="Please check the backend and try again."
          action={{
            label: "Try again",
            onClick: () =>
              void subjects.refetch(),
          }}
        />
      ) : (
        (subjects.data ?? []).length ===
        0 ? (
          <EmptyState
            icon={
              <BookOpen className="h-6 w-6" />
            }
            title="No teaching assignments"
            description="No subjects are currently assigned to your professor account."
          />
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-5 lg:grid-cols-2"
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.06,
                },
              },
            }}
          >
            {(subjects.data ?? []).map(
              (teaching, index) => {
                const item = stats[index];

                const attendance =
                  item?.data?.attendance ??
                  [];

                const s =
                  summary(attendance);

                return (
                  <motion.div
                    key={`${teaching.id.profId}-${teaching.id.subjectId}`}
                    whileHover={{
                      y: -2,
                    }}
                    whileTap={{
                      scale: 0.997,
                    }}
                    transition={{
                      duration: 0.2,
                    }}
                    variants={{
                      hidden: {
                        opacity: 0,
                        y: 14,
                      },
                      show: {
                        opacity: 1,
                        y: 0,
                      },
                    }}
                  >
                    <Card className="h-full transition-shadow duration-200 hover:shadow-md">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-caption text-muted">
                            {
                              teaching.subject
                                .subjectId
                            }
                          </p>

                          <h2 className="mt-1 font-heading text-h3 text-heading">
                            {
                              teaching.subject
                                .subjectName
                            }
                          </h2>

                          <p className="mt-1 text-body-sm text-muted">
                            {
                              teaching.subject
                                .course.courseName
                            }
                          </p>
                        </div>

                        <motion.div
                          whileHover={{
                            y: -2,
                            scale: 1.04,
                          }}
                          whileTap={{
                            scale: 0.98,
                          }}
                          transition={{
                            duration: 0.18,
                          }}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#D3EEFF] text-primary-700 shadow-sm"
                        >
                          <BookOpen className="h-5 w-5" />
                        </motion.div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <motion.div
                          whileHover={{
                            y: -2,
                            scale: 1.015,
                          }}
                          whileTap={{
                            scale: 0.995,
                          }}
                          transition={{
                            duration: 0.18,
                          }}
                          className="rounded-md border border-[#b9dcf0] bg-[#D3EEFF] p-3 shadow-sm transition-shadow duration-200 hover:shadow-md"
                        >
                          <div className="flex items-center gap-2 text-muted">
                            <Clock3 className="h-4 w-4" />

                            <span className="text-caption">
                              Sessions
                            </span>
                          </div>

                          <p className="mt-1 font-heading text-xl font-bold text-heading tabular-nums">
                            {item?.isLoading
                              ? "—"
                              : item?.data
                                  ?.sessionCount ??
                                0}
                          </p>
                        </motion.div>

                        <motion.div
                          whileHover={{
                            y: -2,
                            scale: 1.015,
                          }}
                          whileTap={{
                            scale: 0.995,
                          }}
                          transition={{
                            duration: 0.18,
                          }}
                          className="rounded-md border border-[#b9dcf0] bg-[#D3EEFF] p-3 shadow-sm transition-shadow duration-200 hover:shadow-md"
                        >
                          <div className="flex items-center gap-2 text-muted">
                            <BarChart3 className="h-4 w-4" />

                            <span className="text-caption">
                              Class Attendance
                            </span>
                          </div>

                          <p className="mt-1 font-heading text-xl font-bold text-heading tabular-nums">
                            {item?.isLoading
                              ? "—"
                              : `${s.percentage}%`}
                          </p>
                        </motion.div>
                      </div>

                      <div className="mt-4 flex justify-center">
                        <AttendanceDonutChart
                          data={toAttendanceDonutData(
                            s.present,
                            s.absent,
                          )}
                          percentage={
                            s.percentage
                          }
                          caption="Subject attendance"
                          size="sm"
                        />
                      </div>
                    </Card>
                  </motion.div>
                );
              },
            )}
          </motion.div>
        )
      )}
    </div>
  );
}