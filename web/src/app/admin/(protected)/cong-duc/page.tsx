import Link from "next/link";
import { ButtonLink, PageHeader, StatCard } from "@/components/admin/ui";
import { IconCoins, IconFile, IconHash, IconPlus } from "@/components/admin/icons";
import { prisma } from "@/lib/db";
import { isValidDateKey, vnStartOfDay } from "@/lib/vnDate";
import MeritAdminTable from "./MeritAdminTable";
import MeritFilters from "./MeritFilters";
import { cookies } from "next/headers";
import { getAdminCookieName, verifyAdminToken } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

function formatCurrencyVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

// Day boundaries in Vietnam time (the server/container may run in UTC)
function parseDateStart(value: string | undefined) {
  if (!isValidDateKey(value)) return undefined;
  return vnStartOfDay(value);
}

function parseDateEnd(value: string | undefined) {
  if (!isValidDateKey(value)) return undefined;
  return new Date(vnStartOfDay(value).getTime() + 24 * 60 * 60 * 1000 - 1);
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
    <div>
      <PageHeader
        title="Danh sách công đức"
        description={canEdit ? "Xem, sửa và xoá công đức" : "Xem danh sách công đức"}
        crumbs={[{ label: "Quản trị", href: "/admin/cong-duc" }, { label: "Công đức" }]}
        actions={
          <ButtonLink href="/cong-duc/them">
            <IconPlus /> Thêm công đức
          </ButtonLink>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<IconCoins />}
          tone="brand"
          label="Tổng tiền (theo bộ lọc)"
          value={<span className="text-brand-700 dark:text-brand-300">{formatCurrencyVnd(sumAmount)}</span>}
        />
        <StatCard icon={<IconHash />} tone="gold" label="Tổng bản ghi" value={totalCount.toLocaleString("vi-VN")} />
        <StatCard
          icon={<IconFile />}
          tone="gray"
          label="Trang"
          value={
            <>
              {safePage} <span className="text-base font-medium text-gray-400">/ {totalPages}</span>
            </>
          }
          sub={`Mỗi trang ${pageSize} bản ghi`}
        />
      </div>

      <div className="space-y-6">
        <MeritFilters
          festivals={festivals.map((f) => ({ id: f.id, name: f.name, year: f.year }))}
          defaultFestivalId={festivalIdNum?.toString() ?? ""}
          defaultStartDate={sp.startDate ?? ""}
          defaultEndDate={sp.endDate ?? ""}
          defaultDonorName={donorName}
          pageSize={pageSize}
        />

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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              className={pagerClass(false, safePage <= 1)}
              href={buildPageHref(Math.max(1, safePage - 1))}
              aria-disabled={safePage <= 1}
            >
              ← Trước
            </Link>
            <Link
              className={pagerClass(false, safePage >= totalPages)}
              href={buildPageHref(Math.min(totalPages, safePage + 1))}
              aria-disabled={safePage >= totalPages}
            >
              Sau →
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {Array.from({ length: totalPages }).slice(0, 7).map((_, idx) => {
              const p = idx + 1;
              return (
                <Link key={p} href={buildPageHref(p)} className={pagerClass(p === safePage, false, true)}>
                  {p}
                </Link>
              );
            })}
            {totalPages > 7 ? <span className="px-2 text-gray-400">…</span> : null}
            {totalPages > 7 ? (
              <Link href={buildPageHref(totalPages)} className={pagerClass(safePage === totalPages, false, true)}>
                {totalPages}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function pagerClass(active: boolean, disabled: boolean, square = false) {
  return [
    "inline-flex h-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
    square ? "min-w-10 px-3" : "px-4",
    active
      ? "border-brand-600 bg-brand-600 text-white"
      : "border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5",
    disabled ? "pointer-events-none opacity-50" : "",
  ].join(" ");
}
