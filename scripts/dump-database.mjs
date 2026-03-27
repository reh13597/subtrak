import "dotenv/config";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME;
const port = process.env.DB_PORT || 3306;

if (!host || !user || !database) {
  console.error("Missing DB_HOST, DB_USER, or DB_NAME in .env");
  process.exit(1);
}

const outputPath = path.join(__dirname, "..", "sql", "dump.sql");
const env = { ...process.env };
if (password) env.MYSQL_PWD = password;

try {
  execSync(
    `mysqldump -h ${host} -P ${port} -u ${user} ${database} --result-file="${outputPath}" --single-transaction --routines --triggers`,
    { stdio: "inherit", env }
  );
  console.log(`Dump written to ${outputPath}`);
} catch (err) {
  console.error("mysqldump failed. Ensure mysql client is installed and credentials are correct.");
  process.exit(1);
}
