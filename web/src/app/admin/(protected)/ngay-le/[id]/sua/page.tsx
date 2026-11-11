import { ButtonLink, Card, PageHeader } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import FestivalForm from "@/app/admin/ngay-le/FestivalForm";
import { yyyyMmDd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EditFestivalPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const festivalId = Number(id);
  if (!Number.isFinite(festivalId)) {
    return (
      <Card>
        <div className="text-sm text-gray-600 dark:text-gray-400">ID không hợp lệ.</div>
      </Card>
    );
  }

  const festival = await prisma.festival.findUnique({ where: { id: festivalId } });
  if (!festival) {
    return (
      <Card>
        <div className="text-sm text-gray-600 dark:text-gray-400">Không tìm thấy ngày lễ.</div>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title="Sửa ngày lễ công đức"
        description={`${festival.name} (${yyyyMmDd(festival.startDate)} → ${yyyyMmDd(festival.endDate)}) - ${festival.year}`}
        crumbs={[{ label: "Ngày lễ", href: "/admin/ngay-le" }, { label: "Sửa" }]}
        actions={
          <ButtonLink href="/admin/ngay-le" variant="outline">
            Quay lại
          </ButtonLink>
        }
      />

      <Card className="max-w-3xl">
        <FestivalForm
          mode="edit"
          id={festival.id}
          initial={{
            name: festival.name,
            startDate: yyyyMmDd(festival.startDate),
            endDate: yyyyMmDd(festival.endDate),
            year: festival.year,
            active: festival.active,
          }}
        />
      </Card>
    </div>
  );
}
