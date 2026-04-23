import { prisma } from "@/lib/db";
import UsersTable from "@/app/admin/users/table";

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

