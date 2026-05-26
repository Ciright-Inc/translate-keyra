import { query } from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api";
import { AUTH_USER_FROM_DISPLAY, AUTH_USER_TO_DISPLAY, AUTH_USER_U_DISPLAY } from "@/lib/auth-user-sql";

export async function GET() {
  try {
    const overview = await query(`
      SELECT
        COALESCE(SUM(duration_seconds) FILTER (WHERE call_status = 'completed'), 0)::int / 60 AS translated_minutes,
        COUNT(*) FILTER (WHERE call_status = 'active')::int AS active_calls,
        COUNT(*)::int AS total_calls,
        COUNT(DISTINCT source_language)::int AS languages_used,
        COALESCE(AVG(
          (SELECT AVG(confidence_score) FROM translation_call_transcript t WHERE t.call_id = c.call_id)
        ), 0)::numeric(5,4) AS avg_confidence
      FROM translation_call c
    `);

    const byLanguage = await query(`
      SELECT source_language AS language, COUNT(*)::int AS calls,
        COALESCE(SUM(duration_seconds), 0)::int / 60 AS minutes
      FROM translation_call
      WHERE source_language IS NOT NULL
      GROUP BY source_language
      ORDER BY calls DESC
      LIMIT 10
    `);

    const costByLanguage = await query(`
      SELECT source_language AS language,
        COALESCE(SUM(total_cost), 0)::numeric(10,2) AS total_cost
      FROM translation_call
      WHERE source_language IS NOT NULL
      GROUP BY source_language
      ORDER BY total_cost DESC
    `);

    const topUsers = await query(`
      SELECT ${AUTH_USER_U_DISPLAY} AS display_name, u.email, COUNT(c.call_id)::int AS call_count,
        COALESCE(SUM(c.duration_seconds), 0)::int / 60 AS minutes
      FROM translation_call c
      JOIN auth_users u ON u.id = c.from_uid
      GROUP BY u.id, u.full_name, u.email, u.phone
      ORDER BY call_count DESC
      LIMIT 8
    `);

    const usageTrend = await query(`
      SELECT DATE(call_start_time) AS day, COUNT(*)::int AS calls,
        COALESCE(SUM(duration_seconds), 0)::int / 60 AS minutes
      FROM translation_call
      WHERE call_start_time >= NOW() - INTERVAL '14 days'
      GROUP BY DATE(call_start_time)
      ORDER BY day
    `);

    const activeCalls = await query(`
      SELECT c.call_id, c.source_language, c.destination_language, c.origin_app,
        c.object_type, c.object_id, c.call_start_time,
        ${AUTH_USER_FROM_DISPLAY} AS from_name, ${AUTH_USER_TO_DISPLAY} AS to_name
      FROM translation_call c
      LEFT JOIN auth_users fu ON fu.id = c.from_uid
      LEFT JOIN auth_users tu ON tu.id = c.to_uid
      WHERE c.call_status IN ('initiated', 'ringing', 'active')
      ORDER BY c.call_start_time DESC
    `);

    return jsonOk({
      overview: overview.rows[0],
      byLanguage: byLanguage.rows,
      costByLanguage: costByLanguage.rows,
      topUsers: topUsers.rows,
      usageTrend: usageTrend.rows,
      activeCalls: activeCalls.rows,
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load analytics", 500);
  }
}
