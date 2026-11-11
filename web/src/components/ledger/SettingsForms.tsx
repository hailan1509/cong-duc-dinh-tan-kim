"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Badge, Button, Field, Input, Select, checkboxClass } from "@/components/admin/ui";
import { numberToVietnameseWords } from "@/lib/vnWords";
import { LunarHint } from "./EntryForm";
import { vnd } from "./format";

async function errorOf(res: Response, fallback: string) {
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? fallback;
}

export function LedgerSettingsForm({
  initial,
}: {
  initial: { openingBalance: number; startDate: string | null; isPublic: boolean };
}) {
  const router = useRouter();
  const [opening, setOpening] = useState(String(initial.openingBalance || ""));
  const [startDate, setStartDate] = useState(initial.startDate ?? "");
  const [isPublic, setIsPublic] = useState(initial.isPublic);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const openingNum = Number(opening) || 0;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/ledger/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openingBalance: openingNum, startDate: startDate || null, isPublic }),
    });
    setSaving(false);
    setMsg(res.ok ? { ok: true, text: "Đã lưu cài đặt" } : { ok: false, text: await errorOf(res, "Lưu thất bại") });
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Ngày bắt đầu dùng sổ" hint={startDate ? <LunarHint dateKey={startDate} /> : "Công đức và phiếu trước ngày này không tính vào tồn quỹ"}>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field
          label="Tồn quỹ tiền mặt tại ngày bắt đầu"
          hint={openingNum > 0 ? `${vnd(openingNum)} — ${numberToVietnameseWords(openingNum)}` : "Số tiền mặt thực có khi bắt đầu dùng sổ"}
        >
          <Input inputMode="numeric" value={opening} onChange={(e) => setOpening(e.target.value.replace(/\D/g, ""))} placeholder="0" />
        </Field>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className={checkboxClass} />
        <span>
          <span className="block text-sm font-medium text-gray-800 dark:text-white/90">Công khai thu chi trên trang /thu-chi</span>
          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
            Ai cũng xem được tổng thu, tổng chi, tồn quỹ và nội dung các khoản chi theo tháng (không hiện tên người công đức).
          </span>
        </span>
      </label>

      {msg ? <Alert variant={msg.ok ? "success" : "error"}>{msg.text}</Alert> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu cài đặt"}
        </Button>
      </div>
    </form>
  );
}

type Cat = { id: number; type: "thu" | "chi"; name: string; active: boolean; system: boolean; count: number };

export function CategoryManager({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [type, setType] = useState<"thu" | "chi">("chi");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(url: string, method: string, body?: unknown) {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) setError(await errorOf(res, "Không thực hiện được"));
    setBusy(false);
    router.refresh();
    return res.ok;
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (await call("/api/ledger/categories", "POST", { type, name })) setName("");
  }

  async function rename(c: Cat) {
    const next = prompt("Tên danh mục mới:", c.name);
    if (next && next.trim() && next.trim() !== c.name) await call(`/api/ledger/categories/${c.id}`, "PATCH", { name: next.trim() });
  }

  return (
    <div className="space-y-5">
      <form onSubmit={add} className="grid gap-3 sm:grid-cols-[140px_1fr_auto]">
        <Select value={type} onChange={(e) => setType(e.target.value as "thu" | "chi")} aria-label="Loại">
          <option value="thu">Thu</option>
          <option value="chi">Chi</option>
        </Select>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên danh mục mới" aria-label="Tên danh mục" />
        <Button type="submit" disabled={busy || !name.trim()}>
          Thêm
        </Button>
      </form>
      {error ? <Alert>{error}</Alert> : null}

      {(["thu", "chi"] as const).map((t) => (
        <div key={t}>
          <div className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">{t === "thu" ? "Danh mục thu" : "Danh mục chi"}</div>
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {t === "thu" ? (
              <li className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="text-gray-800 dark:text-white/90">Công đức ghi danh</span>
                <Badge color="gold">Tự động từ danh sách công đức</Badge>
              </li>
            ) : null}
            {categories
              .filter((c) => c.type === t)
              .map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className={c.active ? "text-gray-800 dark:text-white/90" : "text-gray-400 line-through"}>
                    {c.name} <span className="text-xs text-gray-400">({c.count} phiếu)</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {c.system ? (
                      <Badge color="gold">Từ biên bản kiểm đếm</Badge>
                    ) : (
                      <>
                        <Button size="xs" variant="outline" onClick={() => rename(c)} disabled={busy}>
                          Đổi tên
                        </Button>
                        <Button size="xs" variant="outline" onClick={() => call(`/api/ledger/categories/${c.id}`, "PATCH", { active: !c.active })} disabled={busy}>
                          {c.active ? "Tắt" : "Bật"}
                        </Button>
                        {c.count === 0 ? (
                          <Button
                            size="xs"
                            variant="danger"
                            onClick={() => confirm(`Xoá danh mục "${c.name}"?`) && call(`/api/ledger/categories/${c.id}`, "DELETE")}
                            disabled={busy}
                          >
                            Xoá
                          </Button>
                        ) : null}
                      </>
                    )}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
