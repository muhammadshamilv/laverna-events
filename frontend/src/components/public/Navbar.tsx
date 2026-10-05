import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, X } from "lucide-react";
import logo from "@/assets/laverna-logo.png";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth.store";
import { useLogoutMutation } from "@/queries/useAuthQueries";
import { usePortalAccess } from "@/queries/useMembershipQueries";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/features", label: "Features" },
  { to: "/pricing", label: "Pricing" },
  { to: "/gallery", label: "Gallery" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

// A logged-in user stays on the public site until they choose to enter
// the portal - "Open portal" is a deliberate click, never an automatic
// redirect. Where that click actually goes depends on portal access:
// not yet subscribed -> /pricing to complete purchase first; fully
// onboarded -> straight into /portal. usePortalAccess is the same single
// source of truth PortalLayout's own gate uses, so this never drifts
// out of sync with what actually happens once you land there.
function usePortalDestination(): string {
  const { data: access } = usePortalAccess();
  return access?.can_access_portal ? "/portal" : "/pricing";
}

function AccountMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuthStore();
  const logoutMutation = useLogoutMutation();
  const navigate = useNavigate();
  const portalDestination = usePortalDestination();

  const initial = user?.full_name?.trim()?.[0]?.toUpperCase() ?? "?";

  const handleLogout = async () => {
    onNavigate?.();
    await logoutMutation.mutateAsync();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        to={portalDestination}
        onClick={onNavigate}
        className={buttonVariants({ variant: "primary", size: "sm" })}
      >
        Open portal
      </Link>

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-navy)] text-sm font-semibold text-white">
        {initial}
      </div>

      <button
        type="button"
        onClick={handleLogout}
        disabled={logoutMutation.isPending}
        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

function MobileAccountMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuthStore();
  const logoutMutation = useLogoutMutation();
  const navigate = useNavigate();
  const portalDestination = usePortalDestination();

  const initial = user?.full_name?.trim()?.[0]?.toUpperCase() ?? "?";

  const handleLogout = async () => {
    onNavigate?.();
    await logoutMutation.mutateAsync();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 rounded-xl px-3 py-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-navy)] text-sm font-semibold text-white">
          {initial}
        </div>
        <p className="truncate text-sm font-medium text-[var(--brand-navy)]">
          {user?.full_name ?? "Account"}
        </p>
      </div>

      <Link
        to={portalDestination}
        onClick={onNavigate}
        className={buttonVariants({ variant: "primary", className: "w-full" })}
      >
        Open portal
      </Link>

      <button
        type="button"
        onClick={handleLogout}
        disabled={logoutMutation.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
        {logoutMutation.isPending ? "Signing out..." : "Sign out"}
      </button>
    </div>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isChecking } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
          <img src={logo} alt="LavernaEvents" className="h-9 w-auto object-contain" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-[var(--brand-navy)]",
                  isActive && "bg-slate-100 text-[var(--brand-navy)]"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isChecking ? (
            <>
              <Skeleton className="h-9 w-16 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </>
          ) : user ? (
            <AccountMenu />
          ) : (
            <>
              <Link to="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Login
              </Link>
              <Link to="/register" className={buttonVariants({ variant: "primary", size: "sm" })}>
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--brand-navy)] md:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-100 bg-white md:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-4">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100",
                      isActive && "bg-slate-100 text-[var(--brand-navy)]"
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-4">
                {isChecking ? (
                  <>
                    <Skeleton className="h-10 w-full rounded-full" />
                    <Skeleton className="h-10 w-full rounded-full" />
                  </>
                ) : user ? (
                  <MobileAccountMenu onNavigate={() => setMenuOpen(false)} />
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className={buttonVariants({ variant: "outline", className: "w-full" })}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className={buttonVariants({ variant: "primary", className: "w-full" })}
                    >
                      Get started
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}