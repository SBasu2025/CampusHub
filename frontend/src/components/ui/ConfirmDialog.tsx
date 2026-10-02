import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import Button from "./Button";
import Modal from "./Modal";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;

  title?: string;
  recordName: string;
  actionLabel?: string;
  description?: string;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirm action",
  recordName,
  actionLabel = "Delete",
  description,
}: ConfirmDialogProps) {
  const [isConfirming, setIsConfirming] =
    useState(false);

  async function handleConfirm() {
    if (isConfirming) {
      return;
    }

    setIsConfirming(true);

    try {
      await onConfirm();
      onClose();
    } finally {
      setIsConfirming(false);
    }
  }

  const message =
    description ??
    `${actionLabel} ${recordName}? This cannot be undone.`;

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!isConfirming) {
          onClose();
        }
      }}
      title={title}
      size="sm"
      showCloseButton={!isConfirming}
      footer={
        <>
          {/* Keep Cancel first in DOM so Modal's focus
              management focuses it by default. */}
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isConfirming}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            size="md"
            loading={isConfirming}
            onClick={handleConfirm}
          >
            {actionLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-danger-bg text-danger">
          <AlertTriangle
            aria-hidden="true"
            className="h-5 w-5"
          />
        </div>

        <div className="min-w-0">
          <p className="text-body text-heading">
            {message}
          </p>

          <p className="mt-2 text-body-sm text-muted">
            Please confirm that you want to continue.
          </p>
        </div>
      </div>
    </Modal>
  );
}