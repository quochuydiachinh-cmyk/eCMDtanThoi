import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-[#1e3a5f] text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between h-14 gap-2">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <span className="font-bold text-sm whitespace-nowrap hidden sm:inline">
              Hồ sơ Chuyển mục đích – Xã Tân Thới
            </span>
            <span className="font-bold text-sm whitespace-nowrap sm:hidden">CMĐ Tân Thới</span>
            <Link href="/ho-so" className="text-sm text-slate-200 hover:text-white whitespace-nowrap">
              Danh sách
            </Link>
            <Link href="/dashboard" className="text-sm text-slate-200 hover:text-white whitespace-nowrap">
              Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <span className="text-xs text-slate-300 hidden sm:inline">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
