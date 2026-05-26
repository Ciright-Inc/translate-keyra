import { jsonOk, jsonError } from "@/lib/api";
import { listPendingInvites } from "@/lib/translation/call-service";

/** Pending Translation Call invites for cross-app presence (poll from KEYRA apps). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = Number(searchParams.get("uid") ?? process.env.TRANSLATE_DEV_UID ?? 1);
    const invites = await listPendingInvites(uid);
    return jsonOk({ invites });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load invites", 500);
  }
}
