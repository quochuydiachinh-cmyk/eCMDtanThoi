import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/get-role";
import { formatVietnameseDate } from "@/lib/dates";
import LogoutButton from "./logout-button";
import NavBar from "./nav-bar";

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

  const role = await getCurrentUserRole();
  const today = formatVietnameseDate(new Date());

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <Image
              src="/quoc-huy.png"
              alt="Quốc huy Việt Nam"
              width={112}
              height={112}
              priority
              className="h-9 w-9 sm:h-14 sm:w-14 object-contain shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-[#b91c1c] font-extrabold text-[13px] sm:text-lg leading-tight tracking-tight truncate">
                ỦY BAN NHÂN DÂN XÃ TÂN THỚI
              </h1>
              <p className="text-slate-500 text-[10px] sm:text-sm font-semibold uppercase tracking-wide truncate">
                Phòng Kinh Tế
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 shrink-0 text-xs text-slate-500">
            <span>{today}</span>
            <span className="w-px h-4 bg-slate-200" />
            <span>{user.email}</span>
            <LogoutButton />
          </div>
          <div className="sm:hidden shrink-0">
            <LogoutButton />
          </div>
        </div>
      </header>

      <NavBar role={role} />

      <main>{children}</main>
    </div>
  );
}
