import { HoSo, TrangThai } from "./types";

/**
 * Trạng thái tính động, không lưu cứng trong DB:
 * - có ngày trả -> Đã trả kết quả
 * - chưa có ngày trả và quá `overdueDays` ngày kể từ ngày nhận -> Trễ hạn
 * - còn lại -> Đang xử lý
 *
 * `overdueDays` mặc định 20 ngày là giả định tạm, không phải số liệu pháp lý
 * chính xác - có thể chỉnh trong trang cài đặt.
 */
export function tinhTrangThai(row: Pick<HoSo, "ngay_nhan" | "ngay_tra">, overdueDays = 20): TrangThai {
  if (row.ngay_tra) return "da_tra";
  if (!row.ngay_nhan) return "dang_xu_ly";
  const ngayNhan = new Date(row.ngay_nhan);
  const now = new Date();
  const soNgay = Math.floor((now.getTime() - ngayNhan.getTime()) / (1000 * 60 * 60 * 24));
  return soNgay > overdueDays ? "tre_han" : "dang_xu_ly";
}
