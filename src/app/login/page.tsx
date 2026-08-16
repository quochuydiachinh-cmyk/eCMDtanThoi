"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Sai email hoặc mật khẩu.");
      return;
    }
    const next = searchParams.get("next") || "/ho-so";
    router.push(next);
    router.refresh();
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      <Image
        src="/cau-tan-thoi.jpg"
        alt=""
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60" />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/30 bg-white/15 shadow-2xl shadow-black/40 backdrop-blur-xl p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <Image
            src="/quoc-huy.png"
            alt="Quốc huy Việt Nam"
            width={96}
            height={96}
            className="w-11 h-11 object-contain mb-2 drop-shadow"
          />
          <p className="text-[11px] font-semibold tracking-wide text-white/85 uppercase">
            UBND xã Tân Thới
          </p>
          <h1 className="text-lg font-bold text-white mt-1 drop-shadow-sm">
            Quản lý Hồ sơ Chuyển mục đích
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/85 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-white/40 bg-white/15 text-white placeholder-white/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/85 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-white/40 bg-white/15 text-white placeholder-white/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300"
            />
          </div>
          {error && (
            <p className="text-sm text-red-100 bg-red-500/30 border border-red-300/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg py-2.5 transition shadow-lg shadow-blue-900/30"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
