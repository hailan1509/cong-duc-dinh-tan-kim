"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Festival = { id: number; name: string; year: number };

function buildQueryFromForm(form: HTMLFormElement) {
  const fd = new FormData(form);
  const params = new URLSearchParams();
  for (const [k, v] of fd.entries()) {
    const value = String(v ?? "").trim();
    if (!value) continue;
    params.set(k, value);
  }
  // When filters change, reset pagination
  params.delete("page");
  return params;
}

export default function MeritFilters(props: {
  festivals: Festival[];
  defaultFestivalId?: string;
  defaultStartDate?: string;
  defaultEndDate?: string;
  defaultDonorName?: string;
  pageSize?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const formRef = useRef<HTMLFormElement | null>(null);

  const clearHref = useMemo(() => pathname, [pathname]);

  // Keep donorName input in sync if user navigates with back/forward
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const donor = form.elements.namedItem("donorName") as HTMLInputElement | null;
    if (donor) donor.value = sp.get("donorName") ?? props.defaultDonorName ?? "";
  }, [sp, props.defaultDonorName]);

  const submitNow = () => {
    const form = formRef.current;
    if (!form) return;
    const params = buildQueryFromForm(form);
    const pageSize = props.pageSize ?? (Number(sp.get("pageSize") || 0) || undefined);
    if (pageSize) params.set("pageSize", String(pageSize));
    router.replace(`${pathname}?${params.toString()}`);
    router.refresh();
  };

  return (
    <div className="rounded-xl border bg-white/80 p-4">
      <div className="text-sm font-semibold">Bộ lọc</div>
      <form ref={formRef} className="mt-3 grid gap-3 md:grid-cols-5" onSubmit={(e) => e.preventDefault()}>
        <label className="block md:col-span-2">
          <div className="text-xs font-medium text-slate-700">Ngày lễ</div>
          <select
            name="festivalId"
            defaultValue={props.defaultFestivalId ?? ""}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            onChange={submitNow}
          >
            <option value="">Tất cả</option>
            {props.festivals.map((f) => (
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
            defaultValue={props.defaultStartDate ?? ""}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            onChange={submitNow}
          />
        </label>

        <label className="block">
          <div className="text-xs font-medium text-slate-700">Ngày kết thúc</div>
          <input
            type="date"
            name="endDate"
            defaultValue={props.defaultEndDate ?? ""}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            onChange={submitNow}
          />
        </label>

        <label className="block md:col-span-2">
          <div className="text-xs font-medium text-slate-700">Tên người công đức (LIKE)</div>
          <input
            name="donorName"
            defaultValue={props.defaultDonorName ?? ""}
            placeholder="Ví dụ: Nguyễn"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            onBlur={submitNow}
          />
        </label>

        <div className="flex items-end gap-2 md:col-span-3">
          <a href={clearHref} className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50">
            Xoá lọc
          </a>
        </div>
      </form>
    </div>
  );
}

