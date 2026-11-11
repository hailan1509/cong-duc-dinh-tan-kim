"use client";

import { useState } from "react";
import { yyyyMmDd } from "@/lib/format";
import Link from "next/link";
import {
  Alert,
  Badge,
  Button,
  buttonClass,
  tableClass,
  tableWrapClass,
  tbodyClass,
  tdClass,
  thClass,
  theadClass,
} from "@/components/admin/ui";

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
      {error ? <Alert>{error}</Alert> : null}

      <div className={tableWrapClass}>
        <div className="custom-scrollbar overflow-x-auto">
          <table className={`${tableClass} min-w-[720px]`}>
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Trạng thái</th>
                <th className={thClass}>Tên lễ</th>
                <th className={thClass}>Thời gian</th>
                <th className={thClass}>Năm</th>
                <th className={`${thClass} text-right`}>Số công đức</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody className={tbodyClass}>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-5 py-10 text-center text-gray-500 dark:text-gray-400" colSpan={6}>
                    Chưa có ngày lễ nào. Hãy tạo ngày lễ trước.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const disableDelete = r.meritCount > 0;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
                      <td className={tdClass}>
                        {r.active ? (
                          <Badge color="success">
                            <span className="size-1.5 rounded-full bg-current" /> Đang active
                          </Badge>
                        ) : (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => onSetActive(r.id)}
                            disabled={activating === r.id}
                          >
                            {activating === r.id ? "..." : "Đặt active"}
                          </Button>
                        )}
                      </td>
                      <td className={`${tdClass} font-medium text-gray-800 dark:text-white/90`}>{r.name}</td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        {yyyyMmDd(new Date(r.startDate))} → {yyyyMmDd(new Date(r.endDate))}
                      </td>
                      <td className={tdClass}>{r.year}</td>
                      <td className={`${tdClass} text-right font-semibold text-gray-800 dark:text-white/90`}>{r.meritCount}</td>
                      <td className={`${tdClass} text-right`}>
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/ngay-le/${r.id}/sua`} className={buttonClass("outline", "xs")}>
                            Sửa
                          </Link>
                          <Button
                            size="xs"
                            variant="danger"
                            onClick={() => onDelete(r.id)}
                            disabled={disableDelete || deleting === r.id}
                            title={disableDelete ? "Không thể xoá vì đã có công đức" : "Xoá ngày lễ"}
                          >
                            {deleting === r.id ? "Đang xoá..." : "Xoá"}
                          </Button>
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
    </div>
  );
}
