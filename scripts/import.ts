import { config } from "dotenv";
import path from "node:path";
import XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

config({ path: path.join(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SECRET_KEY trong .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const SOURCE_DIR = "D:\\Sáng kiến kinh nghiệm 2026";

type SourceFile = {
  path: string;
  sheet: string;
  nam: number;
};

const SOURCES: SourceFile[] = [
  { path: path.join(SOURCE_DIR, "1. Danh sách CMĐ 2025.xls"), sheet: "TAN THOI", nam: 2025 },
  { path: path.join(SOURCE_DIR, "2. Danh sách CMĐ 6-2026.xls"), sheet: "Tân Thới", nam: 2026 },
];

// ---------- Chuẩn hoá tên ấp ----------
// Chỉ sửa các lỗi định dạng rõ ràng đã khảo sát trong 2 file nguồn: chữ dính
// liền ("TânHương" -> "Tân Hương"), khoảng trắng thừa, và đuôi " xã ..." bị
// dính vào tên ấp khi không có dấu phẩy. KHÔNG dùng khớp mờ bỏ dấu vì "Tân
// Thành" và "Tân Thạnh" là 2 ấp khác nhau nhưng trùng nhau khi bỏ dấu.
function normalizeAp(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let s = raw.toString().trim();
  if (!s) return null;
  // chỉ lấy phần trước dấu phẩy đầu tiên (bỏ "xã Tân Thới" phía sau nếu có)
  s = s.split(",")[0].trim();
  const isKhuPho = /^khu\s*ph[oốồổỗộ]/i.test(s);
  const isPhuong = /^(p\.|phường)\s*/i.test(s);
  let name = s
    .replace(/^ấp\s*/i, "")
    .replace(/^khu\s*ph[oốồổỗộ]\s*/i, "")
    .replace(/^(p\.|phường)\s*/i, "")
    .trim();
  // bỏ đuôi " xã ..." nếu dính liền không có dấu phẩy, vd "Tân Hiệp xã Tân Thới"
  name = name.replace(/\s+x[aã]\s+.*$/i, "").trim();
  // gộp nhiều khoảng trắng liên tiếp thành 1
  name = name.replace(/\s+/g, " ").trim();
  // tách chữ "Tân" dính liền với từ theo sau, vd "TânHương" -> "Tân Hương"
  name = name.replace(/^Tân(?=\S)/, "Tân ");

  if (isKhuPho) return `Khu phố ${name}`.trim();
  if (isPhuong) return `P. ${name}`.trim();
  return name || null;
}

// ---------- Chuẩn hoá diện tích (số kiểu VN: "538,1" hoặc "1.252,8") ----------
function parseArea(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return val;
  let s = String(val).trim();
  if (!s) return null;
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    s = s.replace(",", ".");
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

// ---------- Chuẩn hoá ngày (dd/M/yyyy, d/M/yyyy, Date object, yyyy-mm-dd) ----------
function parseDateVal(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }
  const s = String(val).trim();
  if (!s) return null;
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const dmyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

function cleanText(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).replace(/\r?\n/g, " ").trim();
  return s === "" ? null : s;
}

function cleanLoaiDatTruoc(val: unknown): string | null {
  const s = cleanText(val);
  if (!s) return null;
  // 1 số dòng bị dính giá trị "sau CMĐ" vào cột "trước", vd "CLN+ONT" hoặc
  // "CLN+ONT\n (ONT 100)" -> chỉ lấy mã đầu tiên làm loại đất trước, đã log cảnh báo khi import
  const primary = s.split("+")[0].trim();
  return primary || s;
}

type HoSoRow = {
  stt: number | null;
  ho_ten: string | null;
  dia_chi_noi_o: string | null;
  ap: string | null;
  dia_chi_thua_dat: string | null;
  to_ban_do: string | null;
  thua_dat_truoc: string | null;
  loai_dat_truoc: string | null;
  dien_tich_truoc: number | null;
  thua_dat_sau: string | null;
  dien_tich_sau_cln: number | null;
  dien_tich_sau_ont: number | null;
  dien_tich_sau_nts: number | null;
  ngay_nhan: string | null;
  ngay_tra: string | null;
  ghi_chu: string | null;
  gcn_so_seri: string | null;
  gcn_so_giay: string | null;
  so_dien_thoai: string | null;
  nam: number;
};

function parseSheet(source: SourceFile): { rows: HoSoRow[]; warnings: string[] } {
  const workbook = XLSX.readFile(source.path, { cellDates: true });
  const sheet = workbook.Sheets[source.sheet];
  if (!sheet) {
    throw new Error(`Không tìm thấy sheet "${source.sheet}" trong ${source.path}`);
  }
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  const headerRowIdx = raw.findIndex((r) => String(r?.[0] ?? "").trim() === "STT");
  if (headerRowIdx === -1) {
    throw new Error(`Không tìm thấy dòng header "STT" trong ${source.path}`);
  }

  const totalCols = raw[headerRowIdx].length;
  const has21Cols = totalCols >= 21; // file 2026: có thêm cột NTS sau + SĐT

  const rows: HoSoRow[] = [];
  const warnings: string[] = [];

  // Dòng nối tiếp (cùng 1 người xin nhiều thửa trong 1 hồ sơ) thường để trống
  // họ tên/địa chỉ -> kế thừa (forward-fill) giá trị của dòng liền trước.
  let lastHoTen: string | null = null;
  let lastDiaChiNoiO: string | null = null;
  let lastDiaChiThuaDat: string | null = null;

  for (let i = headerRowIdx + 1; i < raw.length; i++) {
    const r = raw[i];
    const sttRaw = r?.[0];
    if (sttRaw === null || sttRaw === undefined || sttRaw === "") continue;
    const stt = Number(sttRaw);
    if (!Number.isFinite(stt)) continue; // bỏ dòng "TỔNG CỘNG" và header phụ

    let hoTen = cleanText(r[1]);
    let diaChiNoiO = cleanText(r[2]);
    let diaChiThuaDat = cleanText(r[3]);
    const isContinuation = !hoTen && !diaChiThuaDat;
    if (isContinuation) {
      hoTen = lastHoTen;
      diaChiNoiO = lastDiaChiNoiO;
      diaChiThuaDat = lastDiaChiThuaDat;
    } else {
      lastHoTen = hoTen;
      lastDiaChiNoiO = diaChiNoiO;
      lastDiaChiThuaDat = diaChiThuaDat;
    }

    const col = (idx21: number, idx19: number): unknown => (has21Cols ? r[idx21] : r[idx19]);

    const loaiDatTruocRaw = col(6, 6);
    const loaiDatTruoc = cleanLoaiDatTruoc(loaiDatTruocRaw);
    if (loaiDatTruoc && loaiDatTruocRaw && String(loaiDatTruocRaw).includes("+")) {
      warnings.push(
        `STT ${stt} (${source.path}): loại đất trước bị dính giá trị "sau CMĐ" (${String(
          loaiDatTruocRaw
        ).replace(/\n/g, " ")}) -> lấy "${loaiDatTruoc}", cần rà soát lại.`
      );
    }

    const row: HoSoRow = {
      stt,
      ho_ten: hoTen,
      dia_chi_noi_o: diaChiNoiO,
      ap: normalizeAp(diaChiThuaDat),
      dia_chi_thua_dat: diaChiThuaDat,
      thua_dat_truoc: cleanText(col(4, 4)),
      to_ban_do: cleanText(col(5, 5)),
      loai_dat_truoc: loaiDatTruoc,
      dien_tich_truoc: parseArea(col(7, 7)),
      thua_dat_sau: cleanText(col(8, 8)),
      dien_tich_sau_cln: parseArea(col(9, 9)),
      dien_tich_sau_ont: parseArea(col(10, 10)),
      dien_tich_sau_nts: has21Cols ? parseArea(r[11]) : null,
      ngay_nhan: parseDateVal(col(12, 11)),
      ngay_tra: parseDateVal(col(13, 12)),
      ghi_chu: cleanText(col(14, 13)),
      gcn_so_seri: cleanText(col(15, 15)),
      gcn_so_giay: cleanText(col(16, 16)),
      so_dien_thoai: has21Cols ? cleanText(r[17]) : null,
      nam: source.nam,
    };

    if (isContinuation) {
      warnings.push(`STT ${stt} (${source.path}): dòng nối tiếp, đã kế thừa họ tên/địa chỉ từ dòng trên.`);
    }
    if (row.dien_tich_truoc === null) {
      warnings.push(`STT ${stt} (${source.path}): thiếu diện tích trước CMĐ.`);
    }

    rows.push(row);
  }

  return { rows, warnings };
}

async function main() {
  let allRows: HoSoRow[] = [];
  let allWarnings: string[] = [];

  for (const source of SOURCES) {
    console.log(`Đang đọc: ${source.path} (sheet "${source.sheet}", năm ${source.nam})`);
    const { rows, warnings } = parseSheet(source);
    console.log(`  -> ${rows.length} dòng hợp lệ.`);
    allRows = allRows.concat(rows);
    allWarnings = allWarnings.concat(warnings);
  }

  console.log(`\nTổng cộng: ${allRows.length} hồ sơ sẽ được import.`);
  if (allWarnings.length > 0) {
    console.log(`\n${allWarnings.length} cảnh báo cần rà soát:`);
    for (const w of allWarnings) console.log(`  - ${w}`);
  }

  const apCounts = new Map<string, number>();
  for (const row of allRows) {
    const key = row.ap ?? "(không xác định)";
    apCounts.set(key, (apCounts.get(key) ?? 0) + 1);
  }
  console.log("\nSố hồ sơ theo ấp:");
  for (const [ap, count] of [...apCounts.entries()].sort()) {
    console.log(`  ${ap}: ${count}`);
  }

  if (process.env.DRY_RUN === "1") {
    console.log("\nDRY_RUN=1: dừng lại ở đây, không ghi vào Supabase.");
    return;
  }

  console.log("\nXoá dữ liệu cũ trong bảng ho_so (nếu có) trước khi import lại...");
  const { error: delErr } = await supabase.from("ho_so").delete().not("id", "is", null);
  if (delErr) {
    console.error("Lỗi khi xoá dữ liệu cũ:", delErr.message);
    process.exit(1);
  }

  const CHUNK = 50;
  let inserted = 0;
  for (let i = 0; i < allRows.length; i += CHUNK) {
    const chunk = allRows.slice(i, i + CHUNK);
    const { error } = await supabase.from("ho_so").insert(chunk);
    if (error) {
      console.error(`Lỗi khi insert chunk ${i}-${i + chunk.length}:`, error.message);
      process.exit(1);
    }
    inserted += chunk.length;
    console.log(`  Đã import ${inserted}/${allRows.length}`);
  }

  console.log("\nHoàn tất import.");
}

main().catch((err) => {
  console.error("Import thất bại:", err);
  process.exit(1);
});
