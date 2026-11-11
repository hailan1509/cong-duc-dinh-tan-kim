import { prisma } from "@/lib/db";
import UsersTable from "@/app/admin/users/table";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
    select: { id: true, username: true, role: true, createdAt: true },
  });

  return (
    <div>
      <PageHeader
        title="Người dùng"
        description="Tạo user, reset mật khẩu, xoá user"
        crumbs={[{ label: "Quản trị", href: "/admin/cong-duc" }, { label: "Người dùng" }]}
      />

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
