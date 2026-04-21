import Link from "next/link";
import AddFestivalForm from "../AddFestivalForm";

export default function AddFestivalPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Thêm ngày lễ công đức</div>
            <div className="text-sm text-slate-600">Tên lễ, ngày bắt đầu, ngày kết thúc, năm</div>
          </div>
          <Link className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50" href="/admin/ngay-le">
            Quay lại
          </Link>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <AddFestivalForm />
      </div>
    </div>
  );
}

