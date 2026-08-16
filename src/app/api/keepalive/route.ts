import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Vercel Cron gọi endpoint này định kỳ để tạo hoạt động thật lên database,
 * tránh Supabase free tier tự động pause project sau 7 ngày không hoạt động.
 * Xem lịch chạy trong vercel.json (mục "crons").
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { count, error } = await supabase.from("ho_so").select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, time: new Date().toISOString(), ho_so_count: count });
}
