"use client";

import { useState } from "react";

type Row = {
  id: number;
  username: string;
  role: "admin" | "staff";
  createdAt: string;
};

export default function UsersTable({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "staff">("admin");

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;
    setError(null);
    setCreating(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Tạo user thất bại");
      setCreating(false);
      return;
    }
    const data = (await res.json()) as { user: { id: number; username: string; role: "admin" | "staff"; createdAt: string } };
    setRows((prev) => [...prev, { ...data.user, createdAt: data.user.createdAt }]);
    setNewUsername("");
    setNewPassword("");
    setNewRole("admin");
    setCreating(false);
  }

  async function resetPassword(id: number) {
    const password = prompt("Nhập mật khẩu mới (>= 6 ký tự):");
    if (!password) return;
    setError(null);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Reset mật khẩu thất bại");
    }
  }

  async function deleteUser(id: number) {
    if (!confirm("Xoá user này?")) return;
    setError(null);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Xoá thất bại");
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm font-semibold">Tạo user</div>
        <form onSubmit={createUser} className="mt-3 grid gap-3 md:grid-cols-4">
          <input
            placeholder="username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            required
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as "admin" | "staff")}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="admin">admin</option>
            <option value="staff">staff</option>
          </select>
          <button
            disabled={creating}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {creating ? "Đang tạo..." : "Tạo"}
          </button>
        </form>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Tạo lúc</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-600" colSpan={5}>
                  Chưa có user nào.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">{r.id}</td>
                  <td className="px-4 py-3 font-medium">{r.username}</td>
                  <td className="px-4 py-3">{r.role}</td>
                  <td className="px-4 py-3 text-slate-600">{new Date(r.createdAt).toLocaleString("vi-VN")}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => resetPassword(r.id)}
                        className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50"
                      >
                        Reset mật khẩu
                      </button>
                      <button
                        onClick={() => deleteUser(r.id)}
                        className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50"
                      >
                        Xoá
                      </button>
                    </div>
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

