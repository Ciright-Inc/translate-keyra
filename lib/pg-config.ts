import type { PoolConfig } from "pg";

export function getDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ||
    "postgresql://postgres:ciright@192.168.1.206:5432/keyra-auth"
  );
}

export function getPgPoolConfig(): PoolConfig {
  const connectionString = getDatabaseUrl();
  const needsSsl =
    process.env.PGSSLMODE === "require" ||
    Boolean(process.env.RAILWAY_ENVIRONMENT) ||
    /sslmode=require/i.test(connectionString);

  return {
    connectionString,
    max: Number(process.env.PG_POOL_MAX ?? 10),
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS ?? 8_000),
    idleTimeoutMillis: 30_000,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  };
}
