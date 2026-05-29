import { KEYRA_LAUNCHER_FALLBACK, type KeyraLauncherResponse } from "@/lib/keyra-apps";

const LAUNCHER_URL =
  process.env.KEYRA_LAUNCHER_API_URL ??
  "https://keyra.ie/api/deployments/apps/launcher";

export async function GET() {
  try {
    const res = await fetch(`${LAUNCHER_URL}?t=${Date.now()}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Launcher API ${res.status}`);
    const data = (await res.json()) as KeyraLauncherResponse;
    if (!Array.isArray(data.apps) || data.apps.length === 0) {
      throw new Error("Empty launcher response");
    }
    return Response.json(data);
  } catch {
    return Response.json(KEYRA_LAUNCHER_FALLBACK);
  }
}
