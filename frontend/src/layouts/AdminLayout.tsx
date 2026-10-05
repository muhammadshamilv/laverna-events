import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { AdminBottomNav, AdminSidebar, AdminTopBar } from "@/components/admin/AdminNav";
import { Toaster } from "@/components/ui/toaster";

// Mirrors layouts/PortalLayout.tsx's shape: ONE tree mounted at a time via
// a genuine JS conditional (never a CSS-hidden duplicate - see PortalLayout's
// own comment for why that anti-pattern was banned project-wide).
//
// Simpler than PortalLayout in one respect: there's no membership/
// portal-access gate here (admins don't subscribe to plans), so the only
// gate is the role check below. Any non-ADMIN user who somehow lands on
// /admin (e.g. typing the URL directly) is redirected to their own home -
// ORGANIZER/GUEST to /portal, PHOTOGRAPHER to /photographer - exactly
// mirroring the existing mutual-redirect pattern between those two trees.
export default function AdminLayout() {
  const { user } = useAuthStore();
  const isDesktop = useIsDesktop();

  if (user?.role === "PHOTOGRAPHER") {
    return <Navigate to="/photographer" replace />;
  }

  if (user?.role !== "ADMIN") {
    return <Navigate to="/portal" replace />;
  }

  if (isDesktop) {
    return (
      <div className="flex min-h-screen bg-slate-50/70">
        <AdminSidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/70">
      <AdminTopBar />
      <main className="min-w-0 flex-1 pb-24">
        <Outlet />
      </main>
      <AdminBottomNav />
      <Toaster />
    </div>
  );
}