import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const MIGRATIONS_TABLE = "translate_schema_migrations";

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    "postgresql://postgres:ciright@192.168.1.206:5432/keyra-auth"
  );
}

function getPgPoolConfig() {
  const connectionString = getDatabaseUrl();
  const needsSsl =
    process.env.PGSSLMODE === "require" ||
    Boolean(process.env.RAILWAY_ENVIRONMENT) ||
    /sslmode=require/i.test(connectionString);
  return {
    connectionString,
    max: Number(process.env.PG_POOL_MAX ?? 10),
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS ?? 8_000),
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  };
}

function parseMigrationMeta(sql) {
  for (const line of sql.split("\n").slice(0, 10)) {
    const match = line.trim().match(/^--\s*migrate:skip-if-populated\s+(\w+)$/i);
    if (match) return { skipIfPopulated: match[1] };
  }
  return {};
}

async function run() {
  if (process.env.SKIP_DB_MIGRATE === "true") {
    console.log("[migrate] Skipped");
    return;
  }

  const pool = new pg.Pool(getPgPoolConfig());
  const migrationsDir = join(root, "db", "migrations");

  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      const files = readdirSync(migrationsDir)
        .filter((f) => f.endsWith(".sql"))
        .sort((a, b) => a.localeCompare(b));

      for (const file of files) {
        const name = file.replace(/\.sql$/, "");
        const applied = await client.query(
          `SELECT 1 FROM ${MIGRATIONS_TABLE} WHERE name = $1 LIMIT 1`,
          [name]
        );
        if ((applied.rowCount ?? 0) > 0) {
          console.log(`[migrate] ✓ ${name} (already applied)`);
          continue;
        }

        const sql = readFileSync(join(migrationsDir, file), "utf8");
        const meta = parseMigrationMeta(sql);

        if (meta.skipIfPopulated) {
          const check = await client.query(
            `SELECT 1 FROM ${meta.skipIfPopulated} LIMIT 1`
          );
          if ((check.rowCount ?? 0) > 0) {
            console.log(`[migrate] ⊘ ${name} skipped`);
            await client.query(
              `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1) ON CONFLICT DO NOTHING`,
              [name]
            );
            continue;
          }
        }

        console.log(`[migrate] Applying ${name}…`);
        await client.query("BEGIN");
        try {
          await client.query(sql);
          await client.query(
            `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1) ON CONFLICT DO NOTHING`,
            [name]
          );
          await client.query("COMMIT");
          console.log(`[migrate] ✓ ${name}`);
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        }
      }
      console.log("[migrate] All migrations up to date");
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error("[migrate] Failed:", err);
  process.exit(1);
});
