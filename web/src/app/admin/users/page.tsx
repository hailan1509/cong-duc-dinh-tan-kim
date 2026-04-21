import Link from "next/link";
import { prisma } from "@/lib/db";
import AdminLogoutButton from "../AdminLogoutButton";
import UsersTable from "./table";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
    select: { id: true, username: true, role: true, createdAt: true },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Quản lý user</div>
            <div className="text-sm text-slate-600">Tạo user, reset mật khẩu, xoá user</div>
          </div>
          <div className="flex gap-2">
            <AdminLogoutButton />
            <Link className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50" href="/admin/cong-duc">
              Quản trị công đức
            </Link>
            <Link className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50" href="/admin/ngay-le">
              Ngày lễ
            </Link>
          </div>
        </div>
      </div>

      <UsersTable
        initial={users.map((u) => ({
          id: u.id,
          username: u.username,
          role: u.role,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}

