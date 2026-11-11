"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buttonClass, Card, Field, Input, Select } from "@/components/admin/ui";

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
    <Card title="Bộ lọc" bodyClassName="p-5 sm:p-6">
      <form ref={formRef} className="grid gap-4 md:grid-cols-6" onSubmit={(e) => e.preventDefault()}>
        <Field label="Ngày lễ" className="md:col-span-2">
          <Select name="festivalId" defaultValue={props.defaultFestivalId ?? ""} onChange={submitNow}>
            <option value="">Tất cả</option>
            {props.festivals.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} - {f.year}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Từ ngày">
          <Input type="date" name="startDate" defaultValue={props.defaultStartDate ?? ""} onChange={submitNow} />
        </Field>

        <Field label="Đến ngày">
          <Input type="date" name="endDate" defaultValue={props.defaultEndDate ?? ""} onChange={submitNow} />
        </Field>

        <Field label="Tên người công đức" className="md:col-span-2">
          <Input
            name="donorName"
            defaultValue={props.defaultDonorName ?? ""}
            placeholder="Ví dụ: Nguyễn"
            onBlur={submitNow}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitNow();
            }}
          />
        </Field>

        <div className="flex items-end md:col-span-6">
          <a href={clearHref} className={buttonClass("outline", "sm")}>
            Xoá lọc
          </a>
        </div>
      </form>
    </Card>
  );
}
