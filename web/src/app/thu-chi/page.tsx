import type { Metadata } from "next";
import Link from "next/link";
import { adminFont, serifFont } from "@/components/admin/font";
import MonthCalendar from "@/components/ledger/MonthCalendar";
import YearChart from "@/components/ledger/YearChart";
import { vnd } from "@/components/ledger/format";
import { getLedgerSettings, getMonthReport, getYearReport, MERIT_CATEGORY_NAME } from "@/lib/ledger";
import { lunarInfo, lunarYearName } from "@/lib/lunar";
import { formatDateKey, vnNowYm } from "@/lib/vnDate";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Công khai thu chi – Đình Tân Kim",
  description: "Công khai tổng thu, tổng chi và tồn quỹ hằng tháng của đình Tân Kim.",
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${adminFont.variable} ${serifFont.variable} min-h-dvh bg-[#f7f3ea] font-admin text-stone-800`}>
      <div className="h-1.5 bg-gradient-to-r from-brand-800 via-brand-600 to-gold-400" />
      {children}
      <footer className="mx-auto max-w-6xl px-4 pt-4 pb-10 text-center text-xs text-stone-500 print:hidden">
        Số liệu lấy tự động từ sổ thu chi của Ban quản lý di tích đình Tân Kim. Công đức ghi danh được tính là khoản thu.
        Tiền tính bằng đồng (VND).
      </footer>
    </div>
  );
}

