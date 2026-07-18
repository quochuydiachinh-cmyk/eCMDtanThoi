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
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <span className="font-bold text-sm">
              Hồ sơ Chuyển mục đích – Xã Tân Thới
            </span>
            <Link href="/ho-so" className="text-sm text-slate-200 hover:text-white">
              Danh sách
            </Link>
            <Link href="/dashboard" className="text-sm text-slate-200 hover:text-white">
              Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-300">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
