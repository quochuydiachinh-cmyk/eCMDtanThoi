"use client";

import { useState } from "react";
import { CustomFieldDef, HoSo, TRANG_THAI_LABEL, TrangThai } from "@/lib/types";
import { tinhTrangThai } from "@/lib/status";
import { formatDateDisplay } from "@/lib/dates";
import EditRowSheet from "./edit-row-sheet";

const BADGE_CLS: Record<TrangThai, string> = {
  da_tra: "bg-emerald-100 text-emerald-700",
  tre_han: "bg-red-100 text-red-700",
  dang_xu_ly: "bg-amber-100 text-amber-700",
};

const BADGE_DOT: Record<TrangThai, string> = {
  da_tra: "bg-emerald-500",
  tre_han: "bg-red-500",
  dang_xu_ly: "bg-amber-500",
};

export default function MobileCardList({
  rows,
  customFields,
  canEdit,
  onSave,
  onDelete,
}: {
  rows: HoSo[];
  customFields: CustomFieldDef[];
  canEdit: boolean;
  onSave: (row: HoSo) => Promise<boolean>;
  onDelete: (row: HoSo) => void;
}) {
  const [editing, setEditing] = useState<HoSo | null>(null);

  return (
    <div className="space-y-2">
      {rows.length === 0 && <div className="text-center text-sm text-slate-400 py-10">Không có hồ sơ phù hợp</div>}
      {rows.map((r) => {
        const status = tinhTrangThai(r);
        return (
          <button
            key={r.id}
            onClick={() => setEditing(r)}
            className="w-full text-left bg-white rounded-xl shadow-sm border border-slate-200/70 p-3 active:bg-slate-50 transition"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800 truncate">
                  <span className="font-mono tabular-nums text-slate-400 mr-1">{r.stt}.</span>
                  {r.ho_ten || "(chưa có tên)"}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">
                  {r.ap || "–"} · {r.loai_dat_truoc || "–"} ·{" "}
                  <span className="font-mono tabular-nums">
                    {r.dien_tich_truoc != null ? r.dien_tich_truoc.toLocaleString("vi-VN") : "–"} m²
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Nhận {formatDateDisplay(r.ngay_nhan) || "–"} · Trả {formatDateDisplay(r.ngay_tra) || "–"}
                </div>
              </div>
              <span
                className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${BADGE_CLS[status]}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${BADGE_DOT[status]}`} />
                {TRANG_THAI_LABEL[status]}
              </span>
            </div>
          </button>
        );
      })}

      {editing && (
        <EditRowSheet
          row={editing}
          customFields={customFields}
          canEdit={canEdit}
          onClose={() => setEditing(null)}
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
