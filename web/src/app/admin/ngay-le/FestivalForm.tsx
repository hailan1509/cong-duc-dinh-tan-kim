"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Alert, Button, checkboxClass, Field, Input } from "@/components/admin/ui";

type Props =
  | { mode: "create" }
  | {
      mode: "edit";
      id: number;
      initial: { name: string; startDate: string; endDate: string; year: number; active: boolean };
    };

export default function FestivalForm(props: Props) {
  const router = useRouter();
  const [name, setName] = useState(props.mode === "edit" ? props.initial.name : "");
  const [startDate, setStartDate] = useState(props.mode === "edit" ? props.initial.startDate : "");
  const [endDate, setEndDate] = useState(props.mode === "edit" ? props.initial.endDate : "");
  const [year, setYear] = useState<number>(
    props.mode === "edit" ? props.initial.year : new Date().getFullYear()
  );
  const [active, setActive] = useState<boolean>(props.mode === "edit" ? props.initial.active : false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && startDate.length > 0 && endDate.length > 0 && year >= 1900;
  }, [name, startDate, endDate, year]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !canSubmit) return;
    setSaving(true);
    setError(null);

    const url = props.mode === "edit" ? `/api/festivals/${props.id}` : "/api/festivals";
    const method = props.mode === "edit" ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, startDate, endDate, year, active }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Lỗi khi lưu");
      setSaving(false);
      return;
    }

    router.push("/admin/ngay-le");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Tên lễ" className="md:col-span-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Lễ hội đình Tân Kim" required />
        </Field>

        <Field label="Ngày bắt đầu">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </Field>

        <Field label="Ngày kết thúc">
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </Field>

        <Field label="Năm">
          <Input
            type="number"
            min={1900}
            max={3000}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            required
          />
        </Field>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 md:col-span-2 dark:border-gray-800">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className={checkboxClass}
          />
          <span>
            <span className="block text-sm font-medium text-gray-800 dark:text-white/90">Đặt làm ngày lễ đang active</span>
            <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
              Bảng vàng và form thêm công đức sẽ dùng ngày lễ này.
            </span>
          </span>
        </label>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving || !canSubmit}>
          {saving ? "Đang lưu..." : props.mode === "edit" ? "Lưu thay đổi" : "Tạo ngày lễ"}
        </Button>
      </div>
    </form>
  );
}
