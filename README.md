# KEYRA Translation — translate.keyra.ie

Enterprise-grade multilingual communications engine for the KEYRA / Ciright platform.

## Stack

- **Next.js 16** (App Router)
- **PostgreSQL** (`keyra-auth` database, `translation_*` tables)
- **Hybrid architecture**: AWS Chime (voice transport) + Google (speech / translation / synthesis)

## Quick start

```bash
cd translate-keyra
npm install
# Optional: create .env.local with DATABASE_URL (defaults to Ciright Postgres below)
npm run db:migrate
npm run dev
```

Open **http://localhost:3010** for the landing page. Admin: http://localhost:3010/admin/dashboard

> **Important:** Run commands from the `translate-keyra` folder, not `D:\react-projects`.
> If the browser tab spins forever on port 3000, a stuck Node process is usually blocking it — use port **3010** (`npm run dev`) or stop old `node` processes on 3000/3001.

## Database

Default connection (local Ciright Core):

```
postgresql://postgres:ciright@192.168.1.206:5432/keyra-auth
```

### Tables

| Table | Purpose |
|-------|---------|
| `translation_call` | Core call log (billable from initiation) |
| `translation_call_transcript` | Live transcript segments |
| `translation_call_billing` | Dual-sided EID airtime billing |
| `translation_user_language_config` | Profile language settings |
| `translation_platform_config` | Google / AWS / billing admin |
| `translation_call_invite` | Cross-app incoming call invites |
| `translation_audit_log` | Compliance audit trail |

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Service + DB health |
| `/api/calls` | GET, POST | List / initiate calls |
| `/api/calls/[id]` | GET | Call detail + transcripts + billing |
| `/api/calls/[id]/accept` | POST | Accept + context sync |
| `/api/calls/[id]/decline` | POST | Decline incoming call |
| `/api/calls/[id]/end` | POST | End call + dual billing |
| `/api/invites` | GET | Pending invites (`?uid=`) for cross-app polling |
| `/api/transcripts` | GET, POST | Transcript search / live segment append |
| `/api/billing` | GET | Airtime billing |
| `/api/analytics` | GET | Admin dashboards |
| `/api/config` | GET, PATCH | Platform config |
| `/api/user-preferences` | GET, PUT | Language profile |

## Integration (prompt.ciright.com)

Deploy the **Translation Call** global action in the header (top right, adjacent to Create/Edit Prompt). On click, `POST /api/calls` with `origin_app`, `origin_path`, `object_type`, `object_id`, and authenticated `from_uid` / `to_uid`.

Receiving users must have `translation_enabled = true` in `translation_user_language_config`.

## Troubleshooting “only loading”

| Symptom | Fix |
|---------|-----|
| `pnpm run dev` in `D:\react-projects` fails | `cd translate-keyra` then `npm run dev` |
| Browser never loads on :3000 | Use **http://localhost:3010** or end stuck Node on port 3000 |
| Admin shows “Loading analytics…” forever | Postgres at `192.168.1.206` must be reachable; check `/api/health` |
| `npm start` hangs then exits | DB migration failed — fix `DATABASE_URL` or `set SKIP_DB_MIGRATE=true` |

## Scripts

- `npm run dev` — development server (port **3010**)
- `npm run build` — production build
- `npm run start` — migrate + `next start`
- `npm run db:migrate` — apply SQL migrations
- `npm run db:check` — verify DB connectivity
