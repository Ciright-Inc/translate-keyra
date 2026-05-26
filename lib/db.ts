import { Pool, type QueryResultRow } from "pg";
import { getPgPoolConfig } from "./pg-config";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) pool = new Pool(getPgPoolConfig());
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  return getPool().query<T>(text, params);
}
