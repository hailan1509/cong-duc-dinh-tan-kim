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
      <div className="rounded-xl border bg-white p-4">
        <div className="text-lg font-semibold">Thêm công đức</div>
        <div className="mt-2 text-sm text-slate-600">
          Bạn cần tạo và đặt <Link className="underline" href="/admin/ngay-le">ngày lễ công đức (active)</Link>{" "}
          trước.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="text-lg font-semibold">Thêm công đức</div>
      </div>

      <div className="rounded-xl border bg-white p-4">
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
    </div>
  );
}

