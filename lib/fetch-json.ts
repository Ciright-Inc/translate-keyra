export async function fetchJson<T = unknown>(
  url: string,
  init?: RequestInit,
  timeoutMs = 12_000
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const body = await res.json();
    if (!res.ok || body?.ok === false) {
      return { ok: false, error: body?.error ?? `HTTP ${res.status}` };
    }
    return { ok: true, data: body.data as T };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return {
        ok: false,
        error: "Request timed out — check DATABASE_URL and that Postgres is reachable",
      };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Request failed" };
  } finally {
    clearTimeout(timer);
  }
}
