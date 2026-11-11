// Lịch tháng dương lịch kèm âm lịch, thu/chi từng ngày. Dùng cho trang admin và trang công khai.
import Link from "next/link";
import type { DayRow } from "@/lib/ledger";
import { compactVnd, vnd } from "./format";

const HEAD = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function MonthCalendar({
  days,
  todayKey,
  selectedKey,
  dayHref,
  showChi = true,
}: {
  days: DayRow[];
  todayKey?: string;
  selectedKey?: string;
  /** Link cho từng ngày (để lọc danh sách bên dưới); bỏ trống = không bấm được */
  dayHref?: (key: string) => string;
  showChi?: boolean;
}) {
  // Monday-first grid
  const lead = (days[0].weekday + 6) % 7;
  const cells: Array<DayRow | null> = [...Array(lead).fill(null), ...days];
  while (cells.length % 7) cells.push(null);
  const maxThu = Math.max(1, ...days.map((d) => d.thu));

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/60 dark:border-gray-800 dark:bg-white/[0.02]">
        {HEAD.map((h, i) => (
          <div
            key={h}
            className={`py-2 text-center text-xs font-medium ${i === 6 ? "text-brand-600 dark:text-brand-300" : "text-gray-500 dark:text-gray-400"}`}
          >
            {h}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 [&>*:nth-child(7n)]:border-r-0">
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} className="min-h-16 border-b border-r border-gray-100 bg-gray-50/40 sm:min-h-24 dark:border-gray-800 dark:bg-transparent" />;
          const special = d.lunar.isFirst || d.lunar.isFull || !!d.lunar.holiday;
          const selected = selectedKey === d.key;
          const intensity = d.thu > 0 ? Math.max(0.12, d.thu / maxThu) : 0;
          const body = (
            <>
              <div className="flex flex-col items-start gap-0 sm:flex-row sm:justify-between sm:gap-1">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold sm:text-sm ${
                    todayKey === d.key
                      ? "bg-brand-600 text-white"
                      : d.weekday === 0
                        ? "text-brand-600 dark:text-brand-300"
                        : "text-gray-800 dark:text-white/90"
                  }`}
                >
                  {d.day}
                </span>
                <span
                  className={`truncate pl-0.5 text-[10px] leading-4 sm:pl-0 sm:text-xs sm:leading-6 ${
                    special ? "font-semibold text-brand-700 dark:text-brand-300" : "text-gray-400 dark:text-gray-500"
                  }`}
                  title={`Âm lịch ${d.lunar.label}${d.lunar.holiday ? ` · ${d.lunar.holiday}` : ""}`}
                >
                  <span className="hidden sm:inline">{d.lunar.isFirst || d.lunar.isFull ? d.lunar.short : d.lunar.label}</span>
                  <span className="sm:hidden">{d.lunar.isFull ? "Rằm" : d.lunar.isFirst ? `1/${d.lunar.month}` : d.lunar.day}</span>
                </span>
              </div>
              {d.lunar.holiday || d.festivals.length ? (
                <div className="mt-0.5 hidden truncate text-[10px] font-medium text-gold-700 sm:block dark:text-gold-300">
                  {d.festivals[0] ?? d.lunar.holiday}
                </div>
              ) : null}
              <div className="mt-auto space-y-0.5 pt-1 text-right text-[10px] leading-tight sm:text-xs">
                {d.thu > 0 ? (
                  <div className="font-semibold text-emerald-700 dark:text-emerald-400" title={`Thu ${vnd(d.thu)}`}>
                    +{compactVnd(d.thu)}
                  </div>
                ) : null}
                {showChi && d.chi > 0 ? (
                  <div className="font-semibold text-red-600 dark:text-red-400" title={`Chi ${vnd(d.chi)}`}>
                    −{compactVnd(d.chi)}
                  </div>
                ) : null}
              </div>
              {/* Income intensity bar */}
              {intensity > 0 ? (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500/80" style={{ opacity: intensity }} aria-hidden="true" />
              ) : null}
            </>
          );
          const cls = `relative flex min-h-16 flex-col border-b border-r border-gray-100 p-1 sm:min-h-24 sm:p-2 dark:border-gray-800 ${
            special ? "bg-gold-50/70 dark:bg-gold-400/[0.06]" : ""
          } ${d.beforeStart ? "opacity-40" : ""} ${selected ? "ring-2 ring-inset ring-brand-500" : ""}`;
          return dayHref ? (
            <Link key={d.key} href={dayHref(d.key)} scroll={false} className={`${cls} hover:bg-gray-50 dark:hover:bg-white/[0.04]`}>
              {body}
            </Link>
          ) : (
            <div key={d.key} className={cls}>
              {body}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-gold-200 bg-gold-50" /> Mùng 1, Rằm, ngày lễ âm lịch
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">+</span> Thu (gồm công đức ghi danh)
        </span>
        {showChi ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="font-semibold text-red-600 dark:text-red-400">−</span> Chi
          </span>
        ) : null}
      </div>
    </div>
  );
}
