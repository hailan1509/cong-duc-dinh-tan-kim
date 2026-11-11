import Link from "next/link";
import { Alert, Badge, ButtonLink, Card, PageHeader, StatCard, buttonClass, tableClass, tableWrapClass, tbodyClass, tdClass, thClass, theadClass } from "@/components/admin/ui";
import { IconCoins, IconFile, IconList, IconPlus } from "@/components/admin/icons";
import MonthCalendar from "@/components/ledger/MonthCalendar";
import MonthNav from "@/components/ledger/MonthNav";
import { DeleteEntryButton, LockToggleButton } from "@/components/ledger/clientActions";
import { parseYm, vnd, ymHref } from "@/components/ledger/format";
import { ensureDefaultCategories, getMonthReport, MERIT_CATEGORY_NAME } from "@/lib/ledger";
import { lunarInfo, lunarYearName } from "@/lib/lunar";
import { formatDateKey, isValidDateKey, vnDateKey, vnNowYm } from "@/lib/vnDate";

export const dynamic = "force-dynamic";

const BASE = "/admin/thu-chi";

type Row =
  | { kind: "merit"; dateKey: string; count: number; sum: number }
  | { kind: "entry"; dateKey: string; entry: Awaited<ReturnType<typeof getMonthReport>>["entries"][number] };

function lunarLabel(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const l = lunarInfo(d, m, y);
  return l.isFirst || l.isFull ? l.short : l.label;
}

