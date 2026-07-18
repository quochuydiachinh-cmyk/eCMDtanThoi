"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@/lib/role";

function ListIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 6a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm1 5a1 1 0 100 2h12a1 1 0 100-2H4z" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M3 3a1 1 0 011 1v12h12a1 1 0 110 2H3a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M17 6a1 1 0 00-1 1v8a1 1 0 102 0V7a1 1 0 00-1-1zM13 9a1 1 0 00-1 1v5a1 1 0 102 0v-5a1 1 0 00-1-1zM9 11a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1zM5 13a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1z" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.5 15c0-2.9 2.6-5 5.5-5s5.5 2.1 5.5 5v.5h-11V15zM13 10.6c1.9.4 3.5 1.9 3.5 4.4v.5h2.5V15c0-2.2-1.7-3.9-4.1-4.3-.6-.1-1.3-.1-1.9-.1z" />
    </svg>
  );
}

const NAV_ITEMS: { href: string; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
  { href: "/ho-so", label: "Danh sách", icon: <ListIcon /> },
  { href: "/dashboard", label: "Dashboard", icon: <ChartIcon /> },
  { href: "/nguoi-dung", label: "Người dùng", icon: <UsersIcon />, adminOnly: true },
];

export default function NavBar({ role }: { role: Role | null }) {
  const pathname = usePathname();

  return (
    <nav className="bg-gradient-to-r from-[#1e4d8c] via-[#2568ac] to-[#1e4d8c]">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 flex items-center h-11 gap-1 overflow-x-auto">
        {NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin").map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3.5 h-8 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
                active ? "bg-white text-[#1e4d8c] shadow" : "text-white/85 hover:bg-white/15 hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
