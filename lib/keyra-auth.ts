const PROD_AUTH_BACKEND_URL = "https://auth.keyra.ie";
const PROD_GET_STARTED_URL = "https://get-started.keyra.ie";
const LOCAL_AUTH_BACKEND_URL = "http://localhost:4000";
const LOCAL_GET_STARTED_URL = "http://localhost:5173";
const AUTH_PROXY_PATH = "/api/keyra-auth";

function isLoopbackHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1";
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
  process.env.NEXT_PUBLIC_KEYRA_AUTH_BACKEND_URL ||
    process.env.NEXT_PUBLIC_SIMSECURE_AUTH_BACKEND_URL,
  PROD_AUTH_BACKEND_URL,
  LOCAL_AUTH_BACKEND_URL,
);

export const AUTH_BACKEND_TARGET_URL = resolveKeyraServiceUrl(
  process.env.KEYRA_AUTH_BACKEND_URL || process.env.NEXT_PUBLIC_SIMSECURE_AUTH_BACKEND_URL,
  PROD_AUTH_BACKEND_URL,
  LOCAL_AUTH_BACKEND_URL,
);

export const AUTH_BACKEND_PROXY_URL = AUTH_PROXY_PATH;
export const AUTH_SESSION_ENDPOINT = `${AUTH_BACKEND_URL}/auth/session`;
export const AUTH_LOGOUT_ENDPOINT = `${AUTH_BACKEND_URL}/auth/logout`;

export const KEYRA_GET_STARTED_URL = resolveKeyraServiceUrl(
  process.env.NEXT_PUBLIC_KEYRA_GET_STARTED_URL,
  PROD_GET_STARTED_URL,
  LOCAL_GET_STARTED_URL,
);

export const TRANSLATE_AUTH_RETURN_PARAM = "auth_return";
export const AUTH_RETURN_POLL_MS = 30_000;
export const AUTH_RETURN_RETRY_MS = 800;
export const AUTH_SESSION_SYNC_MS = 2_500;
const AUTH_SESSION_TIMEOUT_MS = 12_000;
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

type RawAuthSessionUser = Partial<AuthSessionUser> & {
  phone_e164?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  user_name?: string | null;
  preferred_username?: string | null;
  name?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  given_name?: string | null;
  family_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  profile?: Partial<AuthSessionUser> & {
    phone_e164?: string | null;
    full_name?: string | null;
    display_name?: string | null;
    user_name?: string | null;
    preferred_username?: string | null;
    name?: string | null;
    givenName?: string | null;
    familyName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    given_name?: string | null;
    family_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  };
};

function pickTrimmedValue(...values: Array<string | number | null | undefined>) {
  for (const value of values) {
    const trimmed = String(value ?? "").trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return "";
}

function buildFullName(...parts: Array<string | null | undefined>) {
  const trimmedParts = parts
    .map((part) => String(part ?? "").trim())
    .filter(Boolean);
  return trimmedParts.join(" ");
}

function collectRawAuthSessionUsers(user: RawAuthSessionUser) {
  const sources = [user];

  if (user.profile && typeof user.profile === "object") {
    sources.push(user.profile);
  }

  return sources;
}

export function normalizeAuthSessionUser(user: unknown): AuthSessionUser | null {
  if (!user || typeof user !== "object") {
    return null;
  }

  const raw = user as RawAuthSessionUser;
  const sources = collectRawAuthSessionUsers(raw);
  const id = Number(raw.id);
  const phone = pickTrimmedValue(...sources.flatMap((source) => [source.phone, source.phone_e164]));

  if (!Number.isFinite(id) || !phone) {
    return null;
  }

  const displayName = pickTrimmedValue(
    ...sources.flatMap((source) => [source.displayName, source.display_name, source.name]),
  );
  const fullName = pickTrimmedValue(
    ...sources.flatMap((source) => [
      source.fullName,
      source.full_name,
      buildFullName(source.givenName, source.familyName),
      buildFullName(source.given_name, source.family_name),
      buildFullName(source.firstName, source.lastName),
      buildFullName(source.first_name, source.last_name),
    ]),
  );
  const username = pickTrimmedValue(
    ...sources.flatMap((source) => [source.username, source.user_name, source.preferred_username]),
  );
  const email = pickTrimmedValue(...sources.map((source) => source.email));

  return {
    id,
    phone,
    displayName: displayName || null,
    fullName: fullName || null,
    username: username || null,
    email: email || null,
    profileComplete: typeof raw.profileComplete === "boolean" ? raw.profileComplete : undefined,
  };
}

export function normalizeAuthSessionResponse(payload: unknown): AuthSessionResponse {
  if (!payload || typeof payload !== "object") {
    return { authenticated: false, user: null };
  }

  const raw = payload as { authenticated?: unknown; user?: unknown };
  const user = normalizeAuthSessionUser(raw.user);
  const authenticated = Boolean(raw.authenticated) && Boolean(user);

  return {
    authenticated,
    user: authenticated ? user : null,
  };
}

export function buildTranslateLoginReturnUrl() {
  if (TRANSLATE_LOGIN_RETURN_URL) {
    return TRANSLATE_LOGIN_RETURN_URL;
  }

  if (typeof window === "undefined") {
    return "";
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

  const email = String(user?.email ?? "").trim();
  if (email) return email;

  const phone = String(user?.phone ?? "").trim();
  if (phone) return phone;

  return "Keyra member";
}

export function getAuthUserInitials(user: AuthSessionUser | null | undefined) {
  const label = getAuthUserDisplayLabel(user);
  if (!label || label === "Keyra member") return "K";

  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
  }

  return label.slice(0, 2).toUpperCase();
}

export async function fetchSharedKeyraSession() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), AUTH_SESSION_TIMEOUT_MS);

  try {
    const response = await fetch(AUTH_SESSION_ENDPOINT, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    const json = normalizeAuthSessionResponse((await response.json()) as AuthSessionResponse);
    if (response.ok && json.authenticated && json.user) {
      return json;
    }
  } catch {
    // Let the caller decide whether to retry or redirect.
  } finally {
    window.clearTimeout(timeout);
  }

  return {
    authenticated: false,
    user: null,
  } satisfies AuthSessionResponse;
}

async function waitForSharedKeyraSessionLogout(timeoutMs: number, retryMs = 250) {
  const deadline = Date.now() + timeoutMs;

  do {
    const session = await fetchSharedKeyraSession();
    if (!session.authenticated) {
      return true;
    }

    if (Date.now() >= deadline) {
      break;
    }

    await new Promise((resolve) => window.setTimeout(resolve, retryMs));
  } while (true);

  return false;
}

export async function logoutSharedKeyraSession(timeoutMs = 4000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    await fetch(AUTH_LOGOUT_ENDPOINT, {
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

  return waitForSharedKeyraSessionLogout(Math.max(timeoutMs, 1500));
}
