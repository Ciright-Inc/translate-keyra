import { query } from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = Number(searchParams.get("uid") ?? process.env.TRANSLATE_DEV_UID ?? 1);
    const rows = await query(
      `SELECT * FROM translation_user_language_config WHERE uid = $1 ORDER BY updated_at DESC`,
      [uid]
    );
    return jsonOk({ preferences: rows.rows });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load preferences", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const uid = Number(body.uid ?? process.env.TRANSLATE_DEV_UID ?? 1);
    const enabled = Boolean(body.translation_enabled);

    const sub = body.subscription_id ?? "";
    const world = body.world_id ?? "";
    const existing = await query(
      `SELECT id FROM translation_user_language_config
       WHERE uid = $1 AND COALESCE(subscription_id, '') = $2 AND COALESCE(world_id, '') = $3`,
      [uid, sub, world]
    );

    let result;
    if ((existing.rowCount ?? 0) > 0) {
      result = await query(
        `UPDATE translation_user_language_config SET
          eid = $4, translation_enabled = $5, primary_language = $6,
          secondary_language = $7, preferred_voice = $8, speech_rate = $9,
          transcription_enabled = $10, updated_at = NOW()
         WHERE uid = $1 AND COALESCE(subscription_id, '') = $2 AND COALESCE(world_id, '') = $3
         RETURNING *`,
        [
          uid,
          sub,
          world,
          body.eid ?? null,
          enabled,
          body.primary_language ?? "en",
          body.secondary_language ?? null,
          body.preferred_voice ?? "neutral",
          Number(body.speech_rate ?? 1),
          body.transcription_enabled !== false,
        ]
      );
    } else {
      result = await query(
        `INSERT INTO translation_user_language_config (
          uid, eid, subscription_id, world_id, translation_enabled,
          primary_language, secondary_language, preferred_voice, speech_rate, transcription_enabled
        ) VALUES ($1,$2,NULLIF($3,''),NULLIF($4,''),$5,$6,$7,$8,$9,$10)
        RETURNING *`,
        [
          uid,
          body.eid ?? null,
          sub,
          world,
          enabled,
          body.primary_language ?? "en",
          body.secondary_language ?? null,
          body.preferred_voice ?? "neutral",
          Number(body.speech_rate ?? 1),
          body.transcription_enabled !== false,
        ]
      );
    }

    return jsonOk({ preference: result.rows[0] });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to save preferences", 500);
  }
}
