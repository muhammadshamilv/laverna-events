import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading,
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 soft-shadow-lg"
          >
            <h2 className="text-lg font-bold text-[var(--brand-navy)]">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                {cancelLabel}
              </Button>
              <Button
                onClick={onConfirm}
                isLoading={isLoading}
                className={destructive ? "bg-rose-600 hover:bg-rose-700" : undefined}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
