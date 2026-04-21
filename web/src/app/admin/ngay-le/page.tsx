import Link from "next/link";
import { prisma } from "@/lib/db";
import AdminLogoutButton from "../AdminLogoutButton";
import FestivalAdminTable from "./table";

export const dynamic = "force-dynamic";

export default async function AdminFestivalsPage() {
  const festivals = await prisma.festival.findMany({
    orderBy: [{ year: "desc" }, { startDate: "desc" }],
    include: { _count: { select: { merits: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Quản lý ngày lễ công đức</div>
            <div className="text-sm text-slate-600">Tạo ngày lễ để gắn công đức</div>
          </div>
          <div className="flex gap-2">
            <AdminLogoutButton />
            <Link className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50" href="/admin/cong-duc">
              Quản trị công đức
            </Link>
            <Link className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800" href="/admin/ngay-le/them">
              Thêm ngày lễ
            </Link>
          </div>
        </div>
      </div>

      <FestivalAdminTable
        initial={festivals.map((f: (typeof festivals)[number]) => ({
          id: f.id,
          name: f.name,
          startDate: f.startDate.toISOString(),
          endDate: f.endDate.toISOString(),
          year: f.year,
          active: f.active,
          meritCount: f._count.merits,
        }))}
      />
    </div>
  );
}

