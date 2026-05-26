-- translate.keyra.ie — KEYRA Translation Communication Engine
-- PostgreSQL (keyra-auth database)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User language preferences (profile: Enable Language Translation)
CREATE TABLE IF NOT EXISTS translation_user_language_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid INT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  eid VARCHAR(128),
  subscription_id VARCHAR(128),
  world_id VARCHAR(128),
  translation_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  primary_language VARCHAR(16) NOT NULL DEFAULT 'en',
  secondary_language VARCHAR(16),
  preferred_voice VARCHAR(64) DEFAULT 'neutral',
  speech_rate NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  transcription_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  google_voice_mapping JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_translation_user_lang_uid ON translation_user_language_config(uid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_translation_user_lang_uid_world
  ON translation_user_language_config (uid, COALESCE(subscription_id, ''), COALESCE(world_id, ''));

-- Platform configuration (Google API, AWS Chime, billing rates)
CREATE TABLE IF NOT EXISTS translation_platform_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(128) UNIQUE NOT NULL,
  config_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Core call log
CREATE TABLE IF NOT EXISTS translation_call (
  call_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id VARCHAR(128),
  world_id VARCHAR(128),
  from_uid INT NOT NULL REFERENCES auth_users(id),
  to_uid INT REFERENCES auth_users(id),
  from_eid VARCHAR(128),
  to_eid VARCHAR(128),
  object_type VARCHAR(64),
  object_id VARCHAR(128),
  origin_app VARCHAR(128),
  origin_path TEXT,
  context_sync_path TEXT,
  call_start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  call_end_time TIMESTAMPTZ,
  duration_seconds INT,
  source_language VARCHAR(16),
  destination_language VARCHAR(16),
  transport_model VARCHAR(32) DEFAULT 'hybrid',
  aws_session_id VARCHAR(255),
  google_translation_session_id VARCHAR(255),
  billing_rate NUMERIC(10,4),
  google_cost NUMERIC(12,4) DEFAULT 0,
  aws_cost NUMERIC(12,4) DEFAULT 0,
  total_cost NUMERIC(12,4) DEFAULT 0,
  call_status VARCHAR(32) NOT NULL DEFAULT 'initiated',
  transcript_status VARCHAR(32) DEFAULT 'pending',
  recording_status VARCHAR(32) DEFAULT 'none',
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_translation_call_from ON translation_call(from_uid, call_start_time DESC);
CREATE INDEX IF NOT EXISTS idx_translation_call_to ON translation_call(to_uid, call_start_time DESC);
CREATE INDEX IF NOT EXISTS idx_translation_call_object ON translation_call(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_translation_call_status ON translation_call(call_status) WHERE call_status IN ('initiated', 'ringing', 'active');

-- Live transcript segments
CREATE TABLE IF NOT EXISTS translation_call_transcript (
  transcript_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES translation_call(call_id) ON DELETE CASCADE,
  sequence_number INT NOT NULL,
  speaker_uid INT REFERENCES auth_users(id),
  original_language VARCHAR(16),
  translated_language VARCHAR(16),
  original_text TEXT NOT NULL,
  translated_text TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confidence_score NUMERIC(5,4),
  UNIQUE(call_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_translation_transcript_call ON translation_call_transcript(call_id, sequence_number);

-- Per-EID airtime billing (both sides charged)
CREATE TABLE IF NOT EXISTS translation_call_billing (
  billing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES translation_call(call_id) ON DELETE CASCADE,
  eid VARCHAR(128) NOT NULL,
  uid INT REFERENCES auth_users(id),
  subscription_id VARCHAR(128),
  airtime_seconds INT NOT NULL DEFAULT 0,
  google_translation_cost NUMERIC(12,4) DEFAULT 0,
  aws_transport_cost NUMERIC(12,4) DEFAULT 0,
  platform_fee NUMERIC(12,4) DEFAULT 0,
  total_cost NUMERIC(12,4) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'EUR',
  billing_status VARCHAR(32) DEFAULT 'pending',
  invoice_id VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_translation_billing_call ON translation_call_billing(call_id);
CREATE INDEX IF NOT EXISTS idx_translation_billing_eid ON translation_call_billing(eid, created_at DESC);

-- Incoming call notifications (cross-app presence)
CREATE TABLE IF NOT EXISTS translation_call_invite (
  invite_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES translation_call(call_id) ON DELETE CASCADE,
  target_uid INT NOT NULL REFERENCES auth_users(id),
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  target_app VARCHAR(128),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '2 minutes'),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_translation_invite_target ON translation_call_invite(target_uid, status)
  WHERE status = 'pending';

-- Audit trail for compliance
CREATE TABLE IF NOT EXISTS translation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES translation_call(call_id) ON DELETE SET NULL,
  uid INT,
  action VARCHAR(128) NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_translation_audit_call ON translation_audit_log(call_id, created_at DESC);

-- Default platform config
INSERT INTO translation_platform_config (config_key, config_value, description)
VALUES
  ('google_translate', '{"enabled": true, "project_id": ""}'::jsonb, 'Google Cloud Translation & Speech'),
  ('aws_chime', '{"enabled": true, "region": "eu-west-1"}'::jsonb, 'Amazon Chime SDK / Voice Connector'),
  ('billing', '{"platform_fee_per_minute": 0.05, "google_per_minute": 0.12, "aws_per_minute": 0.08, "currency": "EUR"}'::jsonb, 'Airtime billing rates'),
  ('transport', '{"model": "hybrid", "primary": "aws", "translation": "google"}'::jsonb, 'Hybrid transport architecture')
ON CONFLICT (config_key) DO NOTHING;
