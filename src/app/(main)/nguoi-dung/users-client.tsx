"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import { ROLE_LABEL } from "@/lib/role";

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  editor: "bg-blue-100 text-blue-700",
  viewer: "bg-slate-100 text-slate-600",
};

export default function UsersClient() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const [{ data: profiles }, { data: auth }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: true }),
        supabase.auth.getUser(),
      ]);
      if (!cancelled) {
        setUsers((profiles ?? []) as Profile[]);
        setCurrentUserId(auth.user?.id ?? null);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRoleChange(userId: string, role: "editor" | "viewer") {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
    if (error) {
      setError("Đổi quyền thất bại: " + error.message);
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
  }

  async function handleDelete(u: Profile) {
    if (!window.confirm(`Xoá tài khoản "${u.email}"? Không thể hoàn tác.`)) return;
    setError(null);
    const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError("Xoá thất bại: " + (body.error ?? res.statusText));
      return;
    }
    setUsers((prev) => prev.filter((x) => x.id !== u.id));
  }

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-[#1e3a5f]">Quản lý người dùng</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="text-xs font-semibold px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
        >
          + Thêm người dùng
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="bg-white rounded-xl shadow divide-y divide-slate-100">
        {loading ? (
          <p className="text-sm text-slate-400 p-4">Đang tải...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-400 p-4">Chưa có người dùng nào.</p>
        ) : (
          users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div className="min-w-0">
                <div className="text-sm text-slate-800 truncate">{u.email}</div>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${ROLE_BADGE[u.role]}`}>
                  {ROLE_LABEL[u.role]}
                </span>
              </div>
              {u.role === "admin" ? (
                <span className="text-xs text-slate-400">Tài khoản quản trị</span>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value as "editor" | "viewer")}
                    className="border border-slate-300 rounded-md px-2 py-1.5 text-xs"
                  >
                    <option value="viewer">Chỉ xem</option>
                    <option value="editor">Có thể sửa</option>
                  </select>
                  <button
                    onClick={() => handleDelete(u)}
                    disabled={u.id === currentUserId}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-40"
                  >
                    Xoá
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <AddUserDialog
          onClose={() => setShowAdd(false)}
          onCreated={(u) => {
            setUsers((prev) => [...prev, u]);
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

function AddUserDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (u: Profile) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("viewer");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(body.error ?? "Tạo tài khoản thất bại");
      return;
    }
    onCreated({ id: body.id, email: body.email, role: body.role, created_at: new Date().toISOString() });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
        <h2 className="text-sm font-bold text-slate-800 mb-4">Thêm người dùng</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Mật khẩu</label>
            <input
              type="text"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Quyền</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm text-slate-700">
                <input type="radio" checked={role === "viewer"} onChange={() => setRole("viewer")} />
                Chỉ xem
              </label>
              <label className="flex items-center gap-1.5 text-sm text-slate-700">
                <input type="radio" checked={role === "editor"} onChange={() => setRole("editor")} />
                Có thể sửa
              </label>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="text-sm px-4 py-2 rounded-md text-slate-600 hover:bg-slate-100">
              Huỷ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="text-sm px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold"
            >
              {saving ? "Đang tạo..." : "Tạo tài khoản"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
