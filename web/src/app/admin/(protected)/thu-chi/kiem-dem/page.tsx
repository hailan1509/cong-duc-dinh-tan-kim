import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, PageHeader, buttonClass, tableClass, tableWrapClass, tbodyClass, tdClass, thClass, theadClass } from "@/components/admin/ui";
import BoxCountForm from "@/components/ledger/BoxCountForm";
import { vnd } from "@/components/ledger/format";
import { getLedgerSettings } from "@/lib/ledger";
import { lunarInfo } from "@/lib/lunar";
import { formatDateKey, vnDateKey } from "@/lib/vnDate";

export const dynamic = "force-dynamic";

export default async function BoxCountPage() {
  const [festivals, active, recent, settings] = await Promise.all([
    prisma.festival.findMany({ orderBy: [{ year: "desc" }, { startDate: "desc" }], select: { id: true, name: true, year: true } }),
    prisma.festival.findFirst({ where: { active: true }, orderBy: { updatedAt: "desc" }, select: { id: true } }),
    prisma.donationBoxCount.findMany({
      orderBy: { countedAt: "desc" },
      take: 20,
      include: { entry: { select: { id: true, code: true, date: true } } },
    }),
    getLedgerSettings(),
  ]);

  return (
    <div>
      <PageHeader
        title="Kiểm đếm hòm công đức"
        description="Mỗi lần mở hòm lập một biên bản; tổng tiền tự ghi thành phiếu thu (TT 04/2023/TT-BTC, Điều 9)."
        crumbs={[{ label: "Thu chi", href: "/admin/thu-chi" }, { label: "Kiểm đếm hòm" }]}
      />

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <BoxCountForm
            today={vnDateKey(new Date())}
            festivals={festivals}
            defaultFestivalId={active?.id ?? null}
            minDate={settings.startKey}
          />
        </Card>

        <div className="xl:col-span-2">
          <div className={tableWrapClass}>
            <div className="border-b border-gray-100 px-5 py-4 font-semibold text-gray-800 dark:border-gray-800 dark:text-white/90">
              Các lần kiểm đếm gần đây
            </div>
            <table className={tableClass}>
              <thead className={theadClass}>
                <tr>
                  <th className={thClass}>Ngày</th>
                  <th className={`${thClass} text-right`}>Tổng</th>
                  <th className={thClass}></th>
                </tr>
              </thead>
              <tbody className={tbodyClass}>
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                      Chưa có biên bản nào.
                    </td>
                  </tr>
                ) : (
                  recent.map((b) => {
                    const key = vnDateKey(b.entry.date);
                    const [y, m, d] = key.split("-").map(Number);
                    const l = lunarInfo(d, m, y);
                    return (
                      <tr key={b.id}>
                        <td className={tdClass}>
                          <div className="font-medium text-gray-800 dark:text-white/90">{formatDateKey(key)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Âm {l.label} · {b.location}
                          </div>
                        </td>
                        <td className={`${tdClass} text-right font-semibold whitespace-nowrap text-emerald-700 dark:text-emerald-400`}>{vnd(b.total)}</td>
                        <td className={`${tdClass} text-right`}>
                          <Link href={`/admin/thu-chi/kiem-dem/${b.entry.id}`} className={buttonClass("outline", "xs")}>
                            {b.entry.code}
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
