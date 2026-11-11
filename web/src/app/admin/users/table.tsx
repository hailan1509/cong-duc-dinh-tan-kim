"use client";

import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Input,
  Select,
  tableClass,
  tableWrapClass,
  tbodyClass,
  tdClass,
  thClass,
  theadClass,
} from "@/components/admin/ui";
import { IconPlus } from "@/components/admin/icons";

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
    <div className="space-y-6">
      <Card title="Tạo user" description="Admin có toàn quyền; staff chỉ xem danh sách và thêm công đức.">
        <form onSubmit={createUser} className="grid gap-4 md:grid-cols-4">
          <Field label="Tên đăng nhập">
            <Input
              placeholder="username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              autoComplete="off"
              required
            />
          </Field>
          <Field label="Mật khẩu">
            <Input
              placeholder="password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>
          <Field label="Quyền">
            <Select value={newRole} onChange={(e) => setNewRole(e.target.value as "admin" | "staff")}>
              <option value="admin">admin</option>
              <option value="staff">staff</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={creating} className="w-full">
              <IconPlus /> {creating ? "Đang tạo..." : "Tạo"}
            </Button>
          </div>
        </form>
      </Card>

      {error ? <Alert>{error}</Alert> : null}

      <div className={tableWrapClass}>
        <div className="custom-scrollbar overflow-x-auto">
          <table className={`${tableClass} min-w-[640px]`}>
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>ID</th>
                <th className={thClass}>Username</th>
                <th className={thClass}>Quyền</th>
                <th className={thClass}>Tạo lúc</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody className={tbodyClass}>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-5 py-10 text-center text-gray-500 dark:text-gray-400" colSpan={5}>
                    Chưa có user nào.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
                    <td className={`${tdClass} text-gray-500 dark:text-gray-400`}>{r.id}</td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                          {r.username.charAt(0).toUpperCase()}
                        </span>
                        <span className="font-medium text-gray-800 dark:text-white/90">{r.username}</span>
                      </div>
                    </td>
                    <td className={tdClass}>
                      <Badge color={r.role === "admin" ? "primary" : "gray"}>{r.role}</Badge>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-gray-500 dark:text-gray-400`}>
                      {new Date(r.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <div className="flex justify-end gap-2">
                        <Button size="xs" variant="outline" onClick={() => resetPassword(r.id)}>
                          Reset mật khẩu
                        </Button>
                        <Button size="xs" variant="danger" onClick={() => deleteUser(r.id)}>
                          Xoá
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
