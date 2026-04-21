import Link from "next/link";
import { prisma } from "@/lib/db";
import MeritAdminTable from "./MeritAdminTable";
import AdminLogoutButton from "../AdminLogoutButton";

export const dynamic = "force-dynamic";

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
  }>;
}) {
  const sp = await props.searchParams;

  const festivalIdNum =
    sp.festivalId && Number.isFinite(Number(sp.festivalId)) ? Number(sp.festivalId) : undefined;
  const start = parseDateStart(sp.startDate);
  const end = parseDateEnd(sp.endDate);
  const donorName = (sp.donorName ?? "").trim();

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

  const [totalCount, merits] = await prisma.$transaction([
    prisma.merit.count({ where }),
    prisma.merit.findMany({
      where,
      include: { festival: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Quản trị công đức</div>
            <div className="text-sm text-slate-600">Xem và xoá công đức</div>
          </div>
          <div className="flex gap-2">
            <AdminLogoutButton />
            <Link className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50" href="/admin/ngay-le">
              Quản lý ngày lễ
            </Link>
            <Link className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800" href="/cong-duc/them">
              Thêm công đức
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm font-semibold">Bộ lọc</div>
        <form className="mt-3 grid gap-3 md:grid-cols-5" action="/admin/cong-duc" method="get">
          <label className="block md:col-span-2">
            <div className="text-xs font-medium text-slate-700">Ngày lễ</div>
            <select
              name="festivalId"
              defaultValue={festivalIdNum?.toString() ?? ""}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">Tất cả</option>
              {festivals.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} - {f.year}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-xs font-medium text-slate-700">Ngày bắt đầu</div>
            <input
              type="date"
              name="startDate"
              defaultValue={sp.startDate ?? ""}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <div className="text-xs font-medium text-slate-700">Ngày kết thúc</div>
            <input
              type="date"
              name="endDate"
              defaultValue={sp.endDate ?? ""}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <label className="block md:col-span-2">
            <div className="text-xs font-medium text-slate-700">Tên người công đức (LIKE)</div>
            <input
              name="donorName"
              defaultValue={donorName}
              placeholder="Ví dụ: Nguyễn"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <div className="flex items-end gap-2 md:col-span-3">
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Lọc
            </button>
            <Link
              href="/admin/cong-duc"
              className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50"
            >
              Xoá lọc
            </Link>
          </div>
        </form>
        <div className="mt-3 text-xs text-slate-600">
          Tổng bản ghi: <span className="font-semibold text-slate-900">{totalCount}</span>
        </div>
      </div>

      <MeritAdminTable
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
    </div>
  );
}

