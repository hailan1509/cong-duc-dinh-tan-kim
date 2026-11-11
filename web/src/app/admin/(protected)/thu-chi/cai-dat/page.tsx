import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/admin/ui";
import { CategoryManager, LedgerSettingsForm } from "@/components/ledger/SettingsForms";
import { ensureDefaultCategories, getLedgerSettings } from "@/lib/ledger";

export const dynamic = "force-dynamic";

export default async function LedgerSettingsPage() {
  await ensureDefaultCategories();
  const [settings, categories] = await Promise.all([
    getLedgerSettings(),
    prisma.ledgerCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      include: { _count: { select: { entries: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Cài đặt sổ thu chi"
        crumbs={[{ label: "Thu chi", href: "/admin/thu-chi" }, { label: "Cài đặt" }]}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Số dư đầu kỳ & công khai" description="Không đổi được khi đã có tháng khoá sổ.">
          <LedgerSettingsForm
            initial={{ openingBalance: settings.openingBalance, startDate: settings.startKey, isPublic: settings.isPublic }}
          />
        </Card>
        <Card title="Danh mục thu chi" description="Danh mục đã có phiếu chỉ tắt được, không xoá.">
          <CategoryManager
            categories={categories.map((c) => ({
              id: c.id,
              type: c.type,
              name: c.name,
              active: c.active,
              system: !!c.systemKey,
              count: c._count.entries,
            }))}
          />
        </Card>
      </div>
    </div>
  );
}
