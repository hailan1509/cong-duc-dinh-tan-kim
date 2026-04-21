# Công đức đình Tân Kim

## Chức năng

- Danh sách công đức theo **ngày lễ công đức**
- Thêm công đức (tên, **địa chỉ**, số tiền, ghi chú)
- Quản trị danh sách công đức (xoá)
- Quản lý ngày lễ công đức (tên lễ, ngày bắt đầu, ngày kết thúc, năm)

## Chạy local (không Docker)

Yêu cầu: Node 20+, MySQL.

1) Tạo DB `cong_duc_dinh_tan_kim_db` và cập nhật `web/.env` (Prisma) + `web/.env.local` (Next.js) nếu cần
2) Chạy:

```bash
cd web
npm i
npx prisma db push
npm run dev
```

Mở `http://localhost:3000`.

## Deploy bằng Docker + Nginx

```bash
docker compose up -d --build
```

- Web: `http://localhost`
- MySQL: dùng server DB từ `DATABASE_URL` (database: `cong_duc_dinh_tan_kim_db`)

### Admin

- Vào `http://localhost/admin/cong-duc`
- Login dùng bảng `users` (trang: `/admin/login`). Bạn có thể quản lý user tại `/admin/users`.

