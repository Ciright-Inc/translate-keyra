import { query } from "@/lib/db";
import type { CallStatus, ObjectType } from "./types";

export interface InitiateCallInput {
  from_uid: number;
  to_uid?: number;
  from_eid?: string;
  to_eid?: string;
  subscription_id?: string;
  world_id?: string;
  object_type?: ObjectType;
  object_id?: string;
  origin_app?: string;
  origin_path?: string;
  source_language?: string;
  destination_language?: string;
}

export async function initiateCall(input: InitiateCallInput) {
  const config = await query<{ config_value: { google_per_minute?: number; aws_per_minute?: number; platform_fee_per_minute?: number } }>(
    `SELECT config_value FROM translation_platform_config WHERE config_key = 'billing' LIMIT 1`
  );
  const rates = config.rows[0]?.config_value ?? {};
  const billingRate =
    (rates.google_per_minute ?? 0.12) +
    (rates.aws_per_minute ?? 0.08) +
    (rates.platform_fee_per_minute ?? 0.05);

  const fromLang = await query<{ primary_language: string; secondary_language: string | null }>(
    `SELECT primary_language, secondary_language FROM translation_user_language_config
     WHERE uid = $1 AND translation_enabled = TRUE LIMIT 1`,
    [input.from_uid]
  );

  if (fromLang.rowCount === 0) {
    throw new Error("Enable Language Translation must be Yes in KEYRA profile before initiating a call");
  }

  const sourceLanguage = input.source_language ?? fromLang.rows[0].primary_language;
  let destLanguage = input.destination_language;
  if (!destLanguage && input.to_uid) {
    const toLang = await query<{ primary_language: string }>(
      `SELECT primary_language FROM translation_user_language_config
       WHERE uid = $1 AND translation_enabled = TRUE LIMIT 1`,
      [input.to_uid]
    );
    destLanguage = toLang.rows[0]?.primary_language ?? fromLang.rows[0].secondary_language ?? "en";
  }

  const result = await query<{ call_id: string }>(
    `INSERT INTO translation_call (
      from_uid, to_uid, from_eid, to_eid, subscription_id, world_id,
      object_type, object_id, origin_app, origin_path, context_sync_path,
      source_language, destination_language, billing_rate, call_status, transport_model
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,$11,$12,$13,'initiated','hybrid')
    RETURNING call_id`,
    [
      input.from_uid,
      input.to_uid ?? null,
      input.from_eid ?? null,
      input.to_eid ?? null,
      input.subscription_id ?? null,
      input.world_id ?? null,
      input.object_type ?? null,
      input.object_id ?? null,
      input.origin_app ?? null,
      input.origin_path ?? null,
      sourceLanguage,
      destLanguage ?? null,
      billingRate,
    ]
  );

  const callId = result.rows[0].call_id;

  await query(
    `INSERT INTO translation_audit_log (call_id, uid, action, details)
     VALUES ($1, $2, 'call_initiated', $3::jsonb)`,
    [callId, input.from_uid, JSON.stringify({ origin_app: input.origin_app, object_type: input.object_type })]
  );

  if (input.to_uid) {
    await query(
      `INSERT INTO translation_call_invite (call_id, target_uid, status, target_app)
       VALUES ($1, $2, 'pending', $3)`,
      [callId, input.to_uid, input.origin_app ?? null]
    );
    await query(
      `UPDATE translation_call SET call_status = 'ringing' WHERE call_id = $1`,
      [callId]
    );
  }

  return { call_id: callId, call_status: input.to_uid ? "ringing" : "initiated" as CallStatus };
}

export async function acceptCall(callId: string, uid: number) {
  const call = await query(
    `SELECT call_id, origin_path, object_type, object_id, from_uid FROM translation_call WHERE call_id = $1`,
    [callId]
  );
  if (call.rowCount === 0) throw new Error("Call not found");

  const receiverLang = await query(
    `SELECT 1 FROM translation_user_language_config
     WHERE uid = $1 AND translation_enabled = TRUE LIMIT 1`,
    [uid]
  );
  if (receiverLang.rowCount === 0) {
    throw new Error("Receiving user must enable Language Translation in KEYRA profile");
  }

  await query(
    `UPDATE translation_call_invite SET status = 'accepted', responded_at = NOW()
     WHERE call_id = $1 AND target_uid = $2`,
    [callId, uid]
  );

  const awsSessionId = `chime-${callId.slice(0, 8)}-${Date.now()}`;
  const googleSessionId = `google-translate-${callId.slice(0, 8)}-${Date.now()}`;

  await query(
    `UPDATE translation_call SET
      call_status = 'active',
      to_uid = COALESCE(to_uid, $2),
      aws_session_id = COALESCE(aws_session_id, $3),
      google_translation_session_id = COALESCE(google_translation_session_id, $4),
      transcript_status = 'streaming'
     WHERE call_id = $1`,
    [callId, uid, awsSessionId, googleSessionId]
  );

  await query(
    `INSERT INTO translation_audit_log (call_id, uid, action, details)
     VALUES ($1, $2, 'call_accepted', $3::jsonb)`,
    [
      callId,
      uid,
      JSON.stringify({
        context_sync_path: call.rows[0].origin_path,
        object_type: call.rows[0].object_type,
        object_id: call.rows[0].object_id,
      }),
    ]
  );

  return {
    call_id: callId,
    call_status: "active" as CallStatus,
    context_sync_path: call.rows[0].origin_path,
    object_type: call.rows[0].object_type,
    object_id: call.rows[0].object_id,
  };
}

