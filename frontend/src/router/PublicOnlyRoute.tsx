import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

interface PublicOnlyRouteProps {
  children: ReactNode;
}

export default function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { user, isChecking } = useAuthStore();

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-pink)] border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === "PHOTOGRAPHER" ? "/photographer" : "/"} replace />;
  }

  return <>{children}</>;
}