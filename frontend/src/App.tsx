import { useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "./api/queryClient";
import { setSessionExpiredHandler } from "./api/client";
import { useCurrentUser, authKeys } from "./queries/useAuthQueries";
import { authStore, useAuthStore } from "./stores/auth.store";
import { isNativeApp } from "./lib/platform";
import { Skeleton } from "./components/ui/skeleton";

import PublicLayout from "./layouts/PublicLayout";
import PortalLayout from "./layouts/PortalLayout";
import PhotographerLayout from "./layouts/PhotographerLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./router/ProtectedRoute";
import PublicOnlyRoute from "./router/PublicOnlyRoute";

import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Features from "./pages/public/Features";
import Pricing from "./pages/public/Pricing";
import Gallery from "./pages/public/Gallery";
import FAQ from "./pages/public/FAQ";
import Contact from "./pages/public/Contact";

import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import VerifyMobile from "./pages/auth/VerifyMobile";
import RespondToInvitation from "./pages/public/RespondToInvitation";
import ScanEvent from "./pages/public/ScanEvent";

import PortalDashboard from "./pages/portal/PortalDashboard";
import GuestsHub from "./pages/portal/GuestsHub";
import EventsList from "./pages/portal/events/EventsList";
import EventCreate from "./pages/portal/events/EventCreate";
import EventDetail from "./pages/portal/events/EventDetail";
import EventEdit from "./pages/portal/events/EventEdit";
import EventGuests from "./pages/portal/events/EventGuests";
import EventInvitations from "./pages/portal/events/EventInvitations";
import EventGallery from "./pages/portal/events/EventGallery";
import EventQRCode from "./pages/portal/events/EventQRCode";
import InvitationTemplates from "./pages/portal/InvitationTemplates";
import Billing from "./pages/portal/Billing";
import ComingSoon from "./pages/portal/ComingSoon";
import PaymentSuccess from "./pages/payment/PaymentSuccess";
import PaymentCancelled from "./pages/payment/PaymentCancelled";
import PaymentTopupSuccess from "./pages/payment/PaymentTopupSuccess";

import PhotographerEvents from "./pages/photographer/PhotographerEvents";
import PhotographerEventUpload from "./pages/photographer/PhotographerEventUpload";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminUserManagement from "./pages/admin/UserManagement";
import AdminMembershipPlans from "./pages/admin/MembershipPlans";
import AdminInvitationTemplates from "./pages/admin/InvitationTemplates";
import AdminMediaManagement from "./pages/admin/MediaManagement";
import AdminChannelPools from "./pages/admin/ChannelPools";
import AdminTopupPacks from "./pages/admin/TopupPacks";
import AdminReports from "./pages/admin/Reports";

function SessionBootstrap() {
  useCurrentUser();

  const rqClient = useQueryClient();

  useEffect(() => {
    setSessionExpiredHandler(() => {
      rqClient.setQueryData(authKeys.currentUser, null);
      authStore.setUser(null);
      authStore.setChecking(false);
    });
  }, [rqClient]);

  return null;
}

function AppSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-32" />
        <div className="hidden items-center gap-2 md:flex">
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="mx-auto h-10 w-10 rounded-full" />
          <Skeleton className="mx-auto h-4 w-40" />
          <Skeleton className="mx-auto h-4 w-28" />
        </div>
      </div>
    </div>
  );
}

function PublicOnlyForNonPhotographers({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();

  if (user?.role === "PHOTOGRAPHER") {
    return <Navigate to="/photographer" replace />;
  }

  if (user?.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isChecking, user } = useAuthStore();

  if (isChecking) {
    return <AppSkeleton />;
  }

  const nativeApp = isNativeApp();
  const fallbackPath = !user
    ? "/login"
    : user.role === "PHOTOGRAPHER"
      ? "/photographer"
      : user.role === "ADMIN"
        ? "/admin"
        : "/portal";

  return (
    <Routes>
      {!nativeApp && (
        <Route
          element={
            <PublicOnlyForNonPhotographers>
              <PublicLayout />
            </PublicOnlyForNonPhotographers>
          }
        >
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="features" element={<Features />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="contact" element={<Contact />} />
        </Route>
      )}

      {nativeApp && <Route index element={<Navigate to={fallbackPath} replace />} />}

      <Route
        path="register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route path="verify-mobile" element={<VerifyMobile />} />

      <Route path="respond/:token" element={<RespondToInvitation />} />

      <Route path="scan/:token" element={<ScanEvent />} />

      <Route path="payment/success" element={<PaymentSuccess />} />
      <Route path="payment/cancelled" element={<PaymentCancelled />} />
      {/* Phase 26: dedicated landing for topup-pack purchases, separate
          from the plan-purchase success page since it polls a different
          status endpoint and shows pack info instead of plan info. */}
      <Route path="payment/topup-success" element={<PaymentTopupSuccess />} />

      <Route
        path="photographer"
        element={
          <ProtectedRoute>
            <PhotographerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PhotographerEvents />} />
        <Route path="events/:id" element={<PhotographerEventUpload />} />
      </Route>

      {/*
        Phase 26: added channel-pools (platform-wide pool monitoring +
        topup) and topup-packs (admin CRUD on the fixed packs organizers
        can buy) to the admin portal.
      */}
      <Route
        path="admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUserManagement />} />
        <Route path="plans" element={<AdminMembershipPlans />} />
        <Route path="templates" element={<AdminInvitationTemplates />} />
        <Route path="media" element={<AdminMediaManagement />} />
        <Route path="channel-pools" element={<AdminChannelPools />} />
        <Route path="topup-packs" element={<AdminTopupPacks />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      <Route
        path="portal"
        element={
          <ProtectedRoute>
            <PortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PortalDashboard />} />
        <Route path="guests" element={<GuestsHub />} />
        <Route path="events" element={<EventsList />} />
        <Route path="events/new" element={<EventCreate />} />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="events/:id/edit" element={<EventEdit />} />
        <Route path="events/:id/guests" element={<EventGuests />} />
        <Route path="events/:id/invitations" element={<EventInvitations />} />
        <Route path="events/:id/gallery" element={<EventGallery />} />
        <Route path="events/:id/qr-code" element={<EventQRCode />} />
        <Route path="templates" element={<InvitationTemplates />} />

        {/* Phase 26: organizer-facing usage dashboard + topup pack purchase flow. */}
        <Route path="billing" element={<Billing />} />

        <Route
          path="gallery"
          element={
            <ComingSoon
              title="Gallery"
              description="Open an event and use its Gallery tab to manage photos and videos."
            />
          }
        />
        <Route
          path="settings"
          element={
            <ComingSoon
              title="Settings"
              description="Account and event settings are coming in an upcoming update."
            />
          }
        />
        <Route
          path="notifications"
          element={
            <ComingSoon
              title="Notifications"
              description="Your notifications will show up here once the notifications system is live."
            />
          }
        />
      </Route>

      {nativeApp && <Route path="*" element={<Navigate to={fallbackPath} replace />} />}
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SessionBootstrap />
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;