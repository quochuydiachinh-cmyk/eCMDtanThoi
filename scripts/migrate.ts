import { config } from "dotenv";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

config({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes("REPLACE_WITH_DB_PASSWORD")) {
    console.error("DATABASE_URL chưa được cấu hình đúng trong .env.local");
    process.exit(1);
  }

  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(
      `create table if not exists public.schema_migrations (
        filename text primary key,
        applied_at timestamptz not null default now()
      )`
    );

    const { rows } = await client.query<{ filename: string }>("select filename from public.schema_migrations");
    const applied = new Set(rows.map((r) => r.filename));

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Bỏ qua (đã chạy trước đó): ${file}`);
        continue;
      }
      console.log(`Chạy migration: ${file}`);
      const sql = readFileSync(path.join(migrationsDir, file), "utf-8");
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into public.schema_migrations (filename) values ($1)", [file]);
        await client.query("commit");
      } catch (err) {
        await client.query("rollback");
        throw err;
      }
    }
    console.log("Migration chạy thành công.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Migration thất bại:", err);
  process.exit(1);
});
