import {
  motion,
} from "framer-motion";

import {
  Mail,
  UserRound,
} from "lucide-react";

import {
  useAuthStore,
} from "../../../lib/auth/store";

import Card from "../../../components/ui/Card";

import EmptyState from "../../../components/ui/EmptyState";

import Skeleton from "../../../components/ui/Skeleton";

import {
  useStudentProfile,
} from "./useStudentProfile";

// ============================================================
// COMPONENT
// ============================================================

export default function StudentProfile() {
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

  const {
    data: student,
    isLoading,
    isError,
  } =
    useStudentProfile(
      studentId,
    );

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="pl-6 sm:pl-8">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-10 w-56" />
          <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        </div>

        <Card>
          <Skeleton className="h-32 w-full" />
        </Card>
      </div>
    );
  }

  if (
    isError ||
    !student
  ) {
    return (
      <div className="space-y-6">
        <div className="pl-6 sm:pl-8">
          <p className="text-body-sm font-medium text-primary-600">
            Student Portal
          </p>

          <h1 className="mt-1 font-heading text-h1 text-heading">
            My Profile
          </h1>

          <p className="mt-1 text-body-sm text-muted">
            Your CampusHub profile information.
          </p>
        </div>

        <EmptyState
          title="Unable to load profile"
          description="Your student profile could not be retrieved from CampusHub."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
        <p className="text-body-sm font-medium text-primary-600">
          Student Portal
        </p>

        <h1 className="mt-1 font-heading text-h1 text-heading">
          My Profile
        </h1>

        <p className="mt-1 text-body-sm text-muted">
          Your CampusHub profile information.
        </p>
      </motion.div>

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
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                <UserRound className="h-7 w-7" />
              </div>

              <div>
                <h2 className="font-heading text-h2 text-heading">
                  {student.studentName}
                </h2>

                <p className="mt-1 text-body-sm text-muted">
                  {student.studentId}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-default p-4">
                <p className="text-caption text-muted">
                  Student ID
                </p>

                <p className="mt-1 font-semibold text-heading">
                  {student.studentId}
                </p>
              </div>

              <div className="rounded-lg border border-default p-4">
                <p className="text-caption text-muted">
                  Course
                </p>

                <p className="mt-1 font-semibold text-heading">
                  {student.course.courseName}
                </p>

                <p className="mt-1 text-caption text-muted">
                  {student.course.courseId}
                </p>
              </div>

              <div className="rounded-lg border border-default p-4">
                <p className="text-caption text-muted">
                  Section
                </p>

                <p className="mt-1 font-semibold text-heading">
                  {student.section}
                </p>
              </div>

              <div className="rounded-lg border border-default p-4">
                <p className="text-caption text-muted">
                  Semester
                </p>

                <p className="mt-1 font-semibold text-heading">
                  {student.semester}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-surface-muted p-4">
              <Mail className="h-5 w-5 text-primary-600" />

              <div>
                <p className="text-caption text-muted">
                  CampusHub Login ID
                </p>

                <p className="mt-1 font-semibold text-heading">
                  {student.studentId}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}