const TABS = [
  { key: "lich", label: "Lịch tháng" },
  { key: "chitiet", label: "Chi tiết thu chi" },
  { key: "nam", label: "Tổng hợp năm" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function MonthArrow({ to, label, children }: { to: string | null; label: string; children: React.ReactNode }) {
  const cls = "flex size-9 shrink-0 items-center justify-center rounded-full border text-lg";
  return to ? (
    <Link href={to} scroll={false} aria-label={label} className={`${cls} border-stone-300 bg-white text-stone-700 hover:border-stone-500`}>
      {children}
    </Link>
  ) : (
    <span aria-hidden="true" className={`${cls} border-stone-200 text-stone-300`}>
      {children}
    </span>
  );
}

function Figure({ label, value, tone, sub }: { label: string; value: string; tone?: "thu" | "chi" | "ton"; sub?: string }) {
  const color = tone === "thu" ? "text-[#2f6fb0]" : tone === "chi" ? "text-[#c8232c]" : "text-stone-900";
  return (
    <div className="min-w-0 rounded-2xl border border-stone-200 bg-white px-4 py-3 sm:px-5 sm:py-4">
      <div className="text-[11px] font-medium tracking-wide text-stone-500 uppercase sm:text-xs">{label}</div>
      <div className={`mt-1 font-[family-name:var(--font-serif-vn)] text-lg font-bold sm:text-3xl ${color}`}>{value}</div>
      {sub ? <div className="mt-1 text-xs text-stone-500">{sub}</div> : null}
    </div>
  );
}

export default async function PublicLedgerPage(props: { searchParams: Promise<{ y?: string; m?: string; tab?: string }> }) {
  const settings = await getLedgerSettings();
  if (!settings.isPublic) {
    return (
      <Shell>
        <main className="mx-auto max-w-xl px-4 py-24 text-center">
          <h1 className="font-[family-name:var(--font-serif-vn)] text-2xl font-bold text-brand-800">Công khai thu chi</h1>
          <p className="mt-3 text-stone-600">Ban quản lý chưa mở công khai số liệu thu chi trên trang này.</p>
        </main>
      </Shell>
    );
  }

  const sp = await props.searchParams;
  const tab: TabKey = TABS.some((t) => t.key === sp.tab) ? (sp.tab as TabKey) : "lich";
  const now = vnNowYm();
  const startYear = settings.startKey ? Number(settings.startKey.slice(0, 4)) : now.year;
  const years = Array.from({ length: Math.max(1, now.year - startYear + 1) }, (_, i) => now.year - i);
  const yReq = Number(sp.y);
  const year = years.includes(yReq) ? yReq : now.year;
  const maxMonth = year === now.year ? now.month : 12;
  const mReq = Number(sp.m);
  const month = Number.isInteger(mReq) && mReq >= 1 && mReq <= maxMonth ? mReq : maxMonth;

  const [yr, mr] = await Promise.all([getYearReport(year), getMonthReport(year, month)]);
  const visibleMonths = yr.months.filter((m) => m.month <= maxMonth);
  const href = (m: number, t: TabKey) => `/thu-chi?y=${year}&m=${m}&tab=${t}`;
  const lunarSpan = `${mr.lunarSpan.from.label} – ${mr.lunarSpan.to.label} năm ${lunarYearName(mr.lunarSpan.to.year)}`;
  const chiEntries = mr.entries.filter((e) => e.type === "chi");
  const topDays = [...mr.days]
    .filter((d) => d.thu > 0)
    .sort((a, b) => b.thu - a.thu)
    .slice(0, 5);

  return (
    <Shell>
      <header className="mx-auto max-w-6xl px-4 pt-8 pb-6 sm:pt-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-brand-700 uppercase">Ban quản lý di tích · Đình Tân Kim</div>
        <h1 className="mt-2 font-[family-name:var(--font-serif-vn)] text-3xl font-bold text-stone-900 sm:text-4xl">
          Công khai thu chi năm {year}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Tổng hợp tiền công đức và các khoản thu, chi bằng tiền mặt theo từng tháng dương lịch, kèm ngày âm lịch.
        </p>
        {years.length > 1 ? (
          <nav className="mt-5 flex flex-wrap gap-2 print:hidden" aria-label="Chọn năm">
            {years.map((y) => (
              <Link
                key={y}
                href={`/thu-chi?y=${y}&tab=${tab}`}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                  y === year ? "border-brand-700 bg-brand-700 text-white" : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
                }`}
              >
                {y}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <main className="mx-auto max-w-6xl px-4">
        {/* Tabs */}
        <nav
          className="sticky top-0 z-20 -mx-4 mb-6 border-b border-stone-200 bg-[#f7f3ea]/95 px-4 backdrop-blur print:hidden"
          aria-label="Chọn nội dung"
        >
          <div className="no-scrollbar flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={href(month, t.key)}
                scroll={false}
                aria-current={tab === t.key ? "page" : undefined}
                className={`relative shrink-0 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                  tab === t.key ? "text-brand-800" : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {t.label}
                {tab === t.key ? <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-700" /> : null}
              </Link>
            ))}
          </div>
        </nav>

        {tab === "nam" ? (
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-3">
              <Figure label={`Tổng thu ${year}`} value={vnd(yr.totalThu)} tone="thu" />
              <Figure label={`Tổng chi ${year}`} value={vnd(yr.totalChi)} tone="chi" />
              <Figure
                label={year === now.year ? "Tồn quỹ hiện tại" : `Tồn quỹ cuối năm ${year}`}
                value={vnd(year === now.year ? visibleMonths[visibleMonths.length - 1].closing : yr.closing)}
                sub={`Tồn đầu năm: ${vnd(yr.opening)}`}
              />
            </section>

            <section className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
              <h2 className="font-[family-name:var(--font-serif-vn)] text-lg font-bold text-stone-900">Thu chi theo tháng</h2>
              <p className="mb-4 text-xs text-stone-500">Bấm vào một tháng để xem lịch tháng đó.</p>
              <YearChart
                months={visibleMonths.map((m) => ({ month: m.month, thu: m.thu, chi: m.chi, closing: m.closing, disabled: m.beforeStart }))}
                selected={month}
                linkBase={`/thu-chi?y=${year}&tab=lich`}
              />
              <div className="custom-scrollbar mt-5 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="border-b border-stone-200 text-xs text-stone-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Tháng</th>
                      <th className="px-3 py-2 text-right font-medium">Thu</th>
                      <th className="px-3 py-2 text-right font-medium">Chi</th>
                      <th className="px-3 py-2 text-right font-medium">Tồn cuối tháng</th>
                      <th className="px-3 py-2 text-left font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {visibleMonths.map((m) => (
                      <tr key={m.month} className={m.month === month ? "bg-[#f3eee4]" : ""}>
                        <td className="px-3 py-2">
                          <Link href={href(m.month, "lich")} className="font-medium text-brand-700 hover:underline">
                            Tháng {m.month}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap text-stone-900">{vnd(m.thu)}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap text-stone-900">{vnd(m.chi)}</td>
                        <td className="px-3 py-2 text-right font-semibold whitespace-nowrap text-stone-900">{vnd(m.closing)}</td>
                        <td className="px-3 py-2 text-xs text-stone-500">
                          {m.beforeStart ? "Trước khi mở sổ" : m.locked ? "✓ Đã chốt sổ" : "Đang cập nhật"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        ) : (
          <div className="space-y-6">
            {/* Month switcher */}
            <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MonthArrow to={month > 1 ? href(month - 1, tab) : null} label="Tháng trước">‹</MonthArrow>
                  <div className="min-w-0 px-1">
                    <h2 className="font-[family-name:var(--font-serif-vn)] text-xl font-bold text-stone-900 sm:text-2xl">
                      Tháng {month}/{year}
                    </h2>
                    <div className="text-xs text-stone-500 sm:text-sm">Âm lịch: {lunarSpan}</div>
                  </div>
                  <MonthArrow to={month < maxMonth ? href(month + 1, tab) : null} label="Tháng sau">›</MonthArrow>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    mr.locked ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {mr.locked ? "✓ Đã chốt sổ" : "Số liệu đang cập nhật"}
                </span>
              </div>
              <div className="no-scrollbar -mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1">
                {visibleMonths.map((m) => (
                  <Link
                    key={m.month}
                    href={href(m.month, tab)}
                    scroll={false}
                    className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium ${
                      m.month === month
                        ? "border-brand-700 bg-brand-700 text-white"
                        : m.beforeStart
                          ? "border-stone-200 text-stone-300"
                          : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                    }`}
                  >
                    T{m.month}
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <Figure label="Tồn đầu tháng" value={vnd(mr.opening)} />
              <Figure label="Thu trong tháng" value={vnd(mr.totalThu)} tone="thu" />
              <Figure label="Chi trong tháng" value={vnd(mr.totalChi)} tone="chi" />
              <Figure label="Tồn cuối tháng" value={vnd(mr.closing)} />
            </div>


            {tab === "lich" ? (
              <MonthCalendar days={mr.days} />
            ) : (
              <div className="grid gap-6 lg:grid-cols-5">
                <div className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5 lg:col-span-2">
                  <h3 className="font-[family-name:var(--font-serif-vn)] font-bold text-stone-900">Các nguồn thu</h3>
                  {mr.thuByCategory.length === 0 ? (
                    <p className="mt-3 text-sm text-stone-500">Chưa có khoản thu.</p>
                  ) : (
                    <ul className="mt-3 divide-y divide-stone-100 text-sm">
                      {mr.thuByCategory.map((c) => (
                        <li key={c.name} className="flex items-baseline justify-between gap-3 py-2">
                          <span className="text-stone-700">
                            {c.name}
                            <span className="ml-1 text-xs text-stone-400">
                              ({c.count} {c.name === MERIT_CATEGORY_NAME ? "lượt" : "lần"})
                            </span>
                          </span>
                          <span className="font-semibold whitespace-nowrap text-stone-900">{vnd(c.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {topDays.length ? (
                    <>
                      <h3 className="mt-6 font-[family-name:var(--font-serif-vn)] font-bold text-stone-900">Ngày thu nhiều nhất</h3>
                      <ul className="mt-3 divide-y divide-stone-100 text-sm">
                        {topDays.map((d) => (
                          <li key={d.key} className="flex items-baseline justify-between gap-3 py-2">
                            <span className="text-stone-700">
                              {formatDateKey(d.key)}{" "}
                              <span className={d.lunar.isFirst || d.lunar.isFull || d.lunar.holiday ? "font-semibold text-brand-700" : "text-stone-400"}>
                                (âm {d.lunar.label}
                                {d.lunar.isFirst ? ", mùng 1" : d.lunar.isFull ? ", rằm" : ""}
                                {d.lunar.holiday && !d.lunar.isFull && !d.lunar.isFirst ? `, ${d.lunar.holiday}` : ""})
                              </span>
                            </span>
                            <span className="font-semibold whitespace-nowrap text-stone-900">{vnd(d.thu)}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>

                <div className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5 lg:col-span-3">
                  <h3 className="font-[family-name:var(--font-serif-vn)] font-bold text-stone-900">Các khoản chi</h3>
                  {chiEntries.length === 0 ? (
                    <p className="mt-3 text-sm text-stone-500">Chưa có khoản chi.</p>
                  ) : (
                    <div className="custom-scrollbar mt-3 overflow-x-auto">
                      <table className="w-full min-w-[480px] text-sm">
                        <thead className="border-b border-stone-200 text-xs text-stone-500">
                          <tr>
                            <th className="py-2 pr-3 text-left font-medium">Ngày</th>
                            <th className="px-3 py-2 text-left font-medium">Nội dung</th>
                            <th className="py-2 pl-3 text-right font-medium">Số tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {chiEntries.map((e) => {
                            const [y, m, d] = e.dateKey.split("-").map(Number);
                            return (
                              <tr key={e.id}>
                                <td className="py-2 pr-3 align-top whitespace-nowrap text-stone-700">
                                  {formatDateKey(e.dateKey)}
                                  <div className="text-xs text-stone-400">âm {lunarInfo(d, m, y).label}</div>
                                </td>
                                <td className="px-3 py-2 align-top text-stone-800">
                                  {e.description}
                                  <div className="text-xs text-stone-400">{e.categoryName}</div>
                                </td>
                                <td className="py-2 pl-3 text-right align-top font-semibold whitespace-nowrap text-stone-900">{vnd(e.amount)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="border-t border-stone-300 font-semibold">
                          <tr>
                            <td className="py-2 pr-3" colSpan={2}>
                              Tổng chi
                            </td>
                            <td className="py-2 pl-3 text-right whitespace-nowrap">{vnd(mr.totalChi)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </Shell>
  );
}
