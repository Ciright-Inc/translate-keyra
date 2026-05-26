import { jsonOk, jsonError } from "@/lib/api";
import { acceptCall } from "@/lib/translation/call-service";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const uid = Number(body.uid ?? process.env.TRANSLATE_DEV_UID ?? 1);
    const result = await acceptCall(id, uid);
    return jsonOk(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to accept call";
    const status = msg.includes("enable Language Translation") ? 403 : 500;
    return jsonError(msg, status);
  }
}
