"use client";

import { useState } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "danger" | "warning" | "info";
  requireReason?: boolean;
  reasonPlaceholder?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "danger",
  requireReason = false,
  reasonPlaceholder = "Provide a reason for this action...",
}: ConfirmModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError(true);
      return;
    }
    setError(false);
    onConfirm(reason);
    setReason("");
    onClose();
  };

  const btnBg =
    variant === "danger"
      ? "bg-rose-600 hover:bg-rose-700 text-white"
      : variant === "warning"
      ? "bg-amber-600 hover:bg-amber-700 text-white"
      : "bg-primary hover:bg-primary/90 text-white";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
        <h3 className="text-lg font-bold text-dark dark:text-white mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-dark-4 dark:text-dark-6 mb-4">{description}</p>
        )}

        {requireReason && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-dark dark:text-white mb-1">
              Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setError(false);
              }}
              placeholder={reasonPlaceholder}
              className="w-full rounded-lg border border-stroke bg-gray-2 p-3 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
            />
            {error && (
              <p className="text-xs text-rose-500 mt-1">A reason is required to proceed.</p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setReason("");
              setError(false);
              onClose();
            }}
            className="rounded-lg border border-stroke bg-gray-2 px-4 py-2 text-sm font-medium text-dark hover:bg-gray-3 dark:border-stroke-dark dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${btnBg}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
