import "dotenv/config";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    multipleStatements: true,
  });

  const schemaPath = path.join(__dirname, "..", "sql", "schema.sql");
  const dumpPath = path.join(__dirname, "..", "sql", "dump.sql");

  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  const dumpSql = fs.readFileSync(dumpPath, "utf8");

  await conn.query(schemaSql);
  console.log("Schema applied.");

  await conn.query(dumpSql);
  console.log("Dump (sample data) applied.");

  await conn.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
