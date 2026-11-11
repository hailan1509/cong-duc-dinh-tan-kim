import Link from "next/link";
import { Badge, PageHeader, StatCard, buttonClass, inputClass, tableClass, tableWrapClass, tbodyClass, tdClass, thClass, theadClass } from "@/components/admin/ui";
import { IconCoins, IconFile, IconList, IconPlus } from "@/components/admin/icons";
import { LockToggleButton, PrintButton } from "@/components/ledger/clientActions";
import { vnd } from "@/components/ledger/format";
import { getYearReport } from "@/lib/ledger";
import { vnNowYm } from "@/lib/vnDate";

export const dynamic = "force-dynamic";

export default async function LedgerYearPage(props: { searchParams: Promise<{ y?: string }> }) {
  const sp = await props.searchParams;
  const now = vnNowYm();
  const yNum = Number(sp.y);
  const year = Number.isInteger(yNum) && yNum >= 2000 && yNum <= 2100 ? yNum : now.year;
  const r = await getYearReport(year);
  const meritTotal = r.months.reduce((s, m) => s + m.meritSum, 0);

  return (
    <div>
      <PageHeader
        title={`Báo cáo thu chi năm ${year}`}
        description="Năm tài chính theo dương lịch. Công đức ghi danh được tính là khoản thu."
        crumbs={[{ label: "Thu chi", href: "/admin/thu-chi" }, { label: `Năm ${year}` }]}
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Link href={`?y=${year - 1}`} className={buttonClass("outline", "sm")}>
              ‹ {year - 1}
            </Link>
            <form className="flex items-center gap-2">
              <input name="y" type="number" min={2000} max={2100} defaultValue={year} className={`${inputClass} h-9 w-24 py-1.5`} aria-label="Năm" />
              <button className={buttonClass("outline", "sm")}>Xem</button>
            </form>
            <Link href={`?y=${year + 1}`} className={buttonClass("outline", "sm")}>
              {year + 1} ›
            </Link>
            <PrintButton />
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<IconFile />} tone="gray" label={`Tồn quỹ đầu năm`} value={vnd(r.opening)} />
        <StatCard
          icon={<IconPlus />}
          tone="gold"
          label="Tổng thu cả năm"
          value={<span className="text-emerald-700 dark:text-emerald-400">{vnd(r.totalThu)}</span>}
          sub={`Công đức ghi danh ${vnd(meritTotal)}`}
        />
        <StatCard icon={<IconList />} tone="brand" label="Tổng chi cả năm" value={<span className="text-red-600 dark:text-red-400">{vnd(r.totalChi)}</span>} />
        <StatCard icon={<IconCoins />} tone="brand" label="Tồn quỹ cuối năm" value={<span className="text-brand-700 dark:text-brand-300">{vnd(r.closing)}</span>} />
      </div>

      <div className={`${tableWrapClass} mb-6`}>
        <div className="custom-scrollbar overflow-x-auto">
          <table className={`${tableClass} min-w-[860px]`}>
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Tháng</th>
                <th className={`${thClass} text-right`}>Tồn đầu</th>
                <th className={`${thClass} text-right`}>Công đức ghi danh</th>
                <th className={`${thClass} text-right`}>Tổng thu</th>
                <th className={`${thClass} text-right`}>Tổng chi</th>
                <th className={`${thClass} text-right`}>Tồn cuối</th>
                <th className={`${thClass} print:hidden`}>Sổ</th>
              </tr>
            </thead>
            <tbody className={tbodyClass}>
              {r.months.map((m) => (
                <tr key={m.month} className={m.beforeStart ? "opacity-50" : "hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"}>
                  <td className={tdClass}>
                    <Link href={`/admin/thu-chi?y=${year}&m=${m.month}`} className="font-medium text-brand-600 hover:underline dark:text-brand-300">
                      Tháng {m.month}
                    </Link>
                  </td>
                  <td className={`${tdClass} text-right whitespace-nowrap`}>{vnd(m.opening)}</td>
                  <td className={`${tdClass} text-right whitespace-nowrap`}>{vnd(m.meritSum)}</td>
                  <td className={`${tdClass} text-right font-semibold whitespace-nowrap text-emerald-700 dark:text-emerald-400`}>{vnd(m.thu)}</td>
                  <td className={`${tdClass} text-right font-semibold whitespace-nowrap text-red-600 dark:text-red-400`}>{vnd(m.chi)}</td>
                  <td className={`${tdClass} text-right font-semibold whitespace-nowrap text-gray-800 dark:text-white/90`}>{vnd(m.closing)}</td>
                  <td className={`${tdClass} print:hidden`}>
                    {m.beforeStart ? (
                      <Badge color="gray">Trước ngày mở sổ</Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        {m.locked ? <Badge color="gray">🔒 Đã khoá</Badge> : null}
                        <LockToggleButton year={year} month={m.month} locked={m.locked} size="xs" />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-200 font-semibold dark:border-gray-700">
              <tr>
                <td className={tdClass}>Cả năm</td>
                <td className={`${tdClass} text-right whitespace-nowrap`}>{vnd(r.opening)}</td>
                <td className={`${tdClass} text-right whitespace-nowrap`}>{vnd(meritTotal)}</td>
                <td className={`${tdClass} text-right whitespace-nowrap text-emerald-700 dark:text-emerald-400`}>{vnd(r.totalThu)}</td>
                <td className={`${tdClass} text-right whitespace-nowrap text-red-600 dark:text-red-400`}>{vnd(r.totalChi)}</td>
                <td className={`${tdClass} text-right whitespace-nowrap`}>{vnd(r.closing)}</td>
                <td className={`${tdClass} print:hidden`}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {([
          ["Thu theo danh mục", r.thuByCategory, r.totalThu, "text-emerald-700 dark:text-emerald-400"],
          ["Chi theo danh mục", r.chiByCategory, r.totalChi, "text-red-600 dark:text-red-400"],
        ] as const).map(([title, items, total, color]) => (
          <div key={title} className={tableWrapClass}>
            <div className="border-b border-gray-100 px-5 py-4 font-semibold text-gray-800 dark:border-gray-800 dark:text-white/90">{title}</div>
            <table className={tableClass}>
              <tbody className={tbodyClass}>
                {items.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-gray-500 dark:text-gray-400">Chưa có dữ liệu</td>
                  </tr>
                ) : (
                  items.map((c) => (
                    <tr key={c.name}>
                      <td className={tdClass}>{c.name}</td>
                      <td className={`${tdClass} text-right text-xs text-gray-500 dark:text-gray-400`}>
                        {total ? `${((c.amount / total) * 100).toFixed(1)}%` : ""}
                      </td>
                      <td className={`${tdClass} text-right font-semibold whitespace-nowrap ${color}`}>{vnd(c.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
