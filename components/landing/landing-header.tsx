"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const navLinks = [
  { href: "#features", label: "Capabilities" },
  { href: "#architecture", label: "Architecture" },
  { href: "/admin/dashboard", label: "Admin Portal" },
] as const;

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
    <header className="tr-landing-header">
      <div className="tr-container tr-nav">
        <Link href="/" className="tr-nav-brand" onClick={closeMenu}>
          translate.keyra.ie
        </Link>

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

        <button
          type="button"
          className={`tr-landing-overlay${menuOpen ? " is-visible" : ""}`}
          aria-hidden={!menuOpen}
          tabIndex={menuOpen ? 0 : -1}
          onClick={closeMenu}
        />

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
          <Link
            href="/admin/settings"
            className="tr-btn tr-btn-primary tr-nav-cta !text-white"
            onClick={closeMenu}
          >
            Configure Languages
          </Link>
        </nav>
      </div>
    </header>
  );
}
