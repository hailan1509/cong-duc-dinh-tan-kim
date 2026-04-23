import Link from "next/link";
import { prisma } from "@/lib/db";
import MeritAdminTable from "./MeritAdminTable";
import MeritFilters from "./MeritFilters";
import { cookies } from "next/headers";
import { getAdminCookieName, verifyAdminToken } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

function formatCurrencyVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function parseDateStart(value: string | undefined) {
  if (!value) return undefined;
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return undefined;
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDateEnd(value: string | undefined) {
  if (!value) return undefined;
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return undefined;
  d.setHours(23, 59, 59, 999);
  return d;
}

export default async function AdminMeritsPage(props: {
  searchParams: Promise<{
    festivalId?: string;
    startDate?: string;
    endDate?: string;
    donorName?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const sp = await props.searchParams;

  const token = (await cookies()).get(getAdminCookieName())?.value;
  const session = await verifyAdminToken(token);
  const canEdit = session.ok && session.role === "admin";

  const festivalIdNum =
    sp.festivalId && Number.isFinite(Number(sp.festivalId)) ? Number(sp.festivalId) : undefined;
  const start = parseDateStart(sp.startDate);
  const end = parseDateEnd(sp.endDate);
  const donorName = (sp.donorName ?? "").trim();
  const pageSize = Math.min(200, Math.max(10, Number(sp.pageSize || 50) || 50));
  const page = Math.max(1, Number(sp.page || 1) || 1);

  const festivals = await prisma.festival.findMany({
    orderBy: [{ year: "desc" }, { startDate: "desc" }],
  });

  const where = {
    ...(festivalIdNum ? { festivalId: festivalIdNum } : {}),
    ...(donorName ? { donorName: { contains: donorName } } : {}),
    ...(start || end
      ? {
          createdAt: {
            ...(start ? { gte: start } : {}),
            ...(end ? { lte: end } : {}),
          },
        }
      : {}),
  } as const;

  const [totalCount, sumAll, merits] = await prisma.$transaction([
    prisma.merit.count({ where }),
    prisma.merit.aggregate({ where, _sum: { amount: true } }),
    prisma.merit.findMany({
      where,
      include: { festival: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const sumAmount = sumAll._sum.amount ?? 0;

  const buildPageHref = (p: number) => {
    const params = new URLSearchParams();
    if (festivalIdNum) params.set("festivalId", String(festivalIdNum));
    if (sp.startDate) params.set("startDate", sp.startDate);
    if (sp.endDate) params.set("endDate", sp.endDate);
    if (donorName) params.set("donorName", donorName);
    params.set("pageSize", String(pageSize));
    params.set("page", String(p));
    return `/admin/cong-duc?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Quản trị công đức</div>
            <div className="text-sm text-slate-600">Xem và xoá công đức</div>
          </div>
          <div className="flex gap-2">
            <Link className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800" href="/cong-duc/them">
              Thêm công đức
            </Link>
          </div>
        </div>
      </div>

      <MeritFilters
        festivals={festivals.map((f) => ({ id: f.id, name: f.name, year: f.year }))}
        defaultFestivalId={festivalIdNum?.toString() ?? ""}
        defaultStartDate={sp.startDate ?? ""}
        defaultEndDate={sp.endDate ?? ""}
        defaultDonorName={donorName}
        pageSize={pageSize}
      />

      <div className="rounded-xl border bg-white/80 p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-slate-700">
            Tổng bản ghi: <span className="font-semibold text-slate-900">{totalCount}</span>
          </div>
          <div className="text-slate-700">
            Tổng tiền (tất cả bản ghi theo bộ lọc):{" "}
            <span className="font-extrabold text-[#8b0000]">{formatCurrencyVnd(sumAmount)}</span>
          </div>
          <div className="text-slate-700">
            Trang: <span className="font-semibold text-slate-900">{safePage}</span> / {totalPages} (mỗi trang{" "}
            <span className="font-semibold text-slate-900">{pageSize}</span>)
          </div>
        </div>
      </div>

      <MeritAdminTable
        canEdit={canEdit}
        initial={merits.map((m) => ({
          id: m.id,
          donorName: m.donorName,
          donorAddress: m.donorAddress,
          amount: m.amount,
          note: m.note,
          createdAt: m.createdAt.toISOString(),
          festival: { id: m.festival.id, name: m.festival.name, year: m.festival.year },
        }))}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white/80 p-4 text-sm">
        <div className="flex items-center gap-2">
          <Link
            className={`rounded-lg border bg-white px-3 py-2 hover:bg-slate-50 ${safePage <= 1 ? "pointer-events-none opacity-50" : ""}`}
            href={buildPageHref(Math.max(1, safePage - 1))}
          >
            ← Trước
          </Link>
          <Link
            className={`rounded-lg border bg-white px-3 py-2 hover:bg-slate-50 ${safePage >= totalPages ? "pointer-events-none opacity-50" : ""}`}
            href={buildPageHref(Math.min(totalPages, safePage + 1))}
          >
            Sau →
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: totalPages }).slice(0, 7).map((_, idx) => {
            const p = idx + 1;
            const active = p === safePage;
            return (
              <Link
                key={p}
                href={buildPageHref(p)}
                className={
                  active
                    ? "rounded-lg bg-slate-900 px-3 py-2 font-semibold text-white"
                    : "rounded-lg border bg-white px-3 py-2 hover:bg-slate-50"
                }
              >
                {p}
              </Link>
            );
          })}
          {totalPages > 7 ? <span className="px-2 text-slate-500">…</span> : null}
          {totalPages > 7 ? (
            <Link
              href={buildPageHref(totalPages)}
              className={
                safePage === totalPages
                  ? "rounded-lg bg-slate-900 px-3 py-2 font-semibold text-white"
                  : "rounded-lg border bg-white px-3 py-2 hover:bg-slate-50"
              }
            >
              {totalPages}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

