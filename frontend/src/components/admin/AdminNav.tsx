import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Image as ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Mail,
  PackagePlus,
  Radio,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import logo from "@/assets/laverna-logo.png";
import { useAuthStore } from "@/stores/auth.store";
import { useLogoutMutation } from "@/queries/useAuthQueries";
import { cn } from "@/lib/utils";

// Mirrors components/portal/PortalNav.tsx's structure exactly - a single
// source of truth array feeding both the desktop sidebar and the mobile
// bottom bar / "More" sheet, so a new admin destination is added once here.
//
// Phase 26: added "Channel Pools" (platform-wide pool monitoring + topup)
// and "Topup Packs" (admin CRUD on the fixed packs organizers can buy).
const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Users", shortLabel: "Users", icon: Users, end: false },
  { to: "/admin/plans", label: "Plans", shortLabel: "Plans", icon: Wallet, end: false },
  { to: "/admin/templates", label: "Templates", shortLabel: "Templates", icon: Mail, end: false },
  { to: "/admin/media", label: "Media", shortLabel: "Media", icon: ImageIcon, end: false },
  { to: "/admin/channel-pools", label: "Channel Pools", shortLabel: "Pools", icon: Radio, end: false },
  { to: "/admin/topup-packs", label: "Topup Packs", shortLabel: "Topups", icon: PackagePlus, end: false },
  { to: "/admin/reports", label: "Reports", shortLabel: "Reports", icon: ShieldCheck, end: false },
];

const PRIMARY_MOBILE_TABS = ["/admin", "/admin/users"];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
    isActive
      ? "bg-[var(--brand-pink)]/8 text-[var(--brand-pink)] before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-[var(--brand-pink)]"
      : "text-slate-600 hover:bg-slate-100 hover:text-[var(--brand-navy)]"
  );

function AccountBlock({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuthStore();
  const logoutMutation = useLogoutMutation();

  const initial = user?.full_name?.trim()?.[0]?.toUpperCase() ?? "?";

  const handleLogout = () => {
    onNavigate?.();
    logoutMutation.mutate();
  };

  return (
    <>
      <div className="flex items-center gap-3 rounded-xl px-3 py-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-navy)] text-sm font-semibold text-white">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--brand-navy)]">
            {user?.full_name ?? "Admin"}
          </p>
          <p className="truncate text-xs text-slate-400">{user?.mobile_number}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        disabled={logoutMutation.isPending}
        className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
        {logoutMutation.isPending ? "Signing out..." : "Sign out"}
      </button>
    </>
  );
}

export function AdminSidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-100 bg-white">
      <div className="flex h-16 items-center border-b border-slate-100 px-6">
        <Link to="/admin">
          <img src={logo} alt="LavernaEvents" className="h-8 w-auto object-contain" />
        </Link>
        <span className="ml-2 rounded-full bg-[var(--brand-navy)]/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--brand-navy)]">
          Admin
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <AccountBlock />
      </div>
    </aside>
  );
}

export function AdminTopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuthStore();
  const initial = user?.full_name?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <header
      className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-100 bg-white/90 px-4 backdrop-blur-md"
      style={{ paddingTop: "var(--safe-area-inset-top)" }}
    >
      <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2">
        <img src={logo} alt="LavernaEvents" className="h-7 w-auto object-contain" />
        <span className="rounded-full bg-[var(--brand-navy)]/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--brand-navy)]">
          Admin
        </span>
      </Link>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-navy)] text-sm font-semibold text-white"
          aria-label="Account menu"
        >
          {initial}
        </button>

        <AnimatePresence>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-2xl border border-slate-100 bg-white soft-shadow-lg p-1.5"
              >
                <AccountBlock onNavigate={() => setMenuOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

// Mobile: fixed bottom tab bar - Dashboard + Users always visible, "More"
// opens a sheet with the rest.
//
// Phase 26: with 8 total nav items now (was 6), the "More" sheet's grid
// holds 6 secondary items - still fits comfortably in a 3-column grid
// (2 rows of 3), no layout change needed.
export function AdminBottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);

  const secondaryItems = NAV_ITEMS.filter((item) => !PRIMARY_MOBILE_TABS.includes(item.to));

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-slate-100 bg-white/95 px-2 pt-2 backdrop-blur-md"
        style={{ paddingBottom: "calc(0.5rem + var(--safe-area-inset-bottom))" }}
      >
        {NAV_ITEMS.filter((item) => PRIMARY_MOBILE_TABS.includes(item.to)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-xs font-medium transition-all duration-200",
                isActive
                  ? "bg-[var(--brand-pink)]/10 text-[var(--brand-pink)]"
                  : "text-slate-400 hover:text-slate-600"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.shortLabel}
          </NavLink>
        ))}

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-xs font-medium text-slate-400 transition-all duration-200 hover:text-slate-600"
        >
          <LayoutGrid className="h-5 w-5" />
          More
        </button>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-[var(--brand-navy)]/30 backdrop-blur-[2px]"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white p-4"
              style={{ paddingBottom: "calc(1.25rem + var(--safe-area-inset-bottom))" }}
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />

              <div className="flex items-center justify-between px-1">
                <p className="text-sm font-semibold text-[var(--brand-navy)]">More</p>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2.5">
                {secondaryItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex flex-col items-center gap-2 rounded-2xl border p-3.5 text-xs font-semibold transition-colors",
                        isActive
                          ? "border-[var(--brand-pink)]/20 bg-[var(--brand-pink)]/8 text-[var(--brand-pink)]"
                          : "border-slate-100 text-slate-600 hover:bg-slate-50"
                      )
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    {item.shortLabel}
                  </NavLink>
                ))}
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3">
                <AccountBlock onNavigate={() => setMoreOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}