import { prisma } from "@/lib/db";
import { Alert, ButtonLink, Card, PageHeader } from "@/components/admin/ui";
import EntryForm from "@/components/ledger/EntryForm";
import { getLedgerSettings, isDateLocked } from "@/lib/ledger";
import { vnDateKey } from "@/lib/vnDate";

export const dynamic = "force-dynamic";

export default async function EditEntryPage(props: { params: Promise<{ id: string }> }) {
  const id = Number((await props.params).id);
  const entry = Number.isInteger(id)
    ? await prisma.ledgerEntry.findUnique({ where: { id }, include: { boxCount: { select: { id: true } } } })
    : null;

  if (!entry) {
    return (
      <Card>
        <div className="text-sm text-gray-600 dark:text-gray-400">Không tìm thấy phiếu.</div>
      </Card>
    );
  }

  const dateKey = vnDateKey(entry.date);
  const back = `/admin/thu-chi?y=${dateKey.slice(0, 4)}&m=${Number(dateKey.slice(5, 7))}`;
  const [categories, festivals, settings, locked] = await Promise.all([
    prisma.ledgerCategory.findMany({ where: { systemKey: null }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    prisma.festival.findMany({ orderBy: [{ year: "desc" }, { startDate: "desc" }], select: { id: true, name: true, year: true } }),
    getLedgerSettings(),
    isDateLocked(entry.date),
  ]);

  return (
    <div>
      <PageHeader
        title={`Sửa phiếu ${entry.code}`}
        description={entry.type === "thu" ? "Phiếu thu" : "Phiếu chi"}
        crumbs={[{ label: "Thu chi", href: back }, { label: entry.code }]}
        actions={
          <ButtonLink href={back} variant="outline">
            Quay lại
          </ButtonLink>
        }
      />
      <Card className="max-w-3xl">
        {locked ? (
          <Alert>Phiếu thuộc tháng đã khoá sổ — mở khoá trong Báo cáo năm nếu cần sửa.</Alert>
        ) : entry.boxCount ? (
          <Alert>Phiếu từ biên bản kiểm đếm hòm không sửa được — hãy xoá và kiểm đếm lại.</Alert>
        ) : (
          <EntryForm
            mode="edit"
            id={entry.id}
            initial={{
              type: entry.type,
              date: dateKey,
              amount: entry.amount,
              categoryId: entry.categoryId,
              festivalId: entry.festivalId,
              party: entry.party ?? "",
              description: entry.description,
            }}
            categories={categories.map((c) => ({ id: c.id, type: c.type, name: c.name, active: c.active }))}
            festivals={festivals}
            minDate={settings.startKey}
          />
        )}
      </Card>
    </div>
  );
}
