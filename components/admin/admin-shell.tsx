"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { KeyraLogo } from "@/components/brand/keyra-logo";
import {
  LayoutDashboard,
  Phone,
  BarChart3,
  Settings,
  FileSearch,
  CreditCard,
  Menu,
  X,
  Loader2,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthSession } from "@/components/auth/auth-guard";
import { getAuthUserDisplayLabel, logoutSharedKeyraSession } from "@/lib/keyra-auth";

const MOBILE_QUERY = "(max-width: 900px)";

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/calls", label: "Calls", icon: Phone },
  { href: "/admin/transcripts", label: "Transcripts", icon: FileSearch },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/billing", label: "Billing", icon: CreditCard },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const previousPathname = useRef(pathname);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const sync = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      closeSidebar();
      previousPathname.current = pathname;
    }
  }, [pathname, sidebarOpen, closeSidebar]);

  useEffect(() => {
    if (!isMobile || !sidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSidebar();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isMobile, sidebarOpen, closeSidebar]);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    [
      "token",
      "userToken",
      "employeeDetails",
      "employees",
      "mfa",
      "appSessionLogId",
    ].forEach((key) => localStorage.removeItem(key));

    await logoutSharedKeyraSession();

    toast.success("Logged out successfully");
    router.replace("/login");
    router.refresh();
    setLoggingOut(false);
  }

  const userLabel = getAuthUserDisplayLabel(user);
  const userSubtitle = user?.phone ? "Verified phone access" : "Shared Keyra session";

  return (
    <div
      className={`tr-admin-layout${sidebarOpen ? " tr-admin-layout--menu-open" : ""}`}
    >
      <button
        type="button"
        className={`tr-sidebar-overlay${sidebarOpen ? " is-visible" : ""}`}
        aria-label="Close menu"
        onClick={closeSidebar}
        tabIndex={sidebarOpen ? 0 : -1}
      />

      <aside
        className={`tr-sidebar${sidebarOpen ? " is-open" : ""}`}
        aria-label="Admin navigation"
      >
        <div className="tr-sidebar-header">
          <Link href="/admin/dashboard" className="tr-sidebar-brand" onClick={closeSidebar}>
            <KeyraLogo variant="dark" className="h-7" priority />
          </Link>
          <button
            type="button"
            className="tr-sidebar-close"
            aria-label="Close menu"
            onClick={closeSidebar}
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        <nav className="tr-sidebar-nav">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`tr-nav-item${active ? " is-active" : ""}`}
                onClick={closeSidebar}
              >
                <item.icon size={18} strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="tr-sidebar-footer">
          <Link href="/" className="tr-nav-item" onClick={closeSidebar}>
            ← Landing page
          </Link>
        </div>
      </aside>

      <div className="tr-main">
        <header className="tr-topbar">
          <div className="tr-topbar-start">
            <button
              type="button"
              className="tr-menu-toggle"
              aria-label="Open menu"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} strokeWidth={1.75} />
            </button>
            <span className="tr-topbar-title">Global Translation Administration Center</span>
          </div>
          <div className="tr-topbar-end">
            <span className="tr-kicker tr-topbar-kicker">Ciright Core · keyra-auth</span>
            <div className="tr-topbar-user">
              <div className="tr-topbar-user-copy">
                <span className="tr-topbar-user-name">{userLabel}</span>
                <span className="tr-topbar-user-meta">{userSubtitle}</span>
              </div>
              <button
                type="button"
                className="tr-btn tr-btn-secondary tr-topbar-logout"
                onClick={() => void handleLogout()}
                disabled={loggingOut}
                aria-label="Logout"
              >
                {loggingOut ? (
                  <Loader2 size={16} strokeWidth={1.75} className="tr-spin" />
                ) : (
                  <LogOut size={16} strokeWidth={1.75} />
                )}
                <span>{loggingOut ? "Logging out..." : "Logout"}</span>
              </button>
            </div>
          </div>
        </header>
        <main className="tr-content">{children}</main>
      </div>
    </div>
  );
}
