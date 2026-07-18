# Quản lý Hồ sơ Chuyển mục đích sử dụng đất – Xã Tân Thới

Web app thay thế 2 file Excel (`1. Danh sách CMĐ 2025.xls`, `2. Danh sách CMĐ 6-2026.xls`)
để: (1) xem/sửa/thêm cột dữ liệu trực tiếp trên web kiểu Excel, (2) dashboard thống kê
có filter/search theo ấp, loại đất, năm, diện tích, tờ bản đồ...

Stack: **Next.js (App Router) + Supabase (Postgres/Auth) + Vercel**.

## 1. Chạy ở máy local

### 1.1 Cài dependency

```bash
npm install
```

### 1.2 Cấu hình biến môi trường

File `.env.local` (đã có sẵn key Supabase, chỉ cần điền mật khẩu Postgres):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
DATABASE_URL=postgresql://postgres:<MẬT KHẨU DB>@db.<project-ref>.supabase.co:5432/postgres
```

Lấy mật khẩu Postgres tại **Supabase Dashboard → Project Settings → Database →
Connection string**.

### 1.3 Tạo schema (bảng `ho_so`, `custom_field_defs`, `settings`)

```bash
npm run migrate
```

Chạy 1 lần duy nhất (script tự bỏ qua nếu bảng đã tồn tại nhờ `create table if not exists`).

### 1.4 Import dữ liệu từ 2 file Excel gốc

```bash
npm run import
```

Script đọc trực tiếp 2 file trong `D:\Sáng kiến kinh nghiệm 2026\` (đường dẫn cố định
trong `scripts/import.ts`), chuẩn hoá dữ liệu, và **ghi đè toàn bộ** bảng `ho_so`
(xoá dữ liệu cũ rồi import lại) — chạy lại an toàn khi cần cập nhật lại từ Excel.
Muốn xem trước kết quả parse mà không ghi vào Supabase: `DRY_RUN=1 npm run import`.

### 1.5 Tạo tài khoản đăng nhập đầu tiên

Không có trang đăng ký công khai — tạo tài khoản bằng script:

```bash
npx tsx scripts/create-user.ts ban@example.com "MatKhauManh123"
```

### 1.6 Chạy dev server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) — sẽ tự chuyển tới `/login`.

## 2. Deploy lên Vercel

1. Đẩy code lên GitHub (hoặc GitLab/Bitbucket).
2. Vào [vercel.com/new](https://vercel.com/new), import repo vừa tạo.
3. Khai báo **Environment Variables** (Project Settings → Environment Variables),
   copy đúng 3 giá trị từ `.env.local` (không cần `DATABASE_URL` trên Vercel — chỉ
   dùng khi chạy migration/import từ máy local):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
4. Deploy. Vercel tự build bằng `npm run build`.
5. Sau khi có domain, đăng nhập bằng tài khoản đã tạo ở bước 1.5.

## 3. Cấu trúc chính

- `src/app/login` – đăng nhập (Supabase Auth), không có đăng ký công khai.
- `src/app/(main)/ho-so` – danh sách hồ sơ dạng lưới (AG Grid), có tab năm 2025/2026,
  sửa trực tiếp trên ô, nút "+ Thêm cột" để thêm trường tuỳ ý, filter/search, xuất/nhập Excel.
- `src/app/(main)/dashboard` – thống kê: thẻ số liệu, 4 biểu đồ (theo thời gian, loại đất
  trước/sau, theo ấp), bộ lọc (năm/ấp/loại đất/tờ bản đồ/trạng thái/khoảng ngày), bảng
  kết quả lọc.
- `src/proxy.ts` – bảo vệ toàn bộ route (trừ `/login`) bằng Supabase session.
- `scripts/migrate.ts`, `scripts/import.ts`, `scripts/create-user.ts` – công cụ vận hành,
  không phải một phần của web app khi deploy.

## 4. Ghi chú

- Trạng thái hồ sơ (Đang xử lý / Đã trả / Trễ hạn) tính động từ `ngay_nhan`/`ngay_tra`,
  ngưỡng trễ hạn mặc định 20 ngày làm việc (`src/lib/status.ts`) — đây là giả định tạm,
  chỉnh lại theo quy định thực tế nếu cần.
- Cột do người dùng tự thêm trên web ("+ Thêm cột") lưu trong `custom_field_defs` +
  cột `custom_fields` (jsonb) của bảng `ho_so`, không cần sửa schema.
