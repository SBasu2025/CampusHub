import {
  type SubmitEvent,
  useMemo,
  useState,
} from "react";
import {
  Phone,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import toast from "react-hot-toast";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import DataTable from "../../../components/ui/DataTable";
import EmptyState from "../../../components/ui/EmptyState";
import Modal from "../../../components/ui/Modal";
import StatusPill from "../../../components/ui/StatusPill";
import { Input } from "../../../components/ui/Input";

import type { Admin } from "../../../lib/api/types";
import { useAuthStore } from "../../../lib/auth/store";

import {
  useAdmins,
  useCreateAdmin,
  useDeleteAdmin,
  useSetAdminActive,
} from "./useAdminAccounts";

const PHONE_NUMBER_REGEX =
  /^\+?[0-9]{7,15}$/;

/*
 * Designated CampusHub Special Admin.
 *
 * Special Admin:
 * - can create administrators
 * - can activate/deactivate other administrators
 * - can delete other administrators
 * - cannot delete their own account
 *
 * Other administrator capabilities remain available
 * through the normal student / professor / academic
 * administration pages.
 */
const ADMIN_OWNER_ID =
  "ADMIN_hrmNZO331@";

/**
 * Extract a useful backend/frontend error message.
 *
 * The backend may return either:
 *
 * 1. A plain string:
 *    "Phone number is already registered to a student."
 *
 * 2. A JSON object:
 *    { "message": "..." }
 *
 * 3. A normal JavaScript Error.
 */
function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: unknown;
        };
      }
    ).response;

    const data =
      response?.data;

    // Backend currently returns plain text.
    if (typeof data === "string") {
      const message = data.trim();

      if (message) {
        return message;
      }
    }

    // Also support the common JSON { message: "..." } format.
    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data
    ) {
      const message = (
        data as {
          message?: unknown;
        }
      ).message;

      if (
        typeof message === "string" &&
        message.trim()
      ) {
        return message.trim();
      }
    }

    /*
     * Some backends may return:
     *
     * { error: "..." }
     *
     * Support that as a fallback.
     */
    if (
      typeof data === "object" &&
      data !== null &&
      "error" in data
    ) {
      const message = (
        data as {
          error?: unknown;
        }
      ).error;

      if (
        typeof message === "string" &&
        message.trim()
      ) {
        return message.trim();
      }
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

export default function AdminAccounts() {
  // ==========================================================
  // CURRENT USER / PERMISSION
  // ==========================================================

  const currentUser = useAuthStore(
    (state) => state.user,
  );

  /*
   * Only the designated Special Admin can manage
   * administrator accounts.
   */
  const canManageOtherAdmins =
    currentUser?.role === "ADMIN" &&
    currentUser.id === ADMIN_OWNER_ID;

  // ==========================================================
  // ADMIN DIRECTORY QUERY
  // ==========================================================

  // IMPORTANT:
  // Normal administrators must not call GET /api/admins.
  //
  // The backend intentionally returns 403 for that endpoint
  // when the authenticated administrator is not the Special
  // Admin.
  //
  // Therefore:
  //
  // Special Admin -> useAdmins(true)
  // Normal Admin  -> useAdmins(false)
  //
  // This prevents the unnecessary 403 request and toast.
  // ==========================================================

  const {
    data: admins = [],
    isLoading,
    isError,
  } = useAdmins(
    canManageOtherAdmins,
  );

  // ==========================================================
  // MUTATIONS
  // ==========================================================

  const createAdminMutation =
    useCreateAdmin();

  const setAdminActiveMutation =
    useSetAdminActive();

  const deleteAdminMutation =
    useDeleteAdmin();

  // ==========================================================
  // LOCAL STATE
  // ==========================================================

  const [search, setSearch] =
    useState("");

  const [formOpen, setFormOpen] =
    useState(false);

  const [deletingAdmin, setDeletingAdmin] =
    useState<Admin | null>(null);

  const [adminName, setAdminName] =
    useState("");

  const [phoneNumber, setPhoneNumber] =
    useState("");

  // ---------------------------------------------------------------------------
  // FILTER ADMIN DIRECTORY
  // ---------------------------------------------------------------------------

  const filteredAdmins = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return admins;
    }

    return admins.filter((admin) => {
      const nameMatches =
        admin.adminName
          .toLowerCase()
          .includes(query);

      const idMatches =
        admin.adminId
          .toLowerCase()
          .includes(query);

      const phoneMatches =
        Boolean(admin.phoneNumber) &&
        admin.phoneNumber
          .toLowerCase()
          .includes(query);

      return (
        nameMatches ||
        idMatches ||
        phoneMatches
      );
    });
  }, [admins, search]);

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------

  const activeCount =
    admins.filter(
      (admin) => admin.active,
    ).length;

  const inactiveCount =
    admins.length - activeCount;

  // ---------------------------------------------------------------------------
  // CREATE ADMIN
  // ---------------------------------------------------------------------------

  function openCreate() {
    setAdminName("");
    setPhoneNumber("");
    setFormOpen(true);
  }

  function closeForm() {
    if (
      createAdminMutation.isPending
    ) {
      return;
    }

    setFormOpen(false);
    setAdminName("");
    setPhoneNumber("");
  }

  async function handleSubmit(
    event: SubmitEvent,
  ) {
    event.preventDefault();

    const trimmedName =
      adminName.trim();

    const trimmedPhone =
      phoneNumber.trim();

    // -----------------------------------------------------------------------
    // CLIENT-SIDE VALIDATION
    // -----------------------------------------------------------------------

    if (!trimmedName) {
      toast.error(
        "Admin name is required.",
      );

      return;
    }

    if (!trimmedPhone) {
      toast.error(
        "Phone number is required.",
      );

      return;
    }

    if (
      !PHONE_NUMBER_REGEX.test(
        trimmedPhone,
      )
    ) {
      toast.error(
        "Enter a valid phone number, e.g. 9876543210.",
      );

      return;
    }

    /*
     * Quick local check against loaded ADMIN accounts.
     *
     * This is only an optimisation for immediate feedback.
     * The backend remains authoritative and also checks
     * PROFESSOR + STUDENT.
     */
    const duplicateAdmin =
      admins.some(
        (admin) =>
          admin.phoneNumber?.trim() ===
          trimmedPhone,
      );

    if (duplicateAdmin) {
      toast.error(
        "This phone number is already registered to another admin.",
      );

      return;
    }

    // -----------------------------------------------------------------------
    // SERVER-SIDE CREATE
    // -----------------------------------------------------------------------

    try {
      await createAdminMutation.mutateAsync(
        {
          adminName:
            trimmedName,
          phoneNumber:
            trimmedPhone,
        },
      );

      toast.success(
        "Admin account created.",
      );

      closeForm();
    } catch (error) {
      /*
       * Important:
       *
       * Backend duplicate-phone responses are now plain strings,
       * so getErrorMessage() correctly displays them.
       */
      toast.error(
        getErrorMessage(error),
      );
    }
  }

  // ---------------------------------------------------------------------------
  // ACTIVATE / DEACTIVATE
  // ---------------------------------------------------------------------------

  async function handleToggle(
    admin: Admin,
  ) {
    try {
      await setAdminActiveMutation.mutateAsync(
        {
          adminId:
            admin.adminId,
          active:
            !admin.active,
        },
      );

      toast.success(
        admin.active
          ? "Admin account deactivated."
          : "Admin account activated.",
      );
    } catch (error) {
      toast.error(
        getErrorMessage(error),
      );
    }
  }

  // ---------------------------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------------------------

  async function handleDelete() {
    if (!deletingAdmin) {
      return;
    }

    /*
     * Frontend protection:
     * the currently authenticated administrator can never
     * delete their own account.
     *
     * Backend AdminService performs the authoritative check
     * as well, including direct API requests.
     */
    if (
      currentUser?.id ===
      deletingAdmin.adminId
    ) {
      toast.error(
        "You cannot delete your own administrator account.",
      );

      setDeletingAdmin(null);

      return;
    }

    try {
      await deleteAdminMutation.mutateAsync(
        deletingAdmin.adminId,
      );

      toast.success(
        "Admin account deleted.",
      );

      setDeletingAdmin(null);
    } catch (error) {
      /*
       * Special Admin self-delete attempts that somehow reach
       * this point are now returned by the backend as:
       *
       * 403
       * "The Special Admin account cannot be deleted."
       *
       * getErrorMessage() displays that text correctly.
       */
      toast.error(
        getErrorMessage(error),
      );
    }
  }

  // ---------------------------------------------------------------------------
  // NORMAL ADMIN RESTRICTED VIEW
  // ---------------------------------------------------------------------------

  // IMPORTANT:
  // This is deliberately placed after all hooks.
  // We must not conditionally skip React hooks.
  // ---------------------------------------------------------------------------

  if (!canManageOtherAdmins) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-heading">
            Admin Accounts
          </h1>

          <p className="mt-1 text-sm text-muted">
            Administrator account management.
          </p>
        </div>

        <Card className="p-8">
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <ShieldCheck size={28} />
            </div>

            <h2 className="mt-5 text-xl font-semibold text-heading">
              Access Restricted
            </h2>

            <p className="mt-2 max-w-lg text-sm leading-6 text-muted">
              Administrator account management is
              restricted to the Special Administrator.
              You do not have permission to view or
              modify other administrator accounts.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // TABLE COLUMNS
  // ---------------------------------------------------------------------------

  const columns = [
    {
      key: "adminId",
      header: "Admin ID",
      accessor:
        "adminId" as keyof Admin,
      sortable: true,

      render: (
        admin: Admin,
      ) => {
        const isCurrentAdmin =
          currentUser?.id ===
          admin.adminId;

        /*
         * Special Admin can see every administrator ID.
         *
         * Other administrators can only see their own ID.
         */
        const canSeeAdminId =
          canManageOtherAdmins ||
          isCurrentAdmin;

        if (!canSeeAdminId) {
          return (
            <span className="text-sm text-slate-400">
              —
            </span>
          );
        }

        return (
          <span className="font-mono text-sm text-slate-700">
            {admin.adminId}
          </span>
        );
      },
    },

    {
      key: "adminName",
      header: "Name",
      accessor:
        "adminName" as keyof Admin,
      sortable: true,

      render: (
        admin: Admin,
      ) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            <ShieldCheck size={17} />
          </div>

          <span className="font-medium text-slate-900">
            {admin.adminName}
          </span>
        </div>
      ),
    },

    {
      key: "phoneNumber",
      header: "Phone Number",
      accessor:
        "phoneNumber" as keyof Admin,
      sortable: true,

      render: (
        admin: Admin,
      ) => {
        const phone =
          admin.phoneNumber?.trim();

        if (!phone) {
          return (
            <span className="text-sm text-slate-400">
              Not added
            </span>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <Phone
              size={15}
              className="text-slate-400"
            />

            <span className="font-mono text-sm text-slate-700">
              {phone}
            </span>
          </div>
        );
      },
    },

    {
      key: "status",
      header: "Status",

      render: (
        admin: Admin,
      ) => (
        <StatusPill
          status={
            admin.active
              ? "Active"
              : "Inactive"
          }
        />
      ),
    },

    {
      key: "actions",
      header: "Actions",

      render: (
        admin: Admin,
      ) => {
        const isCurrentAdmin =
          currentUser?.id ===
          admin.adminId;

        /*
         * Only the Special Admin can manage
         * another administrator.
         *
         * Even the Special Admin cannot manage
         * their own account from this table.
         */
        const canManageThisAdmin =
          canManageOtherAdmins &&
          !isCurrentAdmin;

        if (!canManageThisAdmin) {
          return null;
        }

        const isDeletingThisAdmin =
          deleteAdminMutation.isPending &&
          deleteAdminMutation.variables ===
            admin.adminId;

        const isTogglingThisAdmin =
          setAdminActiveMutation.isPending &&
          setAdminActiveMutation.variables
            ?.adminId ===
            admin.adminId;

        return (
          <div
            className="flex flex-wrap items-center gap-2"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <Button
              variant="ghost"
              size="sm"
              loading={
                isTogglingThisAdmin
              }
              disabled={
                isDeletingThisAdmin ||
                deleteAdminMutation.isPending
              }
              onClick={() =>
                void handleToggle(
                  admin,
                )
              }
            >
              {admin.active
                ? "Deactivate"
                : "Activate"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              loading={
                isDeletingThisAdmin
              }
              disabled={
                isTogglingThisAdmin ||
                setAdminActiveMutation.isPending
              }
              onClick={() =>
                setDeletingAdmin(
                  admin,
                )
              }
            >
              <Trash2 size={15} />
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-heading">
            Admin Accounts
          </h1>

          <p className="mt-1 text-sm text-muted">
            Create, activate, and manage
            administrator accounts.
          </p>
        </div>

        {canManageOtherAdmins && (
          <Button
            onClick={openCreate}
          >
            <UserPlus size={17} />
            Add Admin
          </Button>
        )}
      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted">
            Total Admins
          </p>

          <p className="mt-2 text-3xl font-semibold text-heading">
            {admins.length}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-muted">
            Active
          </p>

          <p className="mt-2 text-3xl font-semibold text-secondary-600">
            {activeCount}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-muted">
            Inactive
          </p>

          <p className="mt-2 text-3xl font-semibold text-slate-500">
            {inactiveCount}
          </p>
        </Card>
      </div>

      {/* =====================================================
          ADMIN DIRECTORY
      ===================================================== */}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-default px-6 py-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-semibold text-heading">
              Administrator Directory
            </h2>

            <p className="mt-1 text-sm text-muted">
              {filteredAdmins.length}{" "}
              {filteredAdmins.length === 1
                ? "account"
                : "accounts"}
            </p>
          </div>

          <div className="w-full md:max-w-sm">
            <Input
              label="Search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search by name, ID, or phone..."
            />
          </div>
        </div>

        {isError ? (
          <EmptyState
            title="Unable to load admin accounts"
            description="Please check the backend and try again."
          />
        ) : isLoading ? (
          <DataTable
            data={[]}
            columns={columns}
            rowKey="adminId"
            loading
            pageSize={15}
          />
        ) : filteredAdmins.length === 0 ? (
          <EmptyState
            title={
              admins.length === 0
                ? "No admin accounts"
                : "No matching accounts"
            }
            description={
              admins.length === 0
                ? "Create the first administrator account to get started."
                : "Try a different search term."
            }
            action={
              admins.length === 0 &&
              canManageOtherAdmins
                ? {
                    label: "Add Admin",
                    onClick:
                      openCreate,
                  }
                : undefined
            }
          />
        ) : (
          <DataTable
            data={filteredAdmins}
            columns={columns}
            rowKey="adminId"
            pageSize={15}
          />
        )}
      </Card>

      {/* =====================================================
          CREATE ADMIN MODAL
      ===================================================== */}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title="Create Admin Account"
        description="Create a new active administrator account."
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <Input
            label="Admin Name"
            value={adminName}
            onChange={(event) =>
              setAdminName(
                event.target.value,
              )
            }
            placeholder="Enter admin name"
            required
            autoFocus
          />

          <Input
            label="Phone Number"
            type="tel"
            value={phoneNumber}
            onChange={(event) =>
              setPhoneNumber(
                event.target.value,
              )
            }
            placeholder="e.g. 9876543210"
            required
          />

          <p className="text-sm text-muted">
            The phone number must be unique across
            all CampusHub admin, professor, and
            student accounts.
          </p>

          <p className="text-sm text-muted">
            The backend will generate the Admin ID
            automatically.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={closeForm}
              disabled={
                createAdminMutation.isPending
              }
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={
                createAdminMutation.isPending
              }
            >
              Create Admin
            </Button>
          </div>
        </form>
      </Modal>

      {/* =====================================================
          DELETE ADMIN MODAL
      ===================================================== */}

      <Modal
        open={!!deletingAdmin}
        onClose={() =>
          deleteAdminMutation.isPending
            ? undefined
            : setDeletingAdmin(null)
        }
        title="Delete Admin Account"
      >
        <div className="space-y-5">
          <p className="text-sm leading-6 text-muted">
            Delete the administrator account for{" "}
            <span className="font-medium text-heading">
              {deletingAdmin?.adminName ??
                ""}
            </span>{" "}
            (
            <span className="font-mono text-xs">
              {deletingAdmin?.adminId ??
                ""}
            </span>
            )?
          </p>

          {deletingAdmin?.phoneNumber && (
            <p className="text-sm text-muted">
              Registered phone:{" "}
              <span className="font-mono text-heading">
                {
                  deletingAdmin.phoneNumber
                }
              </span>
            </p>
          )}

          <p className="text-sm text-danger-text">
            This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() =>
                setDeletingAdmin(
                  null,
                )
              }
              disabled={
                deleteAdminMutation.isPending
              }
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              loading={
                deleteAdminMutation.isPending
              }
              onClick={() =>
                void handleDelete()
              }
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}