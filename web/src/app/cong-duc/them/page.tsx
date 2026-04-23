import { prisma } from "@/lib/db";
import AddMeritForm from "./AddMeritForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AddMeritPage() {
  const festival = await prisma.festival.findFirst({
    where: { active: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!festival) {
    return (
      <div className="rounded-2xl border-2 border-[#8b0000]/15 bg-white/80 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.15)]">
        <div className="text-xl font-extrabold text-[#8b0000]">Thêm công đức</div>
        <div className="mt-2 text-sm text-slate-700">
          Bạn cần tạo và đặt{" "}
          <Link className="font-semibold underline decoration-[#ffd700] underline-offset-4" href="/admin/ngay-le">
            ngày lễ công đức (active)
          </Link>{" "}
          trước.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-[#8b0000]/15 bg-white/85 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.12)] md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-xl font-extrabold text-[#8b0000]">Thêm công đức</div>
          <div className="mt-1 text-xs font-semibold text-slate-700">
            <span className="font-extrabold">{festival.name}</span> ({festival.year})
          </div>
        </div>
        <Link
          className="inline-flex rounded-xl border border-[#8b0000]/20 bg-white/70 px-3 py-2 text-xs font-extrabold text-[#8b0000] shadow-sm hover:bg-white"
          href="/admin/cong-duc"
        >
          Quản trị
        </Link>
      </div>

      <div className="-mx-4 border-b border-[#8b0000]/10 pb-3 md:mx-0 md:border-b-0 md:pb-0" />

        <AddMeritForm
          festivals={[
            {
              id: festival.id,
              name: festival.name,
              startDate: festival.startDate.toISOString(),
              endDate: festival.endDate.toISOString(),
              year: festival.year,
            },
          ]}
        />
    </div>
  );
}

