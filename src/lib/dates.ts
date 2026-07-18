const VN_WEEKDAY = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];

/** Định dạng ngày kiểu "Thứ bảy, 18/07/2026" */
export function formatVietnameseDate(date: Date): string {
  const weekday = VN_WEEKDAY[date.getDay()];
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${weekday}, ${d}/${m}/${y}`;
}

/** Chuyển ISO "YYYY-MM-DD" -> hiển thị "dd/mm/yyyy" */
export function formatDateDisplay(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/** Chuyển chuỗi nhập "d/m/yyyy" hoặc "yyyy-mm-dd" -> ISO "YYYY-MM-DD", trả về null nếu không hợp lệ */
export function parseDateInput(value: string | null | undefined): string | null {
  if (!value) return null;
  const s = value.trim();
  if (!s) return null;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return s;
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}
