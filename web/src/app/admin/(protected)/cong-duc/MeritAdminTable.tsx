"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatVnd } from "@/lib/format";
import {
  Alert,
  Badge,
  Button,
  tableClass,
  tableWrapClass,
  tbodyClass,
  tdClass,
  thClass,
  theadClass,
} from "@/components/admin/ui";

type MeritRow = {
  id: number;
  donorName: string;
  donorAddress: string;
  amount: number;
  note: string | null;
  createdAt: string;
  festival: { id: number; name: string; year: number };
};

export default function MeritAdminTable({ initial, canEdit }: { initial: MeritRow[]; canEdit: boolean }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editAmount, setEditAmount] = useState<string>("");
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When server-provided data changes (filters/pagination), refresh the table.
  useEffect(() => {
    setRows(initial);
    setDeleting(null);
    setEditingId(null);
    setEditName("");
    setEditAddress("");
    setEditAmount("");
    setEditNote("");
    setSaving(false);
    setError(null);
  }, [initial]);

  const total = useMemo(() => rows.reduce((sum, r) => sum + r.amount, 0), [rows]);

  function startEdit(row: MeritRow) {
    setError(null);
    setEditingId(row.id);
    setEditName(row.donorName);
    setEditAddress(row.donorAddress);
    setEditAmount(String(row.amount));
    setEditNote(row.note ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditAddress("");
    setEditAmount("");
    setEditNote("");
    setSaving(false);
  }

  async function saveEdit(id: number) {
    if (saving) return;
    const amountNum = Number(editAmount);
    if (!Number.isFinite(amountNum) || amountNum < 0 || !Number.isInteger(amountNum)) {
      setError("Số tiền không hợp lệ (phải là số nguyên >= 0)");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/merits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donorName: editName,
        donorAddress: editAddress,
        amount: amountNum,
        note: editNote.trim() ? editNote : null,
      }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Lưu thất bại");
      setSaving(false);
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              donorName: editName,
              donorAddress: editAddress,
              amount: amountNum,
              note: editNote.trim() ? editNote : null,
            }
          : r
      )
    );
    setSaving(false);
    setEditingId(null);
  }

  async function onDelete(id: number) {
    if (deleting) return;
    if (!confirm("Xoá công đức này?")) return;
    setDeleting(id);
    setError(null);
    const res = await fetch(`/api/merits/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Xoá thất bại");
      setDeleting(null);
      return;
    }

    // Update the visible table immediately, then refresh server data (totals/pagination).
    setRows((prev) => prev.filter((r) => r.id !== id));
    setDeleting(null);
    router.refresh();
  }

  const editInput = "h-9 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/15 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  return (
    <div className="space-y-3">
      {error ? <Alert>{error}</Alert> : null}

      <div className={tableWrapClass}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Tổng (theo danh sách đang hiển thị):{" "}
            <span className="font-semibold text-gray-800 dark:text-white/90">{formatVnd(total)}</span>
          </div>
          {!canEdit ? <Badge color="gray">Tài khoản staff: chỉ xem</Badge> : null}
        </div>

        <div className="custom-scrollbar overflow-x-auto">
          <table className={`${tableClass} min-w-[900px]`}>
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Ngày lễ</th>
                <th className={thClass}>Tên</th>
                <th className={thClass}>Địa chỉ</th>
                <th className={`${thClass} text-right`}>Số tiền</th>
                <th className={thClass}>Ghi chú</th>
                <th className={thClass}>Thời gian</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody className={tbodyClass}>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-5 py-10 text-center text-gray-500 dark:text-gray-400" colSpan={7}>
                    Chưa có dữ liệu.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const isEditing = canEdit && editingId === r.id;
                  return (
                    <tr key={r.id} className={isEditing ? "bg-brand-25 dark:bg-brand-500/5" : "hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"}>
                      <td className={tdClass}>
                        <div className="font-medium text-gray-800 dark:text-white/90">{r.festival.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{r.festival.year}</div>
                      </td>
                      <td className={`${tdClass} font-medium text-gray-800 dark:text-white/90`}>
                        {isEditing ? (
                          <input value={editName} onChange={(e) => setEditName(e.target.value)} className={editInput} />
                        ) : (
                          r.donorName
                        )}
                      </td>
                      <td className={tdClass}>
                        {isEditing ? (
                          <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className={editInput} />
                        ) : (
                          r.donorAddress
                        )}
                      </td>
                      <td className={`${tdClass} text-right font-semibold whitespace-nowrap text-brand-700 dark:text-brand-300`}>
                        {isEditing ? (
                          <input
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            inputMode="numeric"
                            className={`${editInput} w-32 text-right`}
                          />
                        ) : (
                          formatVnd(r.amount)
                        )}
                      </td>
                      <td className={tdClass}>
                        {isEditing ? (
                          <input value={editNote} onChange={(e) => setEditNote(e.target.value)} className={editInput} />
                        ) : (
                          r.note ?? ""
                        )}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap text-gray-500 dark:text-gray-400`}>
                        {new Date(r.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className={`${tdClass} text-right`}>
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <Button size="xs" onClick={() => saveEdit(r.id)} disabled={saving}>
                              {saving ? "Đang lưu..." : "Lưu"}
                            </Button>
                            <Button size="xs" variant="outline" onClick={cancelEdit}>
                              Huỷ
                            </Button>
                          </div>
                        ) : canEdit ? (
                          <div className="flex justify-end gap-2">
                            <Button size="xs" variant="outline" onClick={() => startEdit(r)}>
                              Sửa
                            </Button>
                            <Button size="xs" variant="danger" onClick={() => onDelete(r.id)} disabled={deleting === r.id}>
                              {deleting === r.id ? "Đang xoá..." : "Xoá"}
                            </Button>
                          </div>
                        ) : null}
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
