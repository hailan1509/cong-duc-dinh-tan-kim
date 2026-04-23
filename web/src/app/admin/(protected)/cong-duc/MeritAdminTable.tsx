"use client";

import { useEffect, useMemo, useState } from "react";
import { formatVnd } from "@/lib/format";

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
  const [rows, setRows] = useState(initial);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
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
    setEditNote(row.note ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditAddress("");
    setEditNote("");
    setSaving(false);
  }

  async function saveEdit(id: number) {
    if (saving) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/merits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donorName: editName,
        donorAddress: editAddress,
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
        r.id === id ? { ...r, donorName: editName, donorAddress: editAddress, note: editNote.trim() ? editNote : null } : r
      )
    );
    setSaving(false);
    setEditingId(null);
  }

  async function onDelete(id: number) {
    if (deleting) return;
    if (!confirm("Xoá công đức này?")) return;
    setDeleting(id);
    const res = await fetch(`/api/merits/${id}`, { method: "DELETE" });
    if (res.ok) setRows((prev) => prev.filter((r) => r.id !== id));
    setDeleting(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          Tổng (theo danh sách đang hiển thị): <span className="font-semibold text-slate-900">{formatVnd(total)}</span>
        </div>
        {!canEdit ? <div className="text-xs font-semibold text-slate-500">Tài khoản staff: chỉ xem</div> : null}
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Ngày lễ</th>
              <th className="px-4 py-3">Tên</th>
              <th className="px-4 py-3">Địa chỉ</th>
              <th className="px-4 py-3 text-right">Số tiền</th>
              <th className="px-4 py-3">Ghi chú</th>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-600" colSpan={7}>
                  Chưa có dữ liệu.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.festival.name}</div>
                    <div className="text-xs text-slate-600">{r.festival.year}</div>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {canEdit && editingId === r.id ? (
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-md border px-2 py-1 text-sm" />
                    ) : (
                      r.donorName
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {canEdit && editingId === r.id ? (
                      <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="w-full rounded-md border px-2 py-1 text-sm" />
                    ) : (
                      r.donorAddress
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatVnd(r.amount)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {canEdit && editingId === r.id ? (
                      <input value={editNote} onChange={(e) => setEditNote(e.target.value)} className="w-full rounded-md border px-2 py-1 text-sm" />
                    ) : (
                      r.note ?? ""
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{new Date(r.createdAt).toLocaleString("vi-VN")}</td>
                  <td className="px-4 py-3 text-right">
                    {canEdit && editingId === r.id ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => saveEdit(r.id)} disabled={saving} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60">
                          {saving ? "Đang lưu..." : "Lưu"}
                        </button>
                        <button onClick={cancelEdit} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50">
                          Huỷ
                        </button>
                      </div>
                    ) : canEdit ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => startEdit(r)} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50">
                          Sửa
                        </button>
                        <button onClick={() => onDelete(r.id)} disabled={deleting === r.id} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-60">
                          {deleting === r.id ? "Đang xoá..." : "Xoá"}
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

