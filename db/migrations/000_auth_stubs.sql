-- Minimal Keyra auth tables for standalone deploy.
-- migrate:skip-if-populated auth_users

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS auth_users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(32),
  email VARCHAR(255),
  full_name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO auth_users (email, full_name)
SELECT 'translate-admin@keyra.ie', 'Translation Admin'
WHERE NOT EXISTS (SELECT 1 FROM auth_users LIMIT 1);

INSERT INTO auth_users (email, full_name)
SELECT 'demo.user@keyra.ie', 'Demo User'
WHERE NOT EXISTS (SELECT 1 FROM auth_users WHERE email = 'demo.user@keyra.ie');
