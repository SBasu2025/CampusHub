import { motion } from "framer-motion";
import {
  Building2,
  IdCard,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import Skeleton from "../../../components/ui/Skeleton";
import StatusPill from "../../../components/ui/StatusPill";
import { useAuthStore } from "../../../lib/auth/store";
import { useProfessorProfile } from "./useProfessorProfile";

export default function ProfessorProfile() {
  const user = useAuthStore(
    (state) => state.user,
  );

  const professorId =
    user?.role === "PROFESSOR"
      ? user.id
      : "";

  const query =
    useProfessorProfile(professorId);

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="pl-6 sm:pl-8">
        <h1 className="font-heading text-h1 text-heading">
          My Profile
        </h1>

        <p className="mt-1 text-body-sm text-muted">
          Your CampusHub profile information.
        </p>
      </div>

      {query.isLoading ? (
        <Card>
          <div className="space-y-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
        </Card>
      ) : query.isError ||
        !query.data ? (
        <EmptyState
          title="Unable to load profile"
          description="Please check the backend and try again."
          action={{
            label: "Try again",
            onClick: () =>
              void query.refetch(),
          }}
        />
      ) : (
        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          whileHover={{
            y: -2,
          }}
          whileTap={{
            scale: 0.997,
          }}
          transition={{
            duration: 0.2,
          }}
        >
          <Card className="mx-auto w-full max-w-3xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                <UserRound className="h-8 w-8" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-heading text-2xl font-bold text-heading">
                    {query.data.professorName}
                  </h2>

                  <StatusPill
                    status={
                      query.data.active
                        ? "Active"
                        : "Inactive"
                    }
                  />
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
                    className="rounded-md border border-[#b9dcf0] bg-[#D3EEFF] p-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
                  >
                    <div className="flex items-center gap-2 text-muted">
                      <IdCard className="h-4 w-4" />

                      <span className="text-caption">
                        Professor ID
                      </span>
                    </div>

                    <p className="mt-2 font-mono text-sm font-semibold text-heading">
                      {query.data.profId}
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
                    className="rounded-md border border-[#b9dcf0] bg-[#D3EEFF] p-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
                  >
                    <div className="flex items-center gap-2 text-muted">
                      <Building2 className="h-4 w-4" />

                      <span className="text-caption">
                        Department
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-heading">
                      {query.data.department
                        ?.deptName ?? "—"}
                    </p>

                    <p className="mt-1 font-mono text-xs text-muted">
                      {query.data.department
                        ?.deptId ?? "—"}
                    </p>
                  </motion.div>
                </div>

                <div className="mt-5 rounded-md border border-primary-100 bg-primary-50/60 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />

                    <p className="text-body-sm text-primary-800">
                      Contact your administrator
                      to update this information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}