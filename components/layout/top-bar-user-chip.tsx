"use client";

import { LogOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthSessionUser } from "@/lib/keyra-auth";
import { getAuthUserDisplayLabel, getAuthUserInitials } from "@/lib/keyra-auth";

type TopBarUserChipProps = {
  user: AuthSessionUser | null | undefined;
  onLogout?: () => void | Promise<void>;
  loggingOut?: boolean;
};

export function TopBarUserChip({ user, onLogout, loggingOut = false }: TopBarUserChipProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const userLabel = getAuthUserDisplayLabel(user);
  const initials = getAuthUserInitials(user);
  const isVerified = Boolean(String(user?.phone ?? "").trim());

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeMenu();
    }

    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) closeMenu();
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [menuOpen, closeMenu]);

  async function handleLogout() {
    if (!onLogout || loggingOut) return;
    await onLogout();
    closeMenu();
  }

  return (
    <div className="tr-topbar-user-menu" ref={rootRef}>
      <button
        type="button"
        className={`tr-topbar-user-btn${menuOpen ? " is-open" : ""}`}
        aria-label={`Account for ${userLabel}`}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="tr-topbar-user-avatar" aria-hidden="true">
          <span className="tr-topbar-user-initials">{initials}</span>
          {isVerified ? <span className="tr-topbar-user-status" aria-hidden="true" /> : null}
        </span>
        <span className="tr-topbar-user-name">{userLabel}</span>
      </button>

      {menuOpen && onLogout ? (
        <div className="tr-topbar-user-dropdown" role="menu" aria-label="Account menu">
          <button
            type="button"
            role="menuitem"
            className="tr-topbar-user-dropdown-item"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
          >
            <LogOut size={14} strokeWidth={1.75} aria-hidden="true" />
            <span>{loggingOut ? "Logging out..." : "Logout"}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