export default async function LedgerMonthPage(props: { searchParams: Promise<{ y?: string; m?: string; d?: string }> }) {
  const sp = await props.searchParams;
  const { year, month } = parseYm(sp, vnNowYm());
  await ensureDefaultCategories();
  const r = await getMonthReport(year, month);
  const dayFilter = isValidDateKey(sp.d) && sp.d.startsWith(`${year}-${String(month).padStart(2, "0")}`) ? sp.d : null;

  const rows: Row[] = [
    ...r.days.filter((d) => d.meritCount > 0).map((d) => ({ kind: "merit" as const, dateKey: d.key, count: d.meritCount, sum: d.meritSum })),
    ...r.entries.map((e) => ({ kind: "entry" as const, dateKey: e.dateKey, entry: e })),
  ]
    .filter((row) => !dayFilter || row.dateKey === dayFilter)
    .sort((a, b) => (a.dateKey === b.dateKey ? (a.kind === "merit" ? -1 : 1) : a.dateKey < b.dateKey ? -1 : 1));

  const lunarSpan = `${r.lunarSpan.from.label} – ${r.lunarSpan.to.label} năm ${lunarYearName(r.lunarSpan.to.year)}`;
  const otherThu = r.totalThu - r.meritSum;
  const addHref = (type: "thu" | "chi") =>
    `${BASE}/phieu/them?type=${type}${dayFilter ? `&date=${dayFilter}` : ""}`;

  return (
    <div>
      <PageHeader
        title={`Sổ thu chi tháng ${month}/${year}`}
        description={`Âm lịch: ${lunarSpan}`}
        crumbs={[{ label: "Thu chi", href: BASE }, { label: `Tháng ${month}/${year}` }]}
        actions={
          <>
            <ButtonLink href={addHref("thu")} variant="outline" className={r.locked ? "pointer-events-none opacity-50" : ""}>
              <IconPlus /> Phiếu thu
            </ButtonLink>
            <ButtonLink href={addHref("chi")} variant="outline" className={r.locked ? "pointer-events-none opacity-50" : ""}>
              <IconPlus /> Phiếu chi
            </ButtonLink>
            <ButtonLink href={`${BASE}/kiem-dem`} className={r.locked ? "pointer-events-none opacity-50" : ""}>
              <IconCoins /> Kiểm đếm hòm
            </ButtonLink>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <MonthNav base={BASE} year={year} month={month} />
        <div className="flex items-center gap-2">
          {r.locked ? <Badge color="gray">🔒 Đã khoá sổ</Badge> : <Badge color="success">Đang mở sổ</Badge>}
          <LockToggleButton year={year} month={month} locked={r.locked} />
        </div>
      </div>

      {r.beforeStart ? (
        <Alert variant="info" className="mb-6">
          Tháng này trước ngày bắt đầu dùng sổ ({r.settings.startKey ? formatDateKey(r.settings.startKey) : ""}) — không tính vào tồn quỹ.
        </Alert>
      ) : null}
      {!r.settings.startKey ? (
        <Alert variant="info" className="mb-6">
          Chưa đặt <b>ngày bắt đầu sổ</b> và <b>tồn quỹ đầu kỳ</b> — tồn quỹ đang tính từ 0 với toàn bộ công đức từ trước tới nay.{" "}
          <Link href={`${BASE}/cai-dat`} className="font-semibold text-brand-600 underline underline-offset-2 dark:text-brand-300">
            Cài đặt sổ
          </Link>
        </Alert>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<IconFile />} tone="gray" label="Tồn quỹ đầu tháng" value={vnd(r.opening)} />
        <StatCard
          icon={<IconPlus />}
          tone="gold"
          label="Tổng thu"
          value={<span className="text-emerald-700 dark:text-emerald-400">{vnd(r.totalThu)}</span>}
          sub={`Công đức ghi danh ${vnd(r.meritSum)} · Hòm & khác ${vnd(otherThu)}`}
        />
        <StatCard
          icon={<IconList />}
          tone="brand"
          label="Tổng chi"
          value={<span className="text-red-600 dark:text-red-400">{vnd(r.totalChi)}</span>}
        />
        <StatCard
          icon={<IconCoins />}
          tone="brand"
          label="Tồn quỹ cuối tháng"
          value={<span className="text-brand-700 dark:text-brand-300">{vnd(r.closing)}</span>}
        />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <MonthCalendar
            days={r.days}
            todayKey={vnDateKey(new Date())}
            selectedKey={dayFilter ?? undefined}
            dayHref={(key) => (key === dayFilter ? ymHref(BASE, year, month) : ymHref(BASE, year, month, { d: key }))}
          />
        </div>
        <div className="space-y-6">
          <Card title="Thu theo danh mục" bodyClassName="p-0">
            <CategoryList items={r.thuByCategory} empty="Chưa có khoản thu" tone="thu" />
          </Card>
          <Card title="Chi theo danh mục" bodyClassName="p-0">
            <CategoryList items={r.chiByCategory} empty="Chưa có khoản chi" tone="chi" />
          </Card>
        </div>
      </div>

      <div className={tableWrapClass}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div className="font-semibold text-gray-800 dark:text-white/90">
            {dayFilter ? `Chi tiết ngày ${formatDateKey(dayFilter)} (âm ${lunarLabel(dayFilter)})` : "Chi tiết thu chi trong tháng"}
          </div>
          {dayFilter ? (
            <Link href={ymHref(BASE, year, month)} scroll={false} className={buttonClass("outline", "xs")}>
              Xem cả tháng
            </Link>
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400">Bấm vào một ngày trên lịch để lọc</span>
          )}
        </div>
        <div className="custom-scrollbar overflow-x-auto">
          <table className={`${tableClass} min-w-[960px]`}>
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Ngày</th>
                <th className={thClass}>Số phiếu</th>
                <th className={thClass}>Danh mục</th>
                <th className={thClass}>Nội dung</th>
                <th className={`${thClass} text-right`}>Thu</th>
                <th className={`${thClass} text-right`}>Chi</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody className={tbodyClass}>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                    Chưa có khoản thu chi nào.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.kind === "merit" ? `m-${row.dateKey}` : `e-${row.entry.id}`} className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <div className="font-medium text-gray-800 dark:text-white/90">{formatDateKey(row.dateKey)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Âm {lunarLabel(row.dateKey)}</div>
                    </td>
                    {row.kind === "merit" ? (
                      <>
                        <td className={`${tdClass} text-gray-400`}>—</td>
                        <td className={tdClass}>
                          <Badge color="gold">{MERIT_CATEGORY_NAME}</Badge>
                        </td>
                        <td className={tdClass}>
                          <Link
                            href={`/admin/cong-duc?startDate=${row.dateKey}&endDate=${row.dateKey}`}
                            className="text-brand-600 hover:underline dark:text-brand-300"
                          >
                            {row.count} lượt công đức
                          </Link>
                        </td>
                        <td className={`${tdClass} text-right font-semibold whitespace-nowrap text-emerald-700 dark:text-emerald-400`}>{vnd(row.sum)}</td>
                        <td className={tdClass}></td>
                        <td className={tdClass}></td>
                      </>
                    ) : (
                      <>
                        <td className={`${tdClass} font-mono text-xs whitespace-nowrap`}>{row.entry.code}</td>
                        <td className={tdClass}>
                          <Badge color={row.entry.type === "thu" ? "success" : "error"}>{row.entry.categoryName}</Badge>
                        </td>
                        <td className={tdClass}>
                          <div className="text-gray-800 dark:text-white/90">{row.entry.description}</div>
                          {row.entry.party || row.entry.festivalName ? (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {[row.entry.party && `${row.entry.type === "thu" ? "Người nộp" : "Người nhận"}: ${row.entry.party}`, row.entry.festivalName]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          ) : null}
                        </td>
                        <td className={`${tdClass} text-right font-semibold whitespace-nowrap text-emerald-700 dark:text-emerald-400`}>
                          {row.entry.type === "thu" ? vnd(row.entry.amount) : ""}
                        </td>
                        <td className={`${tdClass} text-right font-semibold whitespace-nowrap text-red-600 dark:text-red-400`}>
                          {row.entry.type === "chi" ? vnd(row.entry.amount) : ""}
                        </td>
                        <td className={`${tdClass} text-right`}>
                          {r.locked ? null : (
                            <div className="flex justify-end gap-2">
                              {row.entry.isBoxCount ? (
                                <Link href={`${BASE}/kiem-dem/${row.entry.id}`} className={buttonClass("outline", "xs")}>
                                  Biên bản
                                </Link>
                              ) : (
                                <Link href={`${BASE}/phieu/${row.entry.id}/sua`} className={buttonClass("outline", "xs")}>
                                  Sửa
                                </Link>
                              )}
                              <DeleteEntryButton id={row.entry.id} code={row.entry.code} />
                            </div>
                          )}
                          {r.locked && row.entry.isBoxCount ? (
                            <Link href={`${BASE}/kiem-dem/${row.entry.id}`} className={buttonClass("outline", "xs")}>
                              Biên bản
                            </Link>
                          ) : null}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CategoryList({
  items,
  empty,
  tone,
}: {
  items: Array<{ name: string; amount: number; count: number }>;
  empty: string;
  tone: "thu" | "chi";
}) {
  if (!items.length) return <div className="px-5 py-6 text-sm text-gray-500 dark:text-gray-400">{empty}</div>;
  const total = items.reduce((s, i) => s + i.amount, 0) || 1;
  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
      {items.map((it) => (
        <li key={it.name} className="px-5 py-3">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-gray-700 dark:text-gray-300">
              {it.name} <span className="text-xs text-gray-400">({it.count})</span>
            </span>
            <span className="font-semibold whitespace-nowrap text-gray-800 dark:text-white/90">{vnd(it.amount)}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
            <div
              className={`h-full rounded-full ${tone === "thu" ? "bg-emerald-500" : "bg-red-500"}`}
              style={{ width: `${Math.max(2, (it.amount / total) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
