"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyraLogo } from "@/components/brand/keyra-logo";
import {
  AUTH_RETURN_POLL_MS,
  AUTH_RETURN_RETRY_MS,
  AUTH_SESSION_SYNC_MS,
  TRANSLATE_AUTH_RETURN_PARAM,
  buildKeyraGetStartedLoginUrl,
  buildTranslateLoginReturnUrl,
  fetchSharedKeyraSession,
} from "@/lib/keyra-auth";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formMessage, setFormMessage] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const returnUrl = useMemo(() => buildTranslateLoginReturnUrl(), []);
  const isAuthReturn = searchParams.get(TRANSLATE_AUTH_RETURN_PARAM) === "1";

  const loginButtonLabel = isCheckingSession
    ? "Checking session..."
    : isRedirecting
      ? "Opening Keyra login..."
      : "Continue with Keyra phone login";

  useEffect(() => {
    let cancelled = false;

    async function checkExistingSession() {
      const deadline = isAuthReturn ? Date.now() + AUTH_RETURN_POLL_MS : Date.now();

      do {
        const session = await fetchSharedKeyraSession();
        if (session.authenticated) {
          if (!cancelled) {
            router.replace("/admin/dashboard");
          }
          return;
        }

        if (Date.now() >= deadline) {
          break;
        }

        await new Promise((resolve) => window.setTimeout(resolve, AUTH_RETURN_RETRY_MS));
      } while (!cancelled);

      if (!cancelled) {
        if (isAuthReturn) {
          setFormMessage(
            "Keyra sign-in finished, but Translation could not confirm the shared session yet. Try again in a moment or refresh.",
          );
        }
        setIsCheckingSession(false);
        setIsRedirecting(false);
      }
    }

    void checkExistingSession();

    return () => {
      cancelled = true;
    };
  }, [isAuthReturn, router]);

  useEffect(() => {
    const refreshOnReturn = () => {
      if (document.visibilityState !== "visible") return;

      void fetchSharedKeyraSession().then((session) => {
        if (session.authenticated) {
          router.replace("/admin/dashboard");
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
  }, [router]);

  useEffect(() => {
    let interval: number | undefined;

    const scheduleSync = () => {
      if (interval) {
        window.clearInterval(interval);
        interval = undefined;
      }

      if (document.visibilityState === "visible") {
        interval = window.setInterval(() => {
          void fetchSharedKeyraSession().then((session) => {
            if (session.authenticated) {
              router.replace("/admin/dashboard");
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
  }, [router]);

  function handleContinueToKeyra() {
    if (!returnUrl) {
      setFormMessage("Unable to determine the return URL for Keyra sign-in.");
      return;
    }

    setFormMessage("");
    setIsRedirecting(true);
    window.location.assign(buildKeyraGetStartedLoginUrl(returnUrl));
  }

  return (
    <div className="tr-auth-screen">
      <div className="tr-login-shell">
        <section className="tr-login-panel tr-login-panel-dark">
          <div>
            <KeyraLogo variant="dark" className="h-10 mb-4" priority />
            <h1 className="tr-login-title">Secure access for real-time translation operations.</h1>
            <p className="tr-login-copy tr-login-copy-dark">
              Sign in through Keyra Get Started, return with the same shared Keyra
              session, and continue into the translation admin without a separate login.
            </p>
          </div>

          <div className="tr-login-security">
            <p className="tr-login-security-label">Session security</p>
            <div className="tr-login-security-list">
              {[
                "Phone verification",
                "Shared Keyra session",
                "Protected admin return",
              ].map((item) => (
                <div key={item} className="tr-login-security-item">
                  <span>{item}</span>
                  <span className="tr-login-security-dot" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="tr-login-panel tr-login-panel-light">
          <div className="tr-login-content">
            <div>
              <p className="tr-kicker">Keyra Sign In</p>
              <h2 className="tr-auth-title">Continue securely</h2>
              <p className="tr-auth-copy">
                Use your verified phone on Keyra Get Started. Once the shared session
                is confirmed, this app will bring you straight to the translation dashboard.
              </p>
            </div>

            <div className="tr-login-stack">
              {formMessage ? <div className="tr-auth-alert">{formMessage}</div> : null}

              <div className="tr-login-note">
                <strong>Shared Keyra session</strong>
                <p>
                  Verify your phone once on Get Started, then return here already signed
                  in with the same Keyra identity used across all Keyra sites.
                </p>
              </div>

              <button
                type="button"
                className="tr-btn tr-btn-primary tr-login-button"
                disabled={isCheckingSession || isRedirecting}
                onClick={handleContinueToKeyra}
              >
                {loginButtonLabel}
              </button>
            </div>

            <p className="tr-login-footnote">
              Protected by shared Keyra phone verification and session cookies across
              Keyra sites.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function LoginPageFallback() {
  return (
    <div className="tr-auth-screen">
      <div className="tr-login-shell">
        <section className="tr-login-panel tr-login-panel-dark">
          <div>
            <KeyraLogo variant="dark" className="h-10 mb-4" priority />
            <h1 className="tr-login-title">Secure access for real-time translation operations.</h1>
            <p className="tr-login-copy tr-login-copy-dark">
              Sign in through Keyra Get Started, return with the same shared Keyra
              session, and continue into the translation admin without a separate login.
            </p>
          </div>
        </section>

        <section className="tr-login-panel tr-login-panel-light">
          <div className="tr-login-content">
            <div>
              <p className="tr-kicker">Keyra Sign In</p>
              <h2 className="tr-auth-title">Continue securely</h2>
              <p className="tr-auth-copy">
                Use your verified phone on Keyra Get Started. Once the shared session
                is confirmed, this app will bring you straight to the translation dashboard.
              </p>
            </div>

            <div className="tr-login-stack">
              <div className="tr-login-note">
                <strong>Shared Keyra session</strong>
                <p>
                  Verify your phone once on Get Started, then return here already signed
                  in with the same Keyra identity.
                </p>
              </div>

              <button type="button" className="tr-btn tr-btn-primary tr-login-button" disabled>
                Checking session...
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
