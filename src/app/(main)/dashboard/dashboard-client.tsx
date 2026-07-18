"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { HoSo, TRANG_THAI_LABEL } from "@/lib/types";
import { tinhTrangThai } from "@/lib/status";
import { formatDateDisplay } from "@/lib/dates";

const COLORS = {
  blue: "#2563eb",
  green: "#10b981",
  amber: "#f59e0b",
  purple: "#8b5cf6",
  red: "#ef4444",
  teal: "#14b8a6",
  pink: "#ec4899",
  orange: "#f97316",
  indigo: "#6366f1",
  lime: "#84cc16",
  cyan: "#06b6d4",
  rose: "#f43f5e",
};
const PALETTE = Object.values(COLORS);

const LOAI_TRUOC_COLOR: Record<string, string> = {
  LUC: COLORS.green,
  CLN: COLORS.amber,
  HNK: COLORS.teal,
  "CLN+ONT": COLORS.orange,
};

function fmtNum(n: number) {
  return n.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
}

type Filters = {
  nam: "all" | number;
  ap: string;
  loaiDat: string;
  tbd: string;
  trangThai: string;
  tuNgay: string;
  denNgay: string;
};

const EMPTY_FILTERS: Filters = {
  nam: 2026,
  ap: "",
  loaiDat: "",
  tbd: "",
  trangThai: "",
  tuNgay: "",
  denNgay: "",
};

