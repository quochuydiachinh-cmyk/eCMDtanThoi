import { config } from "dotenv";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.join(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

const email = process.argv[2];
const password = process.argv[3];
const role = (process.argv[4] ?? "admin") as "admin" | "editor" | "viewer";

if (!email || !password || !["admin", "editor", "viewer"].includes(role)) {
  console.error("Cách dùng: npx tsx scripts/create-user.ts <email> <mật khẩu> [admin|editor|viewer]");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    console.error("Tạo tài khoản thất bại:", error?.message);
    process.exit(1);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ id: data.user.id, email, role });
  if (profileError) {
    console.error("Tạo profile thất bại:", profileError.message);
    process.exit(1);
  }

  console.log(`Đã tạo tài khoản: ${data.user.email} (id: ${data.user.id}, quyền: ${role})`);
}

main();
