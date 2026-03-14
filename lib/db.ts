import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";

const globalForDb = globalThis as unknown as { dbPool: Pool };

const pool: Pool =
  globalForDb.dbPool ||
  mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    waitForConnections: true,
    connectionLimit: 10,
    timezone: "+00:00",
  });

if (process.env.NODE_ENV !== "production") globalForDb.dbPool = pool;

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
