import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Được gọi định kỳ (Vercel Cron + GitHub Actions, xem vercel.json và
 * .github/workflows/keepalive.yml) để tạo hoạt động thật lên database,
 * tránh Supabase free tier tự động pause project sau 7 ngày không hoạt động.
 * Cố ý không yêu cầu xác thực: endpoint chỉ trả về số lượng hồ sơ (không có
 * dữ liệu nhạy cảm), để bất kỳ dịch vụ ping miễn phí nào cũng gọi được mà
 * không cần cấu hình secret — giảm nguy cơ 1 nguồn ping bị lỗi âm thầm làm
 * project bị pause trở lại.
 */
export async function GET() {
  const supabase = createAdminClient();
  const { count, error } = await supabase.from("ho_so").select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, time: new Date().toISOString(), ho_so_count: count });
}
