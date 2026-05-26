import { jsonOk, jsonError } from "@/lib/api";
import { declineCall } from "@/lib/translation/call-service";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const uid = Number(body.uid ?? process.env.TRANSLATE_DEV_UID ?? 1);
    const result = await declineCall(id, uid);
    return jsonOk(result);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to decline call", 500);
  }
}
