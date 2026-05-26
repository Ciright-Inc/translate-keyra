import { query } from "@/lib/db";
import { jsonOk, jsonError, getPagination } from "@/lib/api";
import { appendTranscript } from "@/lib/translation/call-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = getPagination(searchParams);
    const q = searchParams.get("q")?.trim();

    let where = "";
    const params: unknown[] = [];
    if (q) {
      params.push(`%${q}%`);
      where = `WHERE t.original_text ILIKE $1 OR t.translated_text ILIKE $1`;
    }

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM translation_call_transcript t ${where}`,
      params
    );
    const total = Number(countResult.rows[0]?.count ?? 0);

    params.push(limit, offset);
    const rows = await query(
      `SELECT t.*, c.object_type, c.object_id, c.call_status
       FROM translation_call_transcript t
       JOIN translation_call c ON c.call_id = t.call_id
       ${where}
       ORDER BY t.timestamp DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return jsonOk({ transcripts: rows.rows, page, limit, total });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to search transcripts", 500);
  }
}

/** Append a live transcript segment during an active call. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.call_id || !body.original_text || !body.speaker_uid) {
      return jsonError("call_id, speaker_uid, and original_text are required", 400);
    }
    const segment = await appendTranscript({
      call_id: body.call_id,
      speaker_uid: Number(body.speaker_uid),
      original_language: body.original_language ?? "en",
      translated_language: body.translated_language,
      original_text: body.original_text,
      translated_text: body.translated_text,
      confidence_score: body.confidence_score ? Number(body.confidence_score) : undefined,
    });
    return jsonOk({ segment }, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to append transcript", 500);
  }
}