export async function endCall(callId: string) {
  const updated = await query<{ duration_seconds: number; from_uid: number; to_uid: number | null; from_eid: string; to_eid: string }>(
    `UPDATE translation_call SET
      call_status = 'completed',
      call_end_time = NOW(),
      duration_seconds = EXTRACT(EPOCH FROM (NOW() - call_start_time))::int,
      transcript_status = 'complete'
     WHERE call_id = $1
     RETURNING duration_seconds, from_uid, to_uid, from_eid, to_eid`,
    [callId]
  );
  if (updated.rowCount === 0) throw new Error("Call not found");

  const row = updated.rows[0];
  const seconds = row.duration_seconds ?? 0;
  const billing = await query<{ config_value: Record<string, number> }>(
    `SELECT config_value FROM translation_platform_config WHERE config_key = 'billing' LIMIT 1`
  );
  const rates = billing.rows[0]?.config_value ?? {};
  const perSecond = ((rates.google_per_minute ?? 0.12) + (rates.aws_per_minute ?? 0.08)) / 60;
  const platformPerSecond = (rates.platform_fee_per_minute ?? 0.05) / 60;
  const googleCost = Number((seconds * perSecond * 0.6).toFixed(4));
  const awsCost = Number((seconds * perSecond * 0.4).toFixed(4));
  const platformFee = Number((seconds * platformPerSecond).toFixed(4));

  await query(
    `UPDATE translation_call SET google_cost = $2, aws_cost = $3, total_cost = $4 WHERE call_id = $1`,
    [callId, googleCost, awsCost, googleCost + awsCost + platformFee * 2]
  );

  const parties: { eid: string; uid: number }[] = [
    { eid: row.from_eid || `UID-${row.from_uid}`, uid: row.from_uid },
  ];
  if (row.to_uid) {
    parties.push({ eid: row.to_eid || `UID-${row.to_uid}`, uid: row.to_uid });
  }

  for (const party of parties) {
    await query(
      `INSERT INTO translation_call_billing (
        call_id, eid, uid, airtime_seconds, google_translation_cost, aws_transport_cost, platform_fee, total_cost, billing_status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')`,
      [
        callId,
        party.eid,
        party.uid,
        seconds,
        googleCost,
        awsCost,
        platformFee,
        googleCost + awsCost + platformFee,
      ]
    );
  }

  return { call_id: callId, duration_seconds: seconds };
}

export async function declineCall(callId: string, uid: number) {
  await query(
    `UPDATE translation_call_invite SET status = 'declined', responded_at = NOW()
     WHERE call_id = $1 AND target_uid = $2`,
    [callId, uid]
  );
  await query(
    `UPDATE translation_call SET call_status = 'declined', call_end_time = NOW() WHERE call_id = $1`,
    [callId]
  );
  await query(
    `INSERT INTO translation_audit_log (call_id, uid, action, details)
     VALUES ($1, $2, 'call_declined', '{}'::jsonb)`,
    [callId, uid]
  );
  return { call_id: callId, call_status: "declined" as CallStatus };
}

export async function appendTranscript(input: {
  call_id: string;
  speaker_uid: number;
  original_language: string;
  translated_language?: string;
  original_text: string;
  translated_text?: string;
  confidence_score?: number;
}) {
  const seq = await query<{ next: number }>(
    `SELECT COALESCE(MAX(sequence_number), 0) + 1 AS next
     FROM translation_call_transcript WHERE call_id = $1`,
    [input.call_id]
  );
  const sequenceNumber = seq.rows[0]?.next ?? 1;

  const inserted = await query(
    `INSERT INTO translation_call_transcript (
      call_id, sequence_number, speaker_uid, original_language, translated_language,
      original_text, translated_text, confidence_score
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING transcript_id, sequence_number, timestamp`,
    [
      input.call_id,
      sequenceNumber,
      input.speaker_uid,
      input.original_language,
      input.translated_language ?? null,
      input.original_text,
      input.translated_text ?? null,
      input.confidence_score ?? null,
    ]
  );

  await query(
    `UPDATE translation_call SET transcript_status = 'streaming' WHERE call_id = $1`,
    [input.call_id]
  );

  return inserted.rows[0];
}

export async function listPendingInvites(targetUid: number) {
  const rows = await query(
    `SELECT i.invite_id, i.call_id, i.status, i.target_app, i.expires_at, i.created_at,
      c.from_uid, c.object_type, c.object_id, c.origin_app, c.origin_path,
      c.source_language, c.destination_language, c.call_status
     FROM translation_call_invite i
     JOIN translation_call c ON c.call_id = i.call_id
     WHERE i.target_uid = $1 AND i.status = 'pending' AND i.expires_at > NOW()
     ORDER BY i.created_at DESC`,
    [targetUid]
  );
  return rows.rows;
}