export default function DashboardClient() {
  const [rows, setRows] = useState<HoSo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.from("ho_so").select("*").order("nam").order("stt");
      if (error) console.error(error);
      setRows((data ?? []) as HoSo[]);
      setLoading(false);
    }
    load();
  }, []);

  const apOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.ap).filter(Boolean))).sort() as string[],
    [rows]
  );
  const loaiDatOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.loai_dat_truoc).filter(Boolean))).sort() as string[],
    [rows]
  );
  const tbdOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.to_ban_do).filter(Boolean))).sort() as string[],
    [rows]
  );
  const namOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.nam))).sort((a, b) => b - a),
    [rows]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filters.nam !== "all" && r.nam !== filters.nam) return false;
      if (filters.ap && r.ap !== filters.ap) return false;
      if (filters.loaiDat && r.loai_dat_truoc !== filters.loaiDat) return false;
      if (filters.tbd && r.to_ban_do !== filters.tbd) return false;
      if (filters.trangThai && tinhTrangThai(r) !== filters.trangThai) return false;
      if (filters.tuNgay && (!r.ngay_nhan || r.ngay_nhan < filters.tuNgay)) return false;
      if (filters.denNgay && (!r.ngay_nhan || r.ngay_nhan > filters.denNgay)) return false;
      return true;
    });
  }, [rows, filters]);

  const cards = useMemo(() => {
    const dtTruoc = filteredRows.reduce((s, r) => s + (r.dien_tich_truoc ?? 0), 0);
    const dtSau = filteredRows.reduce(
      (s, r) => s + (r.dien_tich_sau_cln ?? 0) + (r.dien_tich_sau_ont ?? 0) + (r.dien_tich_sau_nts ?? 0),
      0
    );
    const daTra = filteredRows.filter((r) => r.ngay_tra).length;
    return { total: filteredRows.length, dtTruoc, dtSau, daTra };
  }, [filteredRows]);

  const timeChartData = useMemo(() => {
    const byMonth = new Map<string, { cln: number; ont: number; nts: number }>();
    for (const r of filteredRows) {
      if (!r.ngay_nhan) continue;
      const ym = r.ngay_nhan.slice(0, 7);
      const cur = byMonth.get(ym) ?? { cln: 0, ont: 0, nts: 0 };
      cur.cln += r.dien_tich_sau_cln ?? 0;
      cur.ont += r.dien_tich_sau_ont ?? 0;
      cur.nts += r.dien_tich_sau_nts ?? 0;
      byMonth.set(ym, cur);
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, v]) => {
        const [y, m] = ym.split("-");
        return { name: `T${Number(m)}/${y}`, CLN: Math.round(v.cln), ONT: Math.round(v.ont), NTS: Math.round(v.nts) };
      });
  }, [filteredRows]);

  const loaiTruocData = useMemo(() => {
    const grp = new Map<string, number>();
    for (const r of filteredRows) {
      const k = r.loai_dat_truoc || "Khác";
      grp.set(k, (grp.get(k) ?? 0) + (r.dien_tich_truoc ?? 0));
    }
    return Array.from(grp.entries()).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [filteredRows]);

  const apChartData = useMemo(() => {
    const grp = new Map<string, number>();
    for (const r of filteredRows) {
      const k = r.ap || "Không rõ";
      grp.set(k, (grp.get(k) ?? 0) + (r.dien_tich_truoc ?? 0));
    }
    return Array.from(grp.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [filteredRows]);

  const loaiSauData = useMemo(() => {
    let cln = 0,
      ont = 0,
      nts = 0;
    for (const r of filteredRows) {
      cln += r.dien_tich_sau_cln ?? 0;
      ont += r.dien_tich_sau_ont ?? 0;
      nts += r.dien_tich_sau_nts ?? 0;
    }
    return [
      { name: "CLN", value: Math.round(cln), color: COLORS.amber },
      { name: "ONT", value: Math.round(ont), color: COLORS.blue },
      { name: "NTS", value: Math.round(nts), color: COLORS.purple },
    ].filter((d) => d.value > 0);
  }, [filteredRows]);

  return (
    <div className="max-w-[1600px] mx-auto p-6">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-[#1e3a5f]">
          📊 Dashboard Chuyển mục đích sử dụng đất – Xã Tân Thới
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {loading ? "Đang tải dữ liệu..." : `${rows.length} hồ sơ trong hệ thống`}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3.5 mb-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="text-[11px] text-slate-500 uppercase tracking-wide">Tổng hồ sơ</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{cards.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">hồ sơ chuyển mục đích</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-emerald-500">
          <div className="text-[11px] text-slate-500 uppercase tracking-wide">Diện tích trước CMĐ</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{fmtNum(cards.dtTruoc)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">m²</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-amber-500">
          <div className="text-[11px] text-slate-500 uppercase tracking-wide">Diện tích sau CMĐ</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{fmtNum(cards.dtSau)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">m²</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="text-[11px] text-slate-500 uppercase tracking-wide">Đã trả kết quả</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {cards.daTra} / {cards.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">hồ sơ</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="text-xs font-semibold text-[#1e3a5f] mb-3">🔍 Bộ lọc</div>
        <div className="grid grid-cols-4 lg:grid-cols-7 gap-3">
          <FilterSelect
            label="Năm"
            value={String(filters.nam)}
            onChange={(v) => setFilters((f) => ({ ...f, nam: v === "all" ? "all" : Number(v) }))}
            options={[
              { value: "all", label: "Tất cả năm" },
              ...namOptions.map((n) => ({ value: String(n), label: String(n) })),
            ]}
          />
          <FilterSelect
            label="Ấp"
            value={filters.ap}
            onChange={(v) => setFilters((f) => ({ ...f, ap: v }))}
            options={[{ value: "", label: "-- Tất cả --" }, ...apOptions.map((a) => ({ value: a, label: a }))]}
          />
          <FilterSelect
            label="Loại đất trước"
            value={filters.loaiDat}
            onChange={(v) => setFilters((f) => ({ ...f, loaiDat: v }))}
            options={[{ value: "", label: "-- Tất cả --" }, ...loaiDatOptions.map((l) => ({ value: l, label: l }))]}
          />
          <FilterSelect
            label="Tờ bản đồ"
            value={filters.tbd}
            onChange={(v) => setFilters((f) => ({ ...f, tbd: v }))}
            options={[{ value: "", label: "-- Tất cả --" }, ...tbdOptions.map((t) => ({ value: t, label: t }))]}
          />
          <FilterSelect
            label="Trạng thái"
            value={filters.trangThai}
            onChange={(v) => setFilters((f) => ({ ...f, trangThai: v }))}
            options={[
              { value: "", label: "-- Tất cả --" },
              ...Object.entries(TRANG_THAI_LABEL).map(([k, v]) => ({ value: k, label: v })),
            ]}
          />
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Từ ngày nhận</label>
            <input
              type="date"
              value={filters.tuNgay}
              onChange={(e) => setFilters((f) => ({ ...f, tuNgay: e.target.value }))}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Đến ngày nhận</label>
            <input
              type="date"
              value={filters.denNgay}
              onChange={(e) => setFilters((f) => ({ ...f, denNgay: e.target.value }))}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs"
            />
          </div>
        </div>
        <div className="mt-3">
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="text-xs px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold"
          >
            Xoá bộ lọc
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] gap-3.5 mb-4">
        <ChartBox title="Diện tích chuyển mục đích theo thời gian (m²)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={timeChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${fmtNum(Number(v))} m²`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="CLN" stackId="s" fill={COLORS.amber} />
              <Bar dataKey="ONT" stackId="s" fill={COLORS.blue} />
              <Bar dataKey="NTS" stackId="s" fill={COLORS.purple} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Loại đất trước CMĐ (theo diện tích)">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={loaiTruocData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {loaiTruocData.map((d, i) => (
                  <Cell key={d.name} fill={LOAI_TRUOC_COLOR[d.name] ?? PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${fmtNum(Number(v))} m²`} />
              <Legend wrapperStyle={{ fontSize: 11 }} verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      <div className="grid grid-cols-2 gap-3.5 mb-4">
        <ChartBox title="Diện tích trước CMĐ theo ấp (m²)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={apChartData} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
              <Tooltip formatter={(v) => `${fmtNum(Number(v))} m²`} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {apChartData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Loại đất sau CMĐ (theo diện tích)">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={loaiSauData} dataKey="value" nameKey="name" outerRadius={95}>
                {loaiSauData.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${fmtNum(Number(v))} m²`} />
              <Legend wrapperStyle={{ fontSize: 11 }} verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-[#1e3a5f]">Danh sách hồ sơ hợp lệ theo bộ lọc</div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Hiển thị {filteredRows.length} hồ sơ</span>
            <Link href="/ho-so" className="text-xs font-semibold text-blue-600 hover:underline">
              Mở trong Danh sách →
            </Link>
          </div>
        </div>
        <div className="overflow-auto max-h-[360px]">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-[#1e3a5f] text-white">
              <tr>
                {["STT", "Họ và tên", "Ấp", "Loại đất trước", "DT trước (m²)", "Loại đất sau", "Ngày nhận", "Ngày trả", "Ghi chú"].map(
                  (h) => (
                    <th key={h} className="px-2.5 py-2 text-left whitespace-nowrap">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    Không có dữ liệu phù hợp
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-blue-50">
                    <td className="px-2.5 py-1.5">{r.stt}</td>
                    <td className="px-2.5 py-1.5">{r.ho_ten || "–"}</td>
                    <td className="px-2.5 py-1.5">{r.ap || "–"}</td>
                    <td className="px-2.5 py-1.5">{r.loai_dat_truoc || "–"}</td>
                    <td className="px-2.5 py-1.5">{r.dien_tich_truoc != null ? fmtNum(r.dien_tich_truoc) : "–"}</td>
                    <td className="px-2.5 py-1.5">
                      {[
                        r.dien_tich_sau_cln ? "CLN" : null,
                        r.dien_tich_sau_ont ? "ONT" : null,
                        r.dien_tich_sau_nts ? "NTS" : null,
                      ]
                        .filter(Boolean)
                        .join("+") || "–"}
                    </td>
                    <td className="px-2.5 py-1.5">{formatDateDisplay(r.ngay_nhan) || "–"}</td>
                    <td className={`px-2.5 py-1.5 ${r.ngay_tra ? "text-emerald-600" : "text-red-600"}`}>
                      {formatDateDisplay(r.ngay_tra) || "–"}
                    </td>
                    <td className="px-2.5 py-1.5 text-slate-500 max-w-[180px] truncate">{r.ghi_chu || ""}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ChartBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-xs font-semibold text-[#1e3a5f] mb-3">{title}</div>
      {children}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
