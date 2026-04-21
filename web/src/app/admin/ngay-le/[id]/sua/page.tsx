import Link from "next/link";
import { prisma } from "@/lib/db";
import FestivalForm from "../../FestivalForm";
import { yyyyMmDd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EditFestivalPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const festivalId = Number(id);
  if (!Number.isFinite(festivalId)) {
    return (
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm text-slate-700">ID không hợp lệ.</div>
      </div>
    );
  }

  const festival = await prisma.festival.findUnique({ where: { id: festivalId } });
  if (!festival) {
    return (
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm text-slate-700">Không tìm thấy ngày lễ.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Sửa ngày lễ công đức</div>
            <div className="text-sm text-slate-600">
              {festival.name} ({yyyyMmDd(festival.startDate)} → {yyyyMmDd(festival.endDate)}) -{" "}
              {festival.year}
            </div>
          </div>
          <Link className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50" href="/admin/ngay-le">
            Quay lại
          </Link>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <FestivalForm
          mode="edit"
          id={festival.id}
          initial={{
            name: festival.name,
            startDate: yyyyMmDd(festival.startDate),
            endDate: yyyyMmDd(festival.endDate),
            year: festival.year,
            active: festival.active,
          }}
        />
      </div>
    </div>
  );
}

