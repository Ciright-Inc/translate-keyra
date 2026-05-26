import pg from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:ciright@192.168.1.206:5432/keyra-auth";

const pool = new pg.Pool({ connectionString, connectionTimeoutMillis: 8_000 });

try {
  const r = await pool.query(
    `SELECT COUNT(*)::int AS calls FROM translation_call`
  );
  console.log("[db:check] Connected. translation_call rows:", r.rows[0]?.calls ?? 0);
} catch (e) {
  console.error("[db:check] Failed:", e.message);
  process.exit(1);
} finally {
  await pool.end();
}
