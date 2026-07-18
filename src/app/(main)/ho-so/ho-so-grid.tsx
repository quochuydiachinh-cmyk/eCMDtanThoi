"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type CellValueChangedEvent,
  type ColDef,
  type GridApi,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";
import { CustomFieldDef, HoSo, TRANG_THAI_LABEL, TrangThai } from "@/lib/types";
import { tinhTrangThai } from "@/lib/status";
import { formatDateDisplay, parseDateInput } from "@/lib/dates";
import AddColumnDialog from "./add-column-dialog";

ModuleRegistry.registerModules([AllCommunityModule]);

const YEARS = [2026, 2025];

const NUMERIC_FIELDS = new Set<keyof HoSo>([
  "stt",
  "dien_tich_truoc",
  "dien_tich_sau_cln",
  "dien_tich_sau_ont",
  "dien_tich_sau_nts",
]);

const DATE_FIELDS = new Set<keyof HoSo>(["ngay_nhan", "ngay_tra"]);

const TRANG_THAI_BADGE: Record<TrangThai, string> = {
  da_tra: "bg-emerald-100 text-emerald-700",
  tre_han: "bg-red-100 text-red-700",
  dang_xu_ly: "bg-amber-100 text-amber-700",
};

function TrangThaiCellRenderer({ value }: { value: TrangThai | null }) {
  if (!value) return null;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TRANG_THAI_BADGE[value]}`}>
      {TRANG_THAI_LABEL[value]}
    </span>
  );
}

type Filters = {
  ap: string;
  loaiDat: string;
  trangThai: string;
  tbd: string;
  search: string;
};

const EMPTY_FILTERS: Filters = { ap: "", loaiDat: "", trangThai: "", tbd: "", search: "" };

export default function HoSoGrid() {
  const [selectedYear, setSelectedYear] = useState<number>(YEARS[0]);
  const [rows, setRows] = useState<HoSo[]>([]);
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const gridApiRef = useRef<GridApi<HoSo> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("ho_so")
        .select("*")
        .eq("nam", selectedYear)
        .order("stt", { ascending: true });
      if (!cancelled) {
        if (error) console.error(error);
        setRows((data ?? []) as HoSo[]);
        setFilters(EMPTY_FILTERS);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedYear]);

  useEffect(() => {
    async function loadDefs() {
      const supabase = createClient();
      const { data } = await supabase
        .from("custom_field_defs")
        .select("*")
        .order("display_order", { ascending: true });
      setCustomFields((data ?? []) as CustomFieldDef[]);
    }
    loadDefs();
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

  const filteredRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filters.ap && r.ap !== filters.ap) return false;
      if (filters.loaiDat && r.loai_dat_truoc !== filters.loaiDat) return false;
      if (filters.tbd && r.to_ban_do !== filters.tbd) return false;
      if (filters.trangThai && tinhTrangThai(r) !== filters.trangThai) return false;
      if (search) {
        const haystack = `${r.ho_ten ?? ""} ${r.dia_chi_noi_o ?? ""} ${r.dia_chi_thua_dat ?? ""}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }, [rows, filters]);

  const persistCell = useCallback(async (id: string, payload: Record<string, unknown>) => {
    const supabase = createClient();
    const { error } = await supabase.from("ho_so").update(payload).eq("id", id);
    if (error) {
      alert("Lưu thất bại: " + error.message);
    }
  }, []);

  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent<HoSo>) => {
      const colId = event.column.getColId();
      const row = event.data;
      if (!row) return;

      if (colId.startsWith("custom_")) {
        persistCell(row.id, { custom_fields: row.custom_fields });
        return;
      }

      const field = event.colDef.field as keyof HoSo | undefined;
      if (!field) return;
      let value: unknown = event.newValue;

      if (NUMERIC_FIELDS.has(field)) {
        value = value === "" || value === null || value === undefined ? null : Number(value);
        if (typeof value === "number" && Number.isNaN(value)) value = null;
      } else if (DATE_FIELDS.has(field)) {
        value = parseDateInput(value as string);
      } else if (value === "") {
        value = null;
      }

      (row as unknown as Record<string, unknown>)[field] = value;
      persistCell(row.id, { [field]: value });
    },
    [persistCell]
  );

  const handleAddRow = useCallback(async () => {
    const supabase = createClient();
    const nextStt = rows.reduce((max, r) => Math.max(max, r.stt ?? 0), 0) + 1;
    const { data, error } = await supabase
      .from("ho_so")
      .insert({ nam: selectedYear, stt: nextStt, custom_fields: {} })
      .select()
      .single();
    if (error) {
      alert("Thêm dòng thất bại: " + error.message);
      return;
    }
    setRows((prev) => [...prev, data as HoSo]);
  }, [rows, selectedYear]);

  const handleDeleteRow = useCallback(async (row: HoSo) => {
    if (!window.confirm(`Xoá hồ sơ của "${row.ho_ten ?? "(chưa có tên)"}"? Không thể hoàn tác.`)) {
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("ho_so").delete().eq("id", row.id);
    if (error) {
      alert("Xoá thất bại: " + error.message);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  }, []);

  const handleExport = useCallback(() => {
    const header = [
      "id",
      "STT",
      "Họ và tên",
      "Địa chỉ nơi ở",
      "Ấp",
      "Địa chỉ thửa đất",
      "Tờ bản đồ",
      "Thửa (trước)",
      "Loại đất (trước)",
      "Diện tích trước (m2)",
      "Thửa (sau)",
      "CLN sau (m2)",
      "ONT sau (m2)",
      "NTS sau (m2)",
      "Ngày nhận",
      "Ngày trả",
      "Trạng thái",
      "Ghi chú",
      "Số Seri GCN",
      "Số giấy GCN",
      "Số điện thoại",
      ...customFields.map((c) => c.label),
    ];
    const data = filteredRows.map((r) => [
      r.id,
      r.stt,
      r.ho_ten,
      r.dia_chi_noi_o,
      r.ap,
      r.dia_chi_thua_dat,
      r.to_ban_do,
      r.thua_dat_truoc,
      r.loai_dat_truoc,
      r.dien_tich_truoc,
      r.thua_dat_sau,
      r.dien_tich_sau_cln,
      r.dien_tich_sau_ont,
      r.dien_tich_sau_nts,
      formatDateDisplay(r.ngay_nhan),
      formatDateDisplay(r.ngay_tra),
      TRANG_THAI_LABEL[tinhTrangThai(r)],
      r.ghi_chu,
      r.gcn_so_seri,
      r.gcn_so_giay,
      r.so_dien_thoai,
      ...customFields.map((c) => r.custom_fields?.[c.key] ?? ""),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Nam ${selectedYear}`);
    XLSX.writeFile(wb, `ho-so-chuyen-muc-dich-${selectedYear}.xlsx`);
  }, [filteredRows, customFields, selectedYear]);

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

      const supabase = createClient();
      let updated = 0;
      let inserted = 0;
      for (const item of json) {
        const id = item["id"] as string | null;
        const payload: Record<string, unknown> = {
          stt: item["STT"] ?? null,
          ho_ten: item["Họ và tên"] ?? null,
          dia_chi_noi_o: item["Địa chỉ nơi ở"] ?? null,
          ap: item["Ấp"] ?? null,
          dia_chi_thua_dat: item["Địa chỉ thửa đất"] ?? null,
          to_ban_do: item["Tờ bản đồ"] ?? null,
          thua_dat_truoc: item["Thửa (trước)"] ?? null,
          loai_dat_truoc: item["Loại đất (trước)"] ?? null,
          dien_tich_truoc: item["Diện tích trước (m2)"] ?? null,
          thua_dat_sau: item["Thửa (sau)"] ?? null,
          dien_tich_sau_cln: item["CLN sau (m2)"] ?? null,
          dien_tich_sau_ont: item["ONT sau (m2)"] ?? null,
          dien_tich_sau_nts: item["NTS sau (m2)"] ?? null,
          ngay_nhan: parseDateInput(item["Ngày nhận"] as string),
          ngay_tra: parseDateInput(item["Ngày trả"] as string),
          ghi_chu: item["Ghi chú"] ?? null,
          gcn_so_seri: item["Số Seri GCN"] ?? null,
          gcn_so_giay: item["Số giấy GCN"] ?? null,
          so_dien_thoai: item["Số điện thoại"] ?? null,
          nam: selectedYear,
        };

        if (id) {
          const { error } = await supabase.from("ho_so").update(payload).eq("id", id);
          if (!error) updated += 1;
        } else {
          const { error } = await supabase.from("ho_so").insert(payload);
          if (!error) inserted += 1;
        }
      }

      alert(`Import xong: cập nhật ${updated} dòng, thêm mới ${inserted} dòng.`);
      e.target.value = "";
      const { data } = await supabase.from("ho_so").select("*").eq("nam", selectedYear).order("stt");
      setRows((data ?? []) as HoSo[]);
    },
    [selectedYear]
  );

  const columnDefs = useMemo<ColDef<HoSo>[]>(() => {
    const fixed: ColDef<HoSo>[] = [
      {
        colId: "actions",
        headerName: "",
        width: 44,
        pinned: "left",
        editable: false,
        sortable: false,
        filter: false,
        resizable: false,
        cellRenderer: (p: { data?: HoSo }) =>
          p.data ? (
            <button
              onClick={() => handleDeleteRow(p.data as HoSo)}
              title="Xoá hồ sơ"
              className="text-red-400 hover:text-red-600 font-bold"
            >
              ✕
            </button>
          ) : null,
      },
      { field: "stt", headerName: "STT", width: 70, editable: true, pinned: "left" },
      { field: "ho_ten", headerName: "Họ và tên", width: 170, editable: true, pinned: "left" },
      { field: "dia_chi_noi_o", headerName: "Địa chỉ nơi ở", width: 200, editable: true },
      { field: "ap", headerName: "Ấp", width: 120, editable: true },
      { field: "dia_chi_thua_dat", headerName: "Địa chỉ thửa đất", width: 200, editable: true },
      { field: "to_ban_do", headerName: "TBĐ", width: 80, editable: true },
      { field: "thua_dat_truoc", headerName: "Thửa (trước)", width: 110, editable: true },
      { field: "loai_dat_truoc", headerName: "Loại đất (trước)", width: 120, editable: true },
      { field: "dien_tich_truoc", headerName: "DT trước (m²)", width: 120, editable: true },
      { field: "thua_dat_sau", headerName: "Thửa (sau)", width: 100, editable: true },
      { field: "dien_tich_sau_cln", headerName: "CLN sau (m²)", width: 110, editable: true },
      { field: "dien_tich_sau_ont", headerName: "ONT sau (m²)", width: 110, editable: true },
      { field: "dien_tich_sau_nts", headerName: "NTS sau (m²)", width: 110, editable: true },
      {
        field: "ngay_nhan",
        headerName: "Ngày nhận",
        width: 110,
        editable: true,
        valueFormatter: (p) => formatDateDisplay(p.value),
      },
      {
        field: "ngay_tra",
        headerName: "Ngày trả",
        width: 110,
        editable: true,
        valueFormatter: (p) => formatDateDisplay(p.value),
      },
      {
        colId: "trang_thai",
        headerName: "Trạng thái",
        width: 130,
        editable: false,
        valueGetter: (p) => (p.data ? tinhTrangThai(p.data) : null),
        cellRenderer: TrangThaiCellRenderer,
      },
      { field: "ghi_chu", headerName: "Ghi chú", width: 220, editable: true },
      { field: "gcn_so_seri", headerName: "Số Seri GCN", width: 110, editable: true },
      { field: "gcn_so_giay", headerName: "Số giấy GCN", width: 110, editable: true },
      { field: "so_dien_thoai", headerName: "Số điện thoại", width: 120, editable: true },
    ];

    const dynamic: ColDef<HoSo>[] = customFields.map((def) => ({
      colId: `custom_${def.key}`,
      headerName: def.label,
      width: 140,
      editable: true,
      valueGetter: (p) => p.data?.custom_fields?.[def.key] ?? null,
      valueSetter: (p) => {
        if (!p.data.custom_fields) p.data.custom_fields = {};
        p.data.custom_fields[def.key] = p.newValue;
        return true;
      },
    }));

    return [...fixed, ...dynamic];
  }, [customFields, handleDeleteRow]);

  return (
    <div className="max-w-[1600px] mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {YEARS.map((y) => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-md border-b-2 transition ${
                selectedYear === y
                  ? "border-blue-600 text-blue-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Năm {y}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddRow}
            className="text-xs font-semibold px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
          >
            + Thêm dòng
          </button>
          <button
            onClick={() => setShowAddColumn(true)}
            className="text-xs font-semibold px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-800 text-white"
          >
            + Thêm cột
          </button>
          <button
            onClick={handleExport}
            className="text-xs font-semibold px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Xuất Excel
          </button>
          <button
            onClick={handleImportClick}
            className="text-xs font-semibold px-3 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white"
          >
            Nhập Excel
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="grid grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Ấp</label>
            <select
              value={filters.ap}
              onChange={(e) => setFilters((f) => ({ ...f, ap: e.target.value }))}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs"
            >
              <option value="">-- Tất cả --</option>
              {apOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Loại đất (trước)</label>
            <select
              value={filters.loaiDat}
              onChange={(e) => setFilters((f) => ({ ...f, loaiDat: e.target.value }))}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs"
            >
              <option value="">-- Tất cả --</option>
              {loaiDatOptions.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Tờ bản đồ</label>
            <select
              value={filters.tbd}
              onChange={(e) => setFilters((f) => ({ ...f, tbd: e.target.value }))}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs"
            >
              <option value="">-- Tất cả --</option>
              {tbdOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Trạng thái</label>
            <select
              value={filters.trangThai}
              onChange={(e) => setFilters((f) => ({ ...f, trangThai: e.target.value }))}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs"
            >
              <option value="">-- Tất cả --</option>
              {Object.entries(TRANG_THAI_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Tìm kiếm</label>
            <input
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Họ tên, địa chỉ..."
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-2">
        <p className="text-xs text-slate-500 px-2 pb-2">
          {loading ? "Đang tải..." : `${filteredRows.length} / ${rows.length} hồ sơ`}
        </p>
        <div style={{ height: "calc(100vh - 340px)", minHeight: 400 }}>
          <AgGridReact<HoSo>
            theme={themeQuartz}
            rowData={filteredRows}
            columnDefs={columnDefs}
            defaultColDef={{ resizable: true, sortable: true, filter: true }}
            getRowId={(p) => p.data.id}
            onCellValueChanged={onCellValueChanged}
            onGridReady={(p) => (gridApiRef.current = p.api)}
            singleClickEdit
            stopEditingWhenCellsLoseFocus
          />
        </div>
      </div>

      <AddColumnDialog
        open={showAddColumn}
        customFields={customFields}
        onClose={() => setShowAddColumn(false)}
        onCreated={(def) => setCustomFields((prev) => [...prev, def])}
        onDeleted={(id) => setCustomFields((prev) => prev.filter((c) => c.id !== id))}
      />
    </div>
  );
}
