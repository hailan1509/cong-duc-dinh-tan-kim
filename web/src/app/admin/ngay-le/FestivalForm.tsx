"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <div className="text-xs font-medium text-slate-700">Tên lễ</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            required
          />
        </label>

        <label className="block">
          <div className="text-xs font-medium text-slate-700">Ngày bắt đầu</div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            required
          />
        </label>

        <label className="block">
          <div className="text-xs font-medium text-slate-700">Ngày kết thúc</div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            required
          />
        </label>

        <label className="block">
          <div className="text-xs font-medium text-slate-700">Năm</div>
          <input
            type="number"
            min={1900}
            max={3000}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            required
          />
        </label>

        <label className="flex items-center gap-2 md:col-span-2">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm font-medium text-slate-800">Đặt làm ngày lễ đang active</span>
        </label>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        disabled={saving || !canSubmit}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {saving ? "Đang lưu..." : props.mode === "edit" ? "Lưu thay đổi" : "Tạo ngày lễ"}
      </button>
    </form>
  );
}

