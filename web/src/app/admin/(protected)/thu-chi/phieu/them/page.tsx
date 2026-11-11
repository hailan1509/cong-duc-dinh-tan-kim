import { prisma } from "@/lib/db";
import { ButtonLink, Card, PageHeader } from "@/components/admin/ui";
import EntryForm from "@/components/ledger/EntryForm";
import { ensureDefaultCategories, getLedgerSettings } from "@/lib/ledger";
import { isValidDateKey, vnDateKey } from "@/lib/vnDate";

export const dynamic = "force-dynamic";

export default async function NewEntryPage(props: { searchParams: Promise<{ type?: string; date?: string }> }) {
  const sp = await props.searchParams;
  const type = sp.type === "chi" ? "chi" : "thu";
  const date = isValidDateKey(sp.date) ? sp.date : vnDateKey(new Date());

  await ensureDefaultCategories();
  const [categories, festivals, settings] = await Promise.all([
    prisma.ledgerCategory.findMany({ where: { systemKey: null }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    prisma.festival.findMany({ orderBy: [{ year: "desc" }, { startDate: "desc" }], select: { id: true, name: true, year: true } }),
    getLedgerSettings(),
  ]);

  return (
    <div>
      <PageHeader
        title={type === "thu" ? "Lập phiếu thu" : "Lập phiếu chi"}
        description="Tiền mặt. Công đức ghi danh và hòm công đức không nhập ở đây."
        crumbs={[{ label: "Thu chi", href: "/admin/thu-chi" }, { label: "Lập phiếu" }]}
        actions={
          <ButtonLink href={`/admin/thu-chi?y=${date.slice(0, 4)}&m=${Number(date.slice(5, 7))}`} variant="outline">
            Quay lại
          </ButtonLink>
        }
      />
      <Card className="max-w-3xl">
        <EntryForm
          mode="create"
          initial={{ type, date, amount: 0, categoryId: null, festivalId: null, party: "", description: "" }}
          categories={categories.map((c) => ({ id: c.id, type: c.type, name: c.name, active: c.active }))}
          festivals={festivals}
          minDate={settings.startKey}
        />
      </Card>
    </div>
  );
}
