# Deploy to Railway

Deploy **translate.keyra.ie** on [Railway](https://railway.com) with automatic PostgreSQL migrations on every release.

## 1. Create project

1. Connect the `translate-keyra` CodeCommit / GitHub repo
2. Railway reads `railway.toml` and builds with the **Dockerfile**

## 2. Add PostgreSQL

1. **+ New** → **Database** → **PostgreSQL**
2. App service → **Variables** → reference `DATABASE_URL` from Postgres

Migrations run in `scripts/docker-entrypoint.sh` before the server starts.

## 3. Set environment variables

Use `railway.env.example` as a checklist. Minimum for production:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `NEXT_PUBLIC_SIMSECURE_AUTH_BACKEND_URL` | `https://auth.keyra.ie` |
| `NEXT_PUBLIC_KEYRA_GET_STARTED_URL` | `https://get-started.keyra.ie` |
| `KEYRA_AUTH_BACKEND_URL` | `https://auth.keyra.ie` |
| `NEXT_PUBLIC_TRANSLATE_DEV_AUTH_BYPASS` | `false` |
| `NODE_ENV` | `production` |

Optional:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_TRANSLATE_LOGIN_RETURN_URL` | `https://translate-keyra-production.up.railway.app/login?auth_return=1` |
| `SKIP_DB_MIGRATE` | `true` (not recommended for first deploy) |

**Important:** `NEXT_PUBLIC_*` variables must exist **before the build** (baked into the client bundle). After changing them, trigger a **Redeploy**.

## 4. Shared Keyra login flow (production)

Same pattern as Family Office:

1. User opens `/login` on Translation
2. Redirect to `https://get-started.keyra.ie?return=<translation-url>/login?auth_return=1`
3. After phone verify, Get Started redirects back
4. Translation polls `https://auth.keyra.ie/auth/session` and opens admin
5. Logout on any Keyra site clears the shared session everywhere

Get Started must include Translation in its post-verify allowlist (`translate-return-url.ts` in `get-started-simsecure`).

## 5. Verify

```bash
curl https://translate-keyra-production.up.railway.app/api/health
curl -I https://translate-keyra-production.up.railway.app/login
```

Open `/login`, complete Get Started sign-in, confirm admin loads with your Keyra identity.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `/login` returns 404 | Redeploy latest `main` with Dockerfile build |
| Stuck on “Checking session…” | Set auth env vars, redeploy; use live Get Started return URL |
| Get Started does not return to Translation | Deploy get-started with translate allowlist |
| Admin loads without login | Set `NEXT_PUBLIC_TRANSLATE_DEV_AUTH_BYPASS=false`, redeploy |
