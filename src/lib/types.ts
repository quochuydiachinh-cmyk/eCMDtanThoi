export type HoSo = {
  id: string;
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
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CustomFieldType = "text" | "number" | "date";

export type CustomFieldDef = {
  id: string;
  key: string;
  label: string;
  data_type: CustomFieldType;
  display_order: number;
};

export type TrangThai = "da_tra" | "tre_han" | "dang_xu_ly";

export const TRANG_THAI_LABEL: Record<TrangThai, string> = {
  da_tra: "Đã trả kết quả",
  tre_han: "Trễ hạn",
  dang_xu_ly: "Đang xử lý",
};
