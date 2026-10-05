import { useSyncExternalStore } from "react";
import type { User } from "@/types/auth.types";

interface AuthState {
  user: User | null;
  isChecking: boolean;
}

let state: AuthState = {
  user: null,
  isChecking: true,
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export const authStore = {
  getState(): AuthState {
    return state;
  },
  setUser(user: User | null) {
    state = { ...state, user };
    emitChange();
  },
  setChecking(isChecking: boolean) {
    state = { ...state, isChecking };
    emitChange();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useAuthStore(): AuthState {
  return useSyncExternalStore(authStore.subscribe, authStore.getState);
}
