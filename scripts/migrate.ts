import { config } from "dotenv";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

config({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes("REPLACE_WITH_DB_PASSWORD")) {
    console.error("DATABASE_URL chưa được cấu hình đúng trong .env.local");
    process.exit(1);
  }

  const sqlPath = path.join(process.cwd(), "supabase", "migrations", "0001_init.sql");
  const sql = readFileSync(sqlPath, "utf-8");

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log("Migration chạy thành công.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Migration thất bại:", err);
  process.exit(1);
});
