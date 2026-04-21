"use client";

import { useState } from "react";
import { yyyyMmDd } from "@/lib/format";
import Link from "next/link";

type Row = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  year: number;
  active: boolean;
  meritCount: number;
};

export default function FestivalAdminTable({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [activating, setActivating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSetActive(id: number) {
    if (activating) return;
    setError(null);
    setActivating(id);
    const row = rows.find((r) => r.id === id);
    const res = await fetch(`/api/festivals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: row?.name ?? "",
        startDate: row?.startDate ?? "",
        endDate: row?.endDate ?? "",
        year: row?.year ?? new Date().getFullYear(),
        active: true,
      }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Không set active được");
      setActivating(null);
      return;
    }
    setRows((prev) => prev.map((r) => ({ ...r, active: r.id === id })));
    setActivating(null);
  }

  async function onDelete(id: number) {
    if (deleting) return;
    setError(null);
    if (!confirm("Xoá ngày lễ này? (Chỉ xoá được khi chưa có công đức)")) return;
    setDeleting(id);
    const res = await fetch(`/api/festivals/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Không xoá được");
      setDeleting(null);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    setDeleting(null);
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Tên lễ</th>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Năm</th>
              <th className="px-4 py-3 text-right">Số công đức</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-600" colSpan={6}>
                  Chưa có ngày lễ nào. Hãy tạo ngày lễ trước.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const disableDelete = r.meritCount > 0;
                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3">
                      {r.active ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                          ACTIVE
                        </span>
                      ) : (
                        <button
                          onClick={() => onSetActive(r.id)}
                          disabled={activating === r.id}
                          className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-60"
                        >
                          {activating === r.id ? "..." : "Set active"}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {yyyyMmDd(new Date(r.startDate))} → {yyyyMmDd(new Date(r.endDate))}
                    </td>
                    <td className="px-4 py-3">{r.year}</td>
                    <td className="px-4 py-3 text-right font-semibold">{r.meritCount}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/ngay-le/${r.id}/sua`}
                          className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50"
                        >
                          Sửa
                        </Link>
                        <button
                          onClick={() => onDelete(r.id)}
                          disabled={disableDelete || deleting === r.id}
                          title={disableDelete ? "Không thể xoá vì đã có công đức" : "Xoá ngày lễ"}
                          className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deleting === r.id ? "Đang xoá..." : "Xoá"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

