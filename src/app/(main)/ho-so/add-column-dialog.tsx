"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CustomFieldDef, CustomFieldType } from "@/lib/types";

function slugify(label: string): string {
  return label
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "cot";
}

const DATA_TYPE_LABEL: Record<CustomFieldType, string> = {
  text: "Văn bản",
  number: "Số",
  date: "Ngày",
};

export default function AddColumnDialog({
  open,
  customFields,
  onClose,
  onCreated,
  onDeleted,
}: {
  open: boolean;
  customFields: CustomFieldDef[];
  onClose: () => void;
  onCreated: (def: CustomFieldDef) => void;
  onDeleted: (id: string) => void;
}) {
  const [label, setLabel] = useState("");
  const [dataType, setDataType] = useState<CustomFieldType>("text");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const existingKeys = customFields.map((c) => c.key);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    setError(null);

    let key = slugify(label);
    let suffix = 1;
    while (existingKeys.includes(key)) {
      key = `${slugify(label)}_${suffix}`;
      suffix += 1;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("custom_field_defs")
      .insert({ key, label: label.trim(), data_type: dataType, display_order: existingKeys.length })
      .select()
      .single();

    setSaving(false);
    if (error) {
      setError("Không thêm được cột: " + error.message);
      return;
    }
    onCreated(data as CustomFieldDef);
    setLabel("");
    setDataType("text");
  }

  async function handleDelete(def: CustomFieldDef) {
    if (!window.confirm(`Xoá cột "${def.label}"? Dữ liệu đã nhập trong cột này sẽ không còn hiển thị.`)) {
      return;
    }
    setDeletingId(def.id);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("custom_field_defs").delete().eq("id", def.id);
    setDeletingId(null);
    if (error) {
      setError("Không xoá được cột: " + error.message);
      return;
    }
    onDeleted(def.id);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
        <h2 className="text-sm font-bold text-slate-800 mb-4">Quản lý cột tự thêm</h2>

        {customFields.length > 0 && (
          <div className="mb-5 border border-slate-200 rounded-md divide-y divide-slate-100">
            {customFields.map((def) => (
              <div key={def.id} className="flex items-center justify-between px-3 py-2">
                <div>
                  <div className="text-sm text-slate-800">{def.label}</div>
                  <div className="text-[11px] text-slate-400">{DATA_TYPE_LABEL[def.data_type]}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(def)}
                  disabled={deletingId === def.id}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {deletingId === def.id ? "Đang xoá..." : "Xoá"}
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Tên cột mới
            </label>
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Vd: Người phụ trách"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Kiểu dữ liệu
            </label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value as CustomFieldType)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="text">Văn bản</option>
              <option value="number">Số</option>
              <option value="date">Ngày</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-4 py-2 rounded-md text-slate-600 hover:bg-slate-100"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={saving || !label.trim()}
              className="text-sm px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold"
            >
              {saving ? "Đang lưu..." : "Thêm cột"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
