import { prisma } from "@/lib/db";
import AddMeritForm from "./AddMeritForm";
import Link from "next/link";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/admin/ui";
import { IconList } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

export default async function AddMeritPage() {
  const festival = await prisma.festival.findFirst({
    where: { active: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!festival) {
    return (
      <div>
        <PageHeader title="Thêm công đức" crumbs={[{ label: "Công đức", href: "/admin/cong-duc" }, { label: "Thêm mới" }]} />
        <Card className="max-w-2xl">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Bạn cần tạo và đặt{" "}
            <Link
              className="font-semibold text-brand-600 underline decoration-gold-400 decoration-2 underline-offset-4 dark:text-brand-300"
              href="/admin/ngay-le"
            >
              ngày lễ công đức (active)
            </Link>{" "}
            trước.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Thêm công đức"
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            Ngày lễ đang active:
            <Badge color="gold">
              {festival.name} ({festival.year})
            </Badge>
          </span>
        }
        crumbs={[{ label: "Công đức", href: "/admin/cong-duc" }, { label: "Thêm mới" }]}
        actions={
          <ButtonLink href="/admin/cong-duc" variant="outline">
            <IconList /> Danh sách
          </ButtonLink>
        }
      />

      <Card className="max-w-2xl">
        <AddMeritForm
          festivals={[
            {
              id: festival.id,
              name: festival.name,
              startDate: festival.startDate.toISOString(),
              endDate: festival.endDate.toISOString(),
              year: festival.year,
            },
          ]}
        />
      </Card>
    </div>
  );
}
