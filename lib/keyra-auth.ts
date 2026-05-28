const PROD_AUTH_BACKEND_URL = "https://auth.keyra.ie";
const PROD_GET_STARTED_URL = "https://get-started.keyra.ie";
const PROD_TRANSLATE_APP_URL = "https://translate-keyra-production.up.railway.app";
const LOCAL_AUTH_BACKEND_URL = "http://localhost:4000";
const LOCAL_GET_STARTED_URL = "http://localhost:5173";

function isLoopbackHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1";
}

function isLoopbackUrl(value: string) {
  try {
    return isLoopbackHostname(new URL(value).hostname);
  } catch {
    return false;
  }
}

function shouldUseLocalKeyraDefaults() {
  if (typeof window !== "undefined") {
    return isLoopbackHostname(window.location.hostname);
  }

  return process.env.NODE_ENV !== "production";
}

function resolveKeyraServiceUrl(
  envValue: string | undefined,
  productionUrl: string,
  localUrl: string,
) {
  const trimmed = String(envValue ?? "").trim();
  if (trimmed) {
    return trimmed;
  }

  return shouldUseLocalKeyraDefaults() ? localUrl : productionUrl;
}

export const AUTH_BACKEND_URL = resolveKeyraServiceUrl(
  process.env.NEXT_PUBLIC_SIMSECURE_AUTH_BACKEND_URL,
  PROD_AUTH_BACKEND_URL,
  LOCAL_AUTH_BACKEND_URL,
);

export const KEYRA_GET_STARTED_URL = resolveKeyraServiceUrl(
  process.env.NEXT_PUBLIC_KEYRA_GET_STARTED_URL,
  PROD_GET_STARTED_URL,
  LOCAL_GET_STARTED_URL,
);

export const TRANSLATE_AUTH_RETURN_PARAM = "auth_return";
export const AUTH_RETURN_POLL_MS = 30_000;
export const AUTH_RETURN_RETRY_MS = 800;
export const AUTH_SESSION_SYNC_MS = 2_500;

const TRANSLATE_LOGIN_RETURN_URL = process.env.NEXT_PUBLIC_TRANSLATE_LOGIN_RETURN_URL || "";
const TRANSLATE_POST_AUTH_PATH =
  process.env.NEXT_PUBLIC_TRANSLATE_LOGIN_POST_AUTH_PATH ||
  `/login?${TRANSLATE_AUTH_RETURN_PARAM}=1`;

export type AuthSessionUser = {
  id: number;
  phone: string;
  email?: string | null;
  fullName?: string | null;
  username?: string | null;
  displayName?: string | null;
  profileComplete?: boolean;
};

export type AuthSessionResponse = {
  authenticated: boolean;
  user: AuthSessionUser | null;
};

export function buildTranslateLoginReturnUrl() {
  if (TRANSLATE_LOGIN_RETURN_URL) {
    return TRANSLATE_LOGIN_RETURN_URL;
  }

  if (typeof window === "undefined") {
    return "";
  }

  // When both apps are local, keep the whole flow local-to-local.
  // If Get Started is remote, fall back to the deployed Translation callback URL.
  if (isLoopbackHostname(window.location.hostname)) {
    if (isLoopbackUrl(KEYRA_GET_STARTED_URL)) {
      return new URL(TRANSLATE_POST_AUTH_PATH, window.location.origin).toString();
    }

    return new URL(TRANSLATE_POST_AUTH_PATH, PROD_TRANSLATE_APP_URL).toString();
  }

  return new URL(TRANSLATE_POST_AUTH_PATH, window.location.origin).toString();
}

export function buildKeyraGetStartedLoginUrl(returnTo?: string) {
  const url = new URL(KEYRA_GET_STARTED_URL);

  if (returnTo) {
    url.searchParams.set("return", returnTo);
  }

  return url.toString();
}

export function getAuthUserDisplayLabel(user: AuthSessionUser | null | undefined) {
  const displayName = String(user?.displayName ?? "").trim();
  if (displayName) return displayName;

  const fullName = String(user?.fullName ?? "").trim();
  if (fullName) return fullName;

  const username = String(user?.username ?? "").trim();
  if (username) return username;

  return "Keyra member";
}

export async function logoutSharedKeyraSession(timeoutMs = 2000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    await fetch(`${AUTH_BACKEND_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
      keepalive: true,
      signal: controller.signal,
    });
  } catch {
    // Best effort only. Local navigation should not be blocked by a slow auth backend.
  } finally {
    window.clearTimeout(timer);
  }
}
