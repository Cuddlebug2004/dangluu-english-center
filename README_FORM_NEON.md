# Form đăng ký website → Neon

Form giao diện được giữ nguyên, không thêm trường mới.

Dữ liệu gửi lên `/api/register` gồm:

```json
{
  "parent": "Họ tên phụ huynh",
  "phone": "0978328610",
  "email": "email không bắt buộc",
  "course": "Cambridge Movers",
  "message": "Ghi chú"
}
```

Vercel Function đọc `DATABASE_URL` từ Environment Variables và lưu dữ liệu vào
bảng `website_registrations`.
