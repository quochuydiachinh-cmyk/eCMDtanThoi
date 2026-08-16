/**
 * Chuẩn hoá tên ấp từ chuỗi "Địa chỉ thửa đất" (vd "ấp Tân Xuân, xã Tân Thới" -> "Tân Xuân").
 * Chỉ sửa các lỗi định dạng rõ ràng: chữ dính liền ("TânHương" -> "Tân Hương"),
 * khoảng trắng thừa, và đuôi " xã ..." bị dính vào tên ấp khi không có dấu phẩy.
 * KHÔNG dùng khớp mờ bỏ dấu vì "Tân Thành" và "Tân Thạnh" là 2 ấp khác nhau nhưng
 * trùng nhau khi bỏ dấu. Dùng chung cho cả script import (scripts/import.ts) và
 * giao diện web (tự điền cột Ấp khi sửa Địa chỉ thửa đất).
 */
export function normalizeAp(raw: string | undefined | null): string | null {
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
