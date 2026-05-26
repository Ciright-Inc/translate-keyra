import { query } from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api";
import { AUTH_USER_FROM_DISPLAY, AUTH_USER_TO_DISPLAY } from "@/lib/auth-user-sql";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const call = await query(
      `SELECT c.*,
        ${AUTH_USER_FROM_DISPLAY} AS from_display_name, fu.email AS from_email,
        ${AUTH_USER_TO_DISPLAY} AS to_display_name, tu.email AS to_email
       FROM translation_call c
       LEFT JOIN auth_users fu ON fu.id = c.from_uid
       LEFT JOIN auth_users tu ON tu.id = c.to_uid
       WHERE c.call_id = $1`,
      [id]
    );
    if (call.rowCount === 0) return jsonError("Call not found", 404);

    const transcripts = await query(
      `SELECT * FROM translation_call_transcript WHERE call_id = $1 ORDER BY sequence_number`,
      [id]
    );
    const billing = await query(
      `SELECT * FROM translation_call_billing WHERE call_id = $1`,
      [id]
    );

    return jsonOk({
      call: call.rows[0],
      transcripts: transcripts.rows,
      billing: billing.rows,
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to fetch call", 500);
  }
}
