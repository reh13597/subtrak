import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";

const globalForDb = globalThis as unknown as { dbPool: Pool };

/** TCP / network failures from mysql2 — not auth or SQL semantics */
const CONNECTIVITY_CODES = new Set([
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ENOTFOUND",
  "ECONNRESET",
  "PROTOCOL_CONNECTION_LOST",
]);

export function isDbConnectivityError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = "code" in err ? (err as { code: unknown }).code : undefined;
  return typeof code === "string" && CONNECTIVITY_CODES.has(code);
}

if (!globalForDb.dbPool) {
  globalForDb.dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    timezone: "+00:00",
    connectTimeout: 8000,
    enableKeepAlive: true,
  });
}

const pool = globalForDb.dbPool;

type SqlParam = string | number | boolean | null | Buffer | Date;

export async function query<T extends RowDataPacket[]>(
  sql: string,
  params?: SqlParam[]
): Promise<T> {
  const [rows] = await pool.query<T>(sql, params);
  return rows;
}

export async function execute(
  sql: string,
  params?: SqlParam[]
): Promise<ResultSetHeader> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
}

export async function getConnection(): Promise<PoolConnection> {
  return pool.getConnection();
}

export default pool;
