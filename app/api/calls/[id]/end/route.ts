import { jsonOk, jsonError } from "@/lib/api";
import { endCall } from "@/lib/translation/call-service";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const result = await endCall(id);
    return jsonOk(result);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to end call", 500);
  }
}
