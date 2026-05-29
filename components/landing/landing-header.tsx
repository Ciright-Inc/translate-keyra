"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { KeyraLogo } from "@/components/brand/keyra-logo";
import { KeyraAppsLauncher } from "@/components/ui/keyra-apps-launcher";
import { TopBarUserChip } from "@/components/layout/top-bar-user-chip";
import {
  AUTH_BACKEND_URL,
  logoutSharedKeyraSession,
  type AuthSessionResponse,
  type AuthSessionUser,
} from "@/lib/keyra-auth";

const navLinks = [
  { href: "#features", label: "Capabilities" },
  { href: "#architecture", label: "Architecture" },
  { href: "/admin/dashboard", label: "Admin Portal" },
] as const;

export function LandingHeader() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<AuthSessionUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    document.body.classList.toggle("tr-landing-menu-open", menuOpen);
    return () => document.body.classList.remove("tr-landing-menu-open");
  }, [menuOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeMenu]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 901px)");
    const onChange = () => {
      if (mq.matches) closeMenu();
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [closeMenu]);

  useEffect(() => {
    let cancelled = false;

    async function refreshSession() {
      try {
        const response = await fetch(`${AUTH_BACKEND_URL}/auth/session`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        const json = (await response.json()) as AuthSessionResponse;
        if (!cancelled) {
          setSessionUser(response.ok && json.authenticated ? json.user : null);
        }
      } catch {
        if (!cancelled) {
          setSessionUser(null);
        }
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshSession();
      }
    };

    void refreshSession();
    window.addEventListener("focus", refreshSession);
    window.addEventListener("pageshow", refreshSession);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshSession);
      window.removeEventListener("pageshow", refreshSession);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setSessionUser(null);
    [
      "token",
      "userToken",
      "employeeDetails",
      "employees",
      "mfa",
      "appSessionLogId",
    ].forEach((key) => localStorage.removeItem(key));

    await logoutSharedKeyraSession();

    try {
      const response = await fetch(`${AUTH_BACKEND_URL}/auth/session`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const json = (await response.json()) as AuthSessionResponse;
      setSessionUser(response.ok && json.authenticated ? json.user : null);
    } catch {
      setSessionUser(null);
    }

    setLoggingOut(false);
    closeMenu();
    router.refresh();
  }

  return (
    <header className="tr-landing-header">
      <div className="tr-container tr-nav">
        <Link href="/" className="tr-nav-brand" onClick={closeMenu}>
          <KeyraLogo variant="light" className="h-7" priority />
        </Link>

        <div className="tr-nav-actions">
          <nav
            id="landing-nav"
            className={`tr-nav-links${menuOpen ? " is-open" : ""}`}
          >
            {navLinks.map((link) =>
              link.href.startsWith("/") ? (
                <Link key={link.href} href={link.href} onClick={closeMenu}>
                  {link.label}
                </Link>
              ) : (
                <a key={link.href} href={link.href} onClick={closeMenu}>
                  {link.label}
                </a>
              ),
            )}
            {!sessionUser ? (
              <Link
                href="/login"
                className="tr-btn tr-btn-primary tr-nav-cta !text-white"
                onClick={closeMenu}
              >
                Get Started
              </Link>
            ) : null}
          </nav>

          {sessionUser ? (
            <div className="tr-nav-user-chip">
              <TopBarUserChip
                user={sessionUser}
                onLogout={handleLogout}
                loggingOut={loggingOut}
              />
            </div>
          ) : null}

          <KeyraAppsLauncher />

          <button
            type="button"
            className="tr-landing-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="landing-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <button
          type="button"
          className={`tr-landing-overlay${menuOpen ? " is-visible" : ""}`}
          aria-hidden={!menuOpen}
          tabIndex={menuOpen ? 0 : -1}
          onClick={closeMenu}
        />
      </div>
    </header>
  );
}
