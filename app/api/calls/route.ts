import { query } from "@/lib/db";
import { jsonOk, jsonError, getPagination } from "@/lib/api";
import { AUTH_USER_FROM_DISPLAY, AUTH_USER_TO_DISPLAY } from "@/lib/auth-user-sql";
import { initiateCall } from "@/lib/translation/call-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = getPagination(searchParams);
    const status = searchParams.get("status");

    const conditions: string[] = [];
    const params: unknown[] = [];
    if (status) {
      params.push(status);
      conditions.push(`call_status = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM translation_call ${where}`,
      params
    );
    const total = Number(countResult.rows[0]?.count ?? 0);

    params.push(limit, offset);
    const rows = await query(
      `SELECT c.*,
        ${AUTH_USER_FROM_DISPLAY} AS from_display_name,
        ${AUTH_USER_TO_DISPLAY} AS to_display_name
       FROM translation_call c
       LEFT JOIN auth_users fu ON fu.id = c.from_uid
       LEFT JOIN auth_users tu ON tu.id = c.to_uid
       ${where}
       ORDER BY c.call_start_time DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return jsonOk({ calls: rows.rows, page, limit, total });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to list calls", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fromUid = Number(body.from_uid ?? process.env.TRANSLATE_DEV_UID ?? 1);
    const result = await initiateCall({
      from_uid: fromUid,
      to_uid: body.to_uid ? Number(body.to_uid) : undefined,
      from_eid: body.from_eid,
      to_eid: body.to_eid,
      subscription_id: body.subscription_id,
      world_id: body.world_id,
      object_type: body.object_type,
      object_id: body.object_id,
      origin_app: body.origin_app ?? "translate.keyra.ie",
      origin_path: body.origin_path,
      source_language: body.source_language,
      destination_language: body.destination_language,
    });
    return jsonOk(result, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to initiate call";
    const status = msg.includes("Enable Language Translation") ? 403 : 500;
    return jsonError(msg, status);
  }
}
