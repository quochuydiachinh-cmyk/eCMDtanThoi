"use client";

import { useState } from "react";
import { CustomFieldDef, HoSo, TRANG_THAI_LABEL } from "@/lib/types";
import { tinhTrangThai } from "@/lib/status";
import { normalizeAp } from "@/lib/ap";

const inputCls =
  "w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

export default function EditRowSheet({
  row,
  customFields,
  canEdit,
  onClose,
  onSave,
  onDelete,
}: {
  row: HoSo;
  customFields: CustomFieldDef[];
  canEdit: boolean;
  onClose: () => void;
  onSave: (row: HoSo) => Promise<boolean>;
  onDelete: (row: HoSo) => void;
}) {
  const [form, setForm] = useState<HoSo>(row);
  const [saving, setSaving] = useState(false);

  function setField<K extends keyof HoSo>(key: K, value: HoSo[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function setCustom(key: string, value: unknown) {
    setForm((f) => ({ ...f, custom_fields: { ...f.custom_fields, [key]: value } }));
  }

  async function handleSave() {
    setSaving(true);
    const ok = await onSave(form);
    setSaving(false);
    if (ok) onClose();
  }

  const trangThai = tinhTrangThai(form);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl max-h-[92vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-800">Hồ sơ STT {form.stt ?? "-"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">
            ✕
          </button>
        </div>

        <span className="inline-block mb-4 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
          {TRANG_THAI_LABEL[trangThai]}
        </span>

        <fieldset disabled={!canEdit} className="space-y-3">
          <Field label="Họ và tên">
            <input className={inputCls} value={form.ho_ten ?? ""} onChange={(e) => setField("ho_ten", e.target.value)} />
          </Field>
          <Field label="Địa chỉ nơi ở">
            <input
              className={inputCls}
              value={form.dia_chi_noi_o ?? ""}
              onChange={(e) => setField("dia_chi_noi_o", e.target.value)}
            />
          </Field>
          <Field label="Địa chỉ thửa đất">
            <input
              className={inputCls}
              value={form.dia_chi_thua_dat ?? ""}
              onChange={(e) => {
                setField("dia_chi_thua_dat", e.target.value);
                setField("ap", normalizeAp(e.target.value));
              }}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tờ bản đồ">
              <input className={inputCls} value={form.to_ban_do ?? ""} onChange={(e) => setField("to_ban_do", e.target.value)} />
            </Field>
            <Field label="Thửa (trước)">
              <input
                className={inputCls}
                value={form.thua_dat_truoc ?? ""}
                onChange={(e) => setField("thua_dat_truoc", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Loại đất (trước)">
              <input
                className={inputCls}
                value={form.loai_dat_truoc ?? ""}
                onChange={(e) => setField("loai_dat_truoc", e.target.value)}
              />
            </Field>
            <Field label="DT trước (m²)">
              <input
                type="number"
                step="0.1"
                className={inputCls}
                value={form.dien_tich_truoc ?? ""}
                onChange={(e) => setField("dien_tich_truoc", e.target.value === "" ? null : Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="Thửa (sau)">
            <input className={inputCls} value={form.thua_dat_sau ?? ""} onChange={(e) => setField("thua_dat_sau", e.target.value)} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="CLN sau (m²)">
              <input
                type="number"
                step="0.1"
                className={inputCls}
                value={form.dien_tich_sau_cln ?? ""}
                onChange={(e) => setField("dien_tich_sau_cln", e.target.value === "" ? null : Number(e.target.value))}
              />
            </Field>
            <Field label="ONT sau (m²)">
              <input
                type="number"
                step="0.1"
                className={inputCls}
                value={form.dien_tich_sau_ont ?? ""}
                onChange={(e) => setField("dien_tich_sau_ont", e.target.value === "" ? null : Number(e.target.value))}
              />
            </Field>
            <Field label="NTS sau (m²)">
              <input
                type="number"
                step="0.1"
                className={inputCls}
                value={form.dien_tich_sau_nts ?? ""}
                onChange={(e) => setField("dien_tich_sau_nts", e.target.value === "" ? null : Number(e.target.value))}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày nhận">
              <input
                type="date"
                className={inputCls}
                value={form.ngay_nhan ?? ""}
                onChange={(e) => setField("ngay_nhan", e.target.value || null)}
              />
            </Field>
            <Field label="Ngày trả">
              <input
                type="date"
                className={inputCls}
                value={form.ngay_tra ?? ""}
                onChange={(e) => setField("ngay_tra", e.target.value || null)}
              />
            </Field>
          </div>
          <Field label="Ghi chú">
            <textarea
              className={inputCls}
              rows={2}
              value={form.ghi_chu ?? ""}
              onChange={(e) => setField("ghi_chu", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Số Seri GCN">
              <input
                className={inputCls}
                value={form.gcn_so_seri ?? ""}
                onChange={(e) => setField("gcn_so_seri", e.target.value)}
              />
            </Field>
            <Field label="Số giấy GCN">
              <input
                className={inputCls}
                value={form.gcn_so_giay ?? ""}
                onChange={(e) => setField("gcn_so_giay", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Số điện thoại">
            <input
              className={inputCls}
              value={form.so_dien_thoai ?? ""}
              onChange={(e) => setField("so_dien_thoai", e.target.value)}
            />
          </Field>

          {customFields.map((def) => (
            <Field key={def.id} label={def.label}>
              <input
                type={def.data_type === "number" ? "number" : def.data_type === "date" ? "date" : "text"}
                className={inputCls}
                value={(form.custom_fields?.[def.key] as string | number | undefined) ?? ""}
                onChange={(e) =>
                  setCustom(
                    def.key,
                    def.data_type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value
                  )
                }
              />
            </Field>
          ))}
        </fieldset>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          {canEdit ? (
            <>
              <button
                onClick={() => {
                  onDelete(form);
                  onClose();
                }}
                className="text-xs font-semibold text-red-600 hover:text-red-700"
              >
                Xoá hồ sơ
              </button>
              <div className="flex gap-2">
                <button onClick={onClose} className="text-sm px-4 py-2 rounded-md text-slate-600 hover:bg-slate-100">
                  Huỷ
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-sm px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold"
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onClose}
              className="ml-auto text-sm px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
