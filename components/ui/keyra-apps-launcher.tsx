"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KEYRA_LAUNCHER_FALLBACK, type KeyraLauncherApp } from "@/lib/keyra-apps";

function NineDotTriggerIcon() {
  return (
    <svg
      className="text-[var(--keyra-primary)]"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="5" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="19" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="19" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5" cy="19" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="19" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="19" cy="19" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function AppTileIcon({ label }: { label: string }) {
  return (
    <span className="relative flex size-10 items-center justify-center overflow-hidden rounded-xl border border-black/20 bg-[var(--keyra-surface)] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/keyra-app-mark.png"
        alt=""
        className="absolute inset-0 h-full w-full scale-[1.18] object-contain opacity-35"
        aria-hidden
      />
      <span className="relative rounded-sm bg-white px-0.5 py-0.5 text-[10px] font-semibold leading-none text-[var(--keyra-primary)] shadow-sm ring-1 ring-black/[0.06]">
        {label.slice(0, 2).toUpperCase()}
      </span>
    </span>
  );
}

async function fetchLauncherApps(): Promise<KeyraLauncherApp[]> {
  try {
    const res = await fetch(`/api/apps/launcher?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return KEYRA_LAUNCHER_FALLBACK.apps;

    const data = (await res.json()) as { apps?: KeyraLauncherApp[] };
    if (!Array.isArray(data.apps) || data.apps.length === 0) {
      return KEYRA_LAUNCHER_FALLBACK.apps;
    }

    const translateApp = KEYRA_LAUNCHER_FALLBACK.apps.find((a) => a.id === "translate");
    const hasTranslate = data.apps.some((a) => a.href.includes("translate.keyra.ie"));

    return translateApp && !hasTranslate ? [...data.apps, translateApp] : data.apps;
  } catch {
    return KEYRA_LAUNCHER_FALLBACK.apps;
  }
}

/** Same 9-dot launcher as Get Started (localhost:5173). */
export function KeyraAppsLauncher() {
  const [open, setOpen] = useState(false);
  const [apps, setApps] = useState<KeyraLauncherApp[]>(KEYRA_LAUNCHER_FALLBACK.apps);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tiles = useMemo(() => apps, [apps]);

  const refreshLauncherApps = useCallback(async () => {
    const next = await fetchLauncherApps();
    setApps(next);
  }, []);

  useEffect(() => {
    void refreshLauncherApps();
  }, [refreshLauncherApps]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Keyra apps"
        className={[
          "flex h-10 w-10 items-center justify-center rounded-[var(--keyra-radius-pill)] border border-[var(--keyra-border)] transition-colors duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-black/35",
          "hover:border-black/14 hover:bg-black/[0.04]",
          open ? "border-black/18 bg-black/[0.05]" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={(e) => {
          e.stopPropagation();
          const nextOpen = !open;
          setOpen(nextOpen);
          if (nextOpen) void refreshLauncherApps();
        }}
      >
        <NineDotTriggerIcon />
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Keyra apps"
          className="absolute right-0 top-[calc(100%+8px)] z-[65] flex max-h-[min(34rem,calc(100dvh-6rem))] min-h-0 w-[min(calc(100vw-1.5rem),20rem)] flex-col overflow-hidden rounded-xl border border-black/12 bg-[var(--keyra-bg)] p-3 shadow-[0_24px_64px_rgba(0,0,0,0.14),0_0_0_1px_rgba(0,0,0,0.05)] sm:w-[20rem]"
        >
          <p className="shrink-0 px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--keyra-text-2)]">
            Keyra apps
          </p>
          <div className="keyra-app-launcher-scroll-wrap min-h-0 flex-1 overflow-hidden">
            <ul className="keyra-app-launcher-scroll grid h-full min-h-0 max-h-[min(28rem,calc(100dvh-9rem))] grid-cols-2 gap-2 overflow-y-auto overscroll-y-contain py-0.5 pl-1 pr-1.5 sm:grid-cols-3">
              {tiles.map((item) => (
                <li key={item.id} className="min-w-0">
                  <a
                    role="menuitem"
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${item.label} — ${item.description}`}
                    className="flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-xl border border-transparent px-1 py-2 text-center transition hover:border-black/12 hover:bg-[var(--keyra-surface)] focus:outline-none focus-visible:border-black/30 focus-visible:ring-2 focus-visible:ring-black/20"
                    onClick={() => setOpen(false)}
                  >
                    <AppTileIcon label={item.label} />
                    <span className="line-clamp-2 w-full text-[10px] font-medium leading-tight text-[var(--keyra-primary)]">
                      {item.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
