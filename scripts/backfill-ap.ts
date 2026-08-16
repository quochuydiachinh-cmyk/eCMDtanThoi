import { config } from "dotenv";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { normalizeAp } from "../src/lib/ap";

config({ path: path.join(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SECRET_KEY trong .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

async function main() {
  const { data, error } = await supabase.from("ho_so").select("id, dia_chi_thua_dat, ap");
  if (error) {
    console.error("Lỗi khi đọc dữ liệu:", error.message);
    process.exit(1);
  }

  const rows = (data ?? []) as { id: string; dia_chi_thua_dat: string | null; ap: string | null }[];
  let updated = 0;

  for (const row of rows) {
    const correctAp = normalizeAp(row.dia_chi_thua_dat);
    if (correctAp !== row.ap) {
      const { error: updErr } = await supabase.from("ho_so").update({ ap: correctAp }).eq("id", row.id);
      if (updErr) {
        console.error(`Lỗi cập nhật id ${row.id}:`, updErr.message);
        continue;
      }
      console.log(`  ${row.id}: "${row.ap ?? ""}" -> "${correctAp ?? ""}"  (địa chỉ: ${row.dia_chi_thua_dat ?? ""})`);
      updated += 1;
    }
  }

  console.log(`\nĐã kiểm tra ${rows.length} hồ sơ, cập nhật lại ${updated} hồ sơ có Ấp không khớp địa chỉ.`);
}

main().catch((err) => {
  console.error("Backfill thất bại:", err);
  process.exit(1);
});
