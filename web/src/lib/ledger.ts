// Sổ thu chi tiền mặt. Công đức ghi danh (merits) là khoản THU, đọc trực tiếp từ bảng merits.
import type { LedgerType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { lunarInfo, type LunarInfo } from "@/lib/lunar";
import { daysInMonth, vnDateKey, vnMonthRange, vnStartOfDay, vnYearRange } from "@/lib/vnDate";

export const MERIT_CATEGORY_NAME = "Công đức ghi danh";
export const BOX_CATEGORY_KEY = "hom_cong_duc";

const DEFAULT_CATEGORIES: Array<{ type: LedgerType; name: string; systemKey?: string }> = [
  { type: "thu", name: "Hòm công đức", systemKey: BOX_CATEGORY_KEY },
  { type: "thu", name: "Tài trợ, hỗ trợ" },
  { type: "thu", name: "Thu khác" },
  { type: "chi", name: "Hương, hoa, lễ vật" },
  { type: "chi", name: "Tổ chức lễ hội" },
  { type: "chi", name: "Thù lao trông coi, bảo vệ" },
  { type: "chi", name: "Điện, nước, vệ sinh" },
  { type: "chi", name: "Tu bổ, sửa chữa, mua sắm" },
  { type: "chi", name: "Từ thiện, nhân đạo" },
  { type: "chi", name: "Chi khác" },
];

/** Tạo danh mục mặc định ở lần dùng đầu tiên (idempotent). */
export async function ensureDefaultCategories() {
  const count = await prisma.ledgerCategory.count();
  if (count > 0) return;
  await prisma.ledgerCategory.createMany({
    data: DEFAULT_CATEGORIES.map((c, i) => ({ ...c, systemKey: c.systemKey ?? null, sortOrder: i })),
    skipDuplicates: true,
  });
}

export async function getLedgerSettings() {
  const s = await prisma.appSetting.findUnique({ where: { id: 1 } });
  const startDate = s?.ledgerStartDate ?? null;
  return {
    openingBalance: s?.ledgerOpeningBalance ?? 0,
    startDate,
    startKey: startDate ? vnDateKey(startDate) : null,
    isPublic: s?.ledgerPublic ?? true,
  };
}

/* --------------------------------- Locks --------------------------------- */

export async function isMonthLocked(year: number, month: number) {
  const lock = await prisma.ledgerPeriodLock.findUnique({ where: { year_month: { year, month } } });
  return !!lock;
}

/** Tháng (theo giờ VN) của một thời điểm đã khoá sổ chưa */
export async function isDateLocked(d: Date) {
  const key = vnDateKey(d);
  return isMonthLocked(Number(key.slice(0, 4)), Number(key.slice(5, 7)));
}

/* ------------------------------- Numbering ------------------------------- */

/** Số phiếu kế tiếp: PT-2026-0001 / PC-2026-0001 */
export async function nextVoucherCode(tx: Prisma.TransactionClient, type: LedgerType, year: number) {
  const prefix = `${type === "thu" ? "PT" : "PC"}-${year}-`;
  const last = await tx.ledgerEntry.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: "desc" },
    select: { code: true },
  });
  const n = last ? Number(last.code.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(n).padStart(4, "0")}`;
}

export async function writeAudit(
  tx: Prisma.TransactionClient | typeof prisma,
  params: { userId?: number | null; action: string; entity: string; entityId?: number | null; data?: unknown }
) {
  await tx.ledgerAuditLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? null,
      data: params.data === undefined ? undefined : (JSON.parse(JSON.stringify(params.data)) as Prisma.InputJsonValue),
    },
  });
}

/* -------------------------------- Balances -------------------------------- */

async function sumBetween(from: Date | null, to: Date) {
  const createdAt = { ...(from ? { gte: from } : {}), lt: to };
  const date = { ...(from ? { gte: from } : {}), lt: to };
  const [merits, thu, chi] = await prisma.$transaction([
    prisma.merit.aggregate({ where: { createdAt }, _sum: { amount: true } }),
    prisma.ledgerEntry.aggregate({ where: { type: "thu", date }, _sum: { amount: true } }),
    prisma.ledgerEntry.aggregate({ where: { type: "chi", date }, _sum: { amount: true } }),
  ]);
  return {
    thu: (merits._sum.amount ?? 0) + (thu._sum.amount ?? 0),
    chi: chi._sum.amount ?? 0,
  };
}

/** Tồn quỹ tại thời điểm `at` (trước `at`) */
export async function balanceBefore(at: Date, settings?: Awaited<ReturnType<typeof getLedgerSettings>>) {
  const s = settings ?? (await getLedgerSettings());
  if (s.startDate && at <= s.startDate) return s.openingBalance;
  const { thu, chi } = await sumBetween(s.startDate, at);
  return s.openingBalance + thu - chi;
}

/* ------------------------------ Month report ------------------------------ */

export type DayRow = {
  key: string;
  day: number;
  weekday: number; // 0 = CN
  lunar: LunarInfo;
  festivals: string[];
  meritCount: number;
  meritSum: number;
  thu: number; // gồm công đức ghi danh
  chi: number;
  beforeStart: boolean;
};

export type EntryRow = {
  id: number;
  code: string;
  type: LedgerType;
  dateKey: string;
  amount: number;
  categoryId: number;
  categoryName: string;
  festivalName: string | null;
  party: string | null;
  description: string;
  isBoxCount: boolean;
};

export type CategoryTotal = { name: string; amount: number; count: number };

export async function getMonthReport(year: number, month: number) {
  const settings = await getLedgerSettings();
  const { start, end } = vnMonthRange(year, month);
  const lower = settings.startDate && settings.startDate > start ? settings.startDate : start;
  const beforeStart = !!settings.startDate && end <= settings.startDate;

  const [merits, entries, festivals, locked, opening] = await Promise.all([
    beforeStart
      ? Promise.resolve([] as Array<{ amount: number; createdAt: Date }>)
      : prisma.merit.findMany({
          where: { createdAt: { gte: lower, lt: end } },
          select: { amount: true, createdAt: true },
        }),
    prisma.ledgerEntry.findMany({
      where: { date: { gte: start, lt: end } },
      include: { category: true, festival: true, boxCount: { select: { id: true } } },
      orderBy: [{ date: "asc" }, { id: "asc" }],
    }),
    prisma.festival.findMany({
      where: { startDate: { lt: end }, endDate: { gte: vnStartOfDay(vnDateKey(start)) } },
      select: { name: true, startDate: true, endDate: true },
    }),
    isMonthLocked(year, month),
    balanceBefore(start, settings),
  ]);

  const n = daysInMonth(year, month);
  const days: DayRow[] = [];
  const byKey = new Map<string, DayRow>();
  for (let d = 1; d <= n; d++) {
    const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const row: DayRow = {
      key,
      day: d,
      weekday: new Date(Date.UTC(year, month - 1, d)).getUTCDay(),
      lunar: lunarInfo(d, month, year),
      festivals: festivals
        .filter((f) => vnDateKey(f.startDate) <= key && key <= vnDateKey(f.endDate))
        .map((f) => f.name),
      meritCount: 0,
      meritSum: 0,
      thu: 0,
      chi: 0,
      beforeStart: !!settings.startKey && key < settings.startKey,
    };
    days.push(row);
    byKey.set(key, row);
  }

  for (const m of merits) {
    const row = byKey.get(vnDateKey(m.createdAt));
    if (!row) continue;
    row.meritCount += 1;
    row.meritSum += m.amount;
    row.thu += m.amount;
  }

  const entryRows: EntryRow[] = entries.map((e) => ({
    id: e.id,
    code: e.code,
    type: e.type,
    dateKey: vnDateKey(e.date),
    amount: e.amount,
    categoryId: e.categoryId,
    categoryName: e.category.name,
    festivalName: e.festival?.name ?? null,
    party: e.party,
    description: e.description,
    isBoxCount: !!e.boxCount,
  }));
  for (const e of entryRows) {
    const row = byKey.get(e.dateKey);
    if (!row) continue;
    if (e.type === "thu") row.thu += e.amount;
    else row.chi += e.amount;
  }

  const meritSum = days.reduce((s, d) => s + d.meritSum, 0);
  const meritCount = days.reduce((s, d) => s + d.meritCount, 0);
  const thuByCat = new Map<string, CategoryTotal>();
  const chiByCat = new Map<string, CategoryTotal>();
  if (meritSum > 0 || meritCount > 0) thuByCat.set(MERIT_CATEGORY_NAME, { name: MERIT_CATEGORY_NAME, amount: meritSum, count: meritCount });
  for (const e of entryRows) {
    const map = e.type === "thu" ? thuByCat : chiByCat;
    const cur = map.get(e.categoryName) ?? { name: e.categoryName, amount: 0, count: 0 };
    cur.amount += e.amount;
    cur.count += 1;
    map.set(e.categoryName, cur);
  }

  const totalThu = days.reduce((s, d) => s + d.thu, 0);
  const totalChi = days.reduce((s, d) => s + d.chi, 0);
  const first = days[0].lunar;
  const last = days[days.length - 1].lunar;

  return {
    year,
    month,
    settings,
    locked,
    beforeStart,
    opening,
    totalThu,
    totalChi,
    closing: opening + totalThu - totalChi,
    meritSum,
    meritCount,
    days,
    entries: entryRows,
    thuByCategory: [...thuByCat.values()].sort((a, b) => b.amount - a.amount),
    chiByCategory: [...chiByCat.values()].sort((a, b) => b.amount - a.amount),
    lunarSpan: { from: first, to: last },
  };
}

/* ------------------------------- Year report ------------------------------- */

export type MonthSummary = {
  month: number;
  thu: number;
  meritSum: number;
  chi: number;
  opening: number;
  closing: number;
  locked: boolean;
  beforeStart: boolean;
};

export async function getYearReport(year: number) {
  const settings = await getLedgerSettings();
  const { start, end } = vnYearRange(year);
  const lower = settings.startDate && settings.startDate > start ? settings.startDate : start;

  const [merits, entries, locks, opening] = await Promise.all([
    lower < end
      ? prisma.merit.findMany({ where: { createdAt: { gte: lower, lt: end } }, select: { amount: true, createdAt: true } })
      : Promise.resolve([] as Array<{ amount: number; createdAt: Date }>),
    prisma.ledgerEntry.findMany({
      where: { date: { gte: start, lt: end } },
      select: { type: true, amount: true, date: true, category: { select: { name: true } } },
    }),
    prisma.ledgerPeriodLock.findMany({ where: { year }, select: { month: true } }),
    balanceBefore(start, settings),
  ]);

  const lockedMonths = new Set(locks.map((l) => l.month));
  const months: MonthSummary[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    thu: 0,
    meritSum: 0,
    chi: 0,
    opening: 0,
    closing: 0,
    locked: lockedMonths.has(i + 1),
    beforeStart: !!settings.startDate && vnMonthRange(year, i + 1).end <= settings.startDate,
  }));

  for (const m of merits) {
    const mm = Number(vnDateKey(m.createdAt).slice(5, 7));
    months[mm - 1].meritSum += m.amount;
    months[mm - 1].thu += m.amount;
  }
  const thuByCat = new Map<string, number>();
  const chiByCat = new Map<string, number>();
  const meritTotal = merits.reduce((s, m) => s + m.amount, 0);
  if (meritTotal > 0) thuByCat.set(MERIT_CATEGORY_NAME, meritTotal);
  for (const e of entries) {
    const mm = Number(vnDateKey(e.date).slice(5, 7));
    if (e.type === "thu") months[mm - 1].thu += e.amount;
    else months[mm - 1].chi += e.amount;
    const map = e.type === "thu" ? thuByCat : chiByCat;
    map.set(e.category.name, (map.get(e.category.name) ?? 0) + e.amount);
  }

  let running = opening;
  for (const m of months) {
    m.opening = running;
    running += m.thu - m.chi;
    m.closing = running;
  }

  const toList = (map: Map<string, number>) =>
    [...map.entries()].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);

  return {
    year,
    settings,
    opening,
    closing: running,
    totalThu: months.reduce((s, m) => s + m.thu, 0),
    totalChi: months.reduce((s, m) => s + m.chi, 0),
    months,
    thuByCategory: toList(thuByCat),
    chiByCategory: toList(chiByCat),
  };
}
