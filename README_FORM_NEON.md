# Kết nối form đăng ký với Neon

## 1. Chạy migration

Mở Neon SQL Editor và chạy:

`QuanLyNS/sql/migrations/006_website_registrations.sql`

## 2. Thêm biến môi trường trên Vercel

Vào **Project → Settings → Environment Variables** và thêm:

- Tên: `DATABASE_URL`
- Giá trị: chuỗi kết nối Neon đang dùng cho phần mềm quản lý
- Môi trường: Production, Preview và Development nếu cần

Không đưa chuỗi kết nối vào JavaScript phía trình duyệt hoặc Git.

Sau khi lưu biến môi trường, tạo deployment mới hoặc Redeploy.

## 3. Kiểm tra API

Mở:

`https://dangluu-english-center.vercel.app/api/register`

Kết quả mong đợi:

```json
{"result":"ok","service":"website-registration"}
```

Form dùng đường dẫn `/api/register`, vì vậy khi gắn tên miền riêng vào cùng dự án
Vercel sẽ không phải sửa URL.
