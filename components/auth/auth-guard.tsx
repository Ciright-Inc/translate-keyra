"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { KeyraLogo } from "@/components/brand/keyra-logo";
import {
  AUTH_SESSION_SYNC_MS,
  fetchSharedKeyraSession,
  type AuthSessionUser,
} from "@/lib/keyra-auth";

const DEV_BYPASS = process.env.NEXT_PUBLIC_TRANSLATE_DEV_AUTH_BYPASS === "true";
const HEALTH_TIMEOUT_MS = 12_000;

type AuthStatus = "loading" | "ready" | "error";

type AuthSessionContextValue = {
  hydrated: boolean;
  user: AuthSessionUser | null;
  refreshSession: () => Promise<AuthSessionUser | null>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | undefined>(undefined);

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>(DEV_BYPASS ? "ready" : "loading");
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    if (DEV_BYPASS) {
      setUser(null);
      return null;
    }

    try {
      const session = await fetchSharedKeyraSession();

      if (session.authenticated && session.user) {
        setUser(session.user);
        return session.user;
      }
    } catch {
      // Ignore network errors and send the user through the shared login handoff.
    }

    setUser(null);
    return null;
  }, []);

  const verifySession = useCallback(async () => {
    if (DEV_BYPASS) {
      setStatus("ready");
      setErrorMessage(null);
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    const sessionUser = await refreshSession();
    if (!sessionUser) {
      router.replace("/login");
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

    try {
      const res = await fetch("/api/health", {
        signal: controller.signal,
        cache: "no-store",
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };

      if (res.ok && body.ok) {
        setStatus("ready");
        return;
      }

      const message =
        body.error ||
        (res.status === 503 ? "Database unavailable" : `Health check failed (${res.status})`);
      setErrorMessage(message);
      setStatus("error");
    } catch (error) {
      const message =
        error instanceof Error && error.name === "AbortError"
          ? "Connection timed out. The server cannot reach the database."
          : error instanceof Error
            ? error.message
            : "Network error";
      setErrorMessage(message);
      setStatus("error");
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, [refreshSession, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void verifySession();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [verifySession]);

  useEffect(() => {
    if (DEV_BYPASS) return;

    const refreshOnReturn = () => {
      if (document.visibilityState !== "visible") return;

      void refreshSession().then((sessionUser) => {
        if (!sessionUser) {
          setErrorMessage(null);
          setStatus("loading");
          router.replace("/login");
        }
      });
    };

    window.addEventListener("focus", refreshOnReturn);
    window.addEventListener("pageshow", refreshOnReturn);
    document.addEventListener("visibilitychange", refreshOnReturn);

    return () => {
      window.removeEventListener("focus", refreshOnReturn);
      window.removeEventListener("pageshow", refreshOnReturn);
      document.removeEventListener("visibilitychange", refreshOnReturn);
    };
  }, [refreshSession, router]);

  useEffect(() => {
    if (DEV_BYPASS) return;

    let interval: number | undefined;

    const scheduleSync = () => {
      if (interval) {
        window.clearInterval(interval);
        interval = undefined;
      }

      if (document.visibilityState === "visible") {
        interval = window.setInterval(() => {
          void refreshSession().then((sessionUser) => {
            if (!sessionUser) {
              setErrorMessage(null);
              setStatus("loading");
              router.replace("/login");
            }
          });
        }, AUTH_SESSION_SYNC_MS);
      }
    };

    scheduleSync();
    document.addEventListener("visibilitychange", scheduleSync);

    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
      document.removeEventListener("visibilitychange", scheduleSync);
    };
  }, [refreshSession, router]);

  const value = useMemo(
    () => ({
      hydrated: status !== "loading",
      user,
      refreshSession,
    }),
    [refreshSession, status, user],
  );

  if (status === "ready") {
    return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
  }

  if (status === "error") {
    return (
      <div className="tr-auth-screen">
        <div className="tr-auth-card">
          <KeyraLogo variant="light" className="h-8 mb-2" priority />
          <h1 className="tr-auth-title">Translation admin unavailable</h1>
          <p className="tr-auth-copy">{errorMessage}</p>
          <div className="tr-auth-actions">
            <button type="button" className="tr-btn tr-btn-primary" onClick={() => void verifySession()}>
              Retry
            </button>
            <button
              type="button"
              className="tr-btn tr-btn-secondary"
              onClick={() => router.replace("/login")}
            >
              Go to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tr-auth-screen">
      <div className="tr-auth-card tr-auth-card--loading">
        <KeyraLogo variant="light" className="h-8 mb-2" priority />
        <h1 className="tr-auth-title">Verifying Keyra session</h1>
        <p className="tr-auth-copy">
          Checking your shared Keyra login before opening the translation admin.
        </p>
      </div>
    </div>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("useAuthSession must be used within AuthGuard");
  }

  return context;
}
