import { useSyncExternalStore } from "react";

export interface Toast {
  id: number;
  message: string;
  variant: "success" | "error";
}

let toasts: Toast[] = [];
let nextId = 1;

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export const toastStore = {
  getState(): Toast[] {
    return toasts;
  },
  show(message: string, variant: Toast["variant"] = "success") {
    const id = nextId++;
    toasts = [...toasts, { id, message, variant }];
    emitChange();
    setTimeout(() => toastStore.dismiss(id), 4000);
  },
  dismiss(id: number) {
    toasts = toasts.filter((toast) => toast.id !== id);
    emitChange();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useToasts(): Toast[] {
  return useSyncExternalStore(toastStore.subscribe, toastStore.getState);
}
