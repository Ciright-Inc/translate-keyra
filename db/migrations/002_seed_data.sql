-- Demo data for translate.keyra.ie admin dashboards
-- migrate:skip-if-populated translation_call

INSERT INTO translation_user_language_config (
  uid, eid, subscription_id, world_id, translation_enabled,
  primary_language, secondary_language, preferred_voice, speech_rate, transcription_enabled
)
SELECT u.id, 'EID-DEMO-001', 'SUB-KEYRA-IE', 'WORLD-IE-01', TRUE,
  'en', 'ga', 'en-GB-Neural2-A', 1.0, TRUE
FROM (SELECT id FROM auth_users ORDER BY id LIMIT 1) u
WHERE NOT EXISTS (SELECT 1 FROM translation_user_language_config LIMIT 1);

INSERT INTO translation_user_language_config (
  uid, eid, subscription_id, world_id, translation_enabled,
  primary_language, secondary_language, preferred_voice, speech_rate, transcription_enabled
)
SELECT u.id, 'EID-DEMO-002', 'SUB-KEYRA-ES', 'WORLD-ES-01', TRUE,
  'es', 'en', 'es-ES-Neural2-A', 1.05, TRUE
FROM (SELECT id FROM auth_users ORDER BY id OFFSET 1 LIMIT 1) u
WHERE EXISTS (SELECT 1 FROM auth_users OFFSET 1 LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM translation_user_language_config WHERE eid = 'EID-DEMO-002');

-- Sample completed call
INSERT INTO translation_call (
  call_id, subscription_id, world_id, from_uid, to_uid, from_eid, to_eid,
  object_type, object_id, origin_app, origin_path, context_sync_path,
  call_start_time, call_end_time, duration_seconds,
  source_language, destination_language, transport_model,
  aws_session_id, google_translation_session_id,
  billing_rate, google_cost, aws_cost, total_cost,
  call_status, transcript_status, recording_status
)
SELECT
  'a1000001-0000-4000-8000-000000000001'::uuid,
  'SUB-KEYRA-IE', 'WORLD-IE-01',
  (SELECT id FROM auth_users ORDER BY id LIMIT 1),
  COALESCE((SELECT id FROM auth_users ORDER BY id OFFSET 1 LIMIT 1), (SELECT id FROM auth_users ORDER BY id LIMIT 1)),
  'EID-DEMO-001', 'EID-DEMO-002',
  'prompt', 'prompt-8842', 'prompt.ciright.com', '/edit_prompt/prompt-8842', '/edit_prompt/prompt-8842',
  NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hours 42 minutes', 1080,
  'en', 'es', 'hybrid',
  'chime-session-demo-001', 'google-translate-demo-001',
  0.25, 2.16, 1.44, 4.85,
  'completed', 'complete', 'indexed'
WHERE NOT EXISTS (SELECT 1 FROM translation_call WHERE call_id = 'a1000001-0000-4000-8000-000000000001'::uuid);

INSERT INTO translation_call_transcript (call_id, sequence_number, speaker_uid, original_language, translated_language, original_text, translated_text, timestamp, confidence_score)
SELECT
  'a1000001-0000-4000-8000-000000000001'::uuid, 1,
  (SELECT id FROM auth_users ORDER BY id LIMIT 1),
  'en', 'es',
  'We need to finalize the enterprise proposal before Friday.',
  'Necesitamos finalizar la propuesta empresarial antes del viernes.',
  NOW() - INTERVAL '2 hours', 0.94
WHERE NOT EXISTS (
  SELECT 1 FROM translation_call_transcript
  WHERE call_id = 'a1000001-0000-4000-8000-000000000001'::uuid AND sequence_number = 1
);

INSERT INTO translation_call_transcript (call_id, sequence_number, speaker_uid, original_language, translated_language, original_text, translated_text, timestamp, confidence_score)
SELECT
  'a1000001-0000-4000-8000-000000000001'::uuid, 2,
  (SELECT id FROM auth_users ORDER BY id OFFSET 1 LIMIT 1),
  'es', 'en',
  'De acuerdo, revisaré el contrato y actualizaré el flujo de trabajo.',
  'Agreed, I will review the contract and update the workflow.',
  NOW() - INTERVAL '1 hours 55 minutes', 0.91
WHERE NOT EXISTS (
  SELECT 1 FROM translation_call_transcript
  WHERE call_id = 'a1000001-0000-4000-8000-000000000001'::uuid AND sequence_number = 2
);

INSERT INTO translation_call_billing (call_id, eid, uid, subscription_id, airtime_seconds, google_translation_cost, aws_transport_cost, platform_fee, total_cost, billing_status)
SELECT
  'a1000001-0000-4000-8000-000000000001'::uuid, 'EID-DEMO-001',
  (SELECT id FROM auth_users ORDER BY id LIMIT 1),
  'SUB-KEYRA-IE', 1080, 1.08, 0.72, 0.90, 2.70, 'invoiced'
WHERE NOT EXISTS (
  SELECT 1 FROM translation_call_billing WHERE call_id = 'a1000001-0000-4000-8000-000000000001'::uuid AND eid = 'EID-DEMO-001'
);

INSERT INTO translation_call_billing (call_id, eid, uid, subscription_id, airtime_seconds, google_translation_cost, aws_transport_cost, platform_fee, total_cost, billing_status)
SELECT
  'a1000001-0000-4000-8000-000000000001'::uuid, 'EID-DEMO-002',
  (SELECT id FROM auth_users ORDER BY id OFFSET 1 LIMIT 1),
  'SUB-KEYRA-ES', 1080, 1.08, 0.72, 0.95, 2.75, 'invoiced'
WHERE NOT EXISTS (
  SELECT 1 FROM translation_call_billing WHERE call_id = 'a1000001-0000-4000-8000-000000000001'::uuid AND eid = 'EID-DEMO-002'
);

-- Active call for live dashboard
INSERT INTO translation_call (
  call_id, subscription_id, world_id, from_uid, to_uid, from_eid, to_eid,
  object_type, object_id, origin_app, origin_path,
  source_language, destination_language, transport_model,
  call_status, transcript_status
)
SELECT
  'b2000002-0000-4000-8000-000000000002'::uuid,
  'SUB-KEYRA-FR', 'WORLD-FR-01',
  (SELECT id FROM auth_users ORDER BY id OFFSET 1 LIMIT 1),
  (SELECT id FROM auth_users ORDER BY id LIMIT 1),
  'EID-DEMO-002', 'EID-DEMO-001',
  'task', 'task-5521', 'tasks.keyra.ie', '/tasks/task-5521',
  'es', 'en', 'hybrid',
  'active', 'streaming'
WHERE NOT EXISTS (SELECT 1 FROM translation_call WHERE call_id = 'b2000002-0000-4000-8000-000000000002'::uuid);
