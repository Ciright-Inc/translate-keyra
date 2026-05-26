import { query } from "@/lib/db";
import { jsonOk, jsonError, getPagination } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = getPagination(searchParams);
    const eid = searchParams.get("eid");

    const conditions: string[] = [];
    const params: unknown[] = [];
    if (eid) {
      params.push(eid);
      conditions.push(`b.eid = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const summary = await query(
      `SELECT
        COALESCE(SUM(airtime_seconds), 0)::int AS total_airtime_seconds,
        COALESCE(SUM(total_cost), 0)::numeric AS total_billed,
        COUNT(DISTINCT call_id)::int AS call_count
       FROM translation_call_billing b ${where}`,
      params
    );

    params.push(limit, offset);
    const rows = await query(
      `SELECT b.*, c.source_language, c.destination_language, c.call_start_time
       FROM translation_call_billing b
       JOIN translation_call c ON c.call_id = b.call_id
       ${where}
       ORDER BY b.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return jsonOk({
      summary: summary.rows[0],
      billing: rows.rows,
      page,
      limit,
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load billing", 500);
  }
}
