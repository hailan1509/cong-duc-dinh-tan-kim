import { ButtonLink, PageHeader } from "@/components/admin/ui";
import { IconPlus } from "@/components/admin/icons";
import { prisma } from "@/lib/db";
import FestivalAdminTable from "@/app/admin/ngay-le/table";

export const dynamic = "force-dynamic";

export default async function AdminFestivalsPage() {
  const festivals = await prisma.festival.findMany({
    orderBy: [{ year: "desc" }, { startDate: "desc" }],
    include: { _count: { select: { merits: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Ngày lễ công đức"
        description="Tạo ngày lễ để gắn công đức"
        crumbs={[{ label: "Quản trị", href: "/admin/cong-duc" }, { label: "Ngày lễ" }]}
        actions={
          <ButtonLink href="/admin/ngay-le/them">
            <IconPlus /> Thêm ngày lễ
          </ButtonLink>
        }
      />

      <FestivalAdminTable
        initial={festivals.map((f: (typeof festivals)[number]) => ({
          id: f.id,
          name: f.name,
          startDate: f.startDate.toISOString(),
          endDate: f.endDate.toISOString(),
          year: f.year,
          active: f.active,
          meritCount: f._count.merits,
        }))}
      />
    </div>
  );
}
