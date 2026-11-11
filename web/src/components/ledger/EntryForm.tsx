"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Alert, Button, Field, Input, Select, Textarea, cn } from "@/components/admin/ui";
import { lunarInfo, lunarYearName } from "@/lib/lunar";
import { numberToVietnameseWords } from "@/lib/vnWords";
import { vnd } from "./format";

type Category = { id: number; type: "thu" | "chi"; name: string; active: boolean };
type Festival = { id: number; name: string; year: number };

export type EntryFormInitial = {
  type: "thu" | "chi";
  date: string;
  amount: number;
  categoryId: number | null;
  festivalId: number | null;
  party: string;
  description: string;
};

export function LunarHint({ dateKey }: { dateKey: string }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const [y, m, d] = dateKey.split("-").map(Number);
  const l = lunarInfo(d, m, y);
  return (
    <span>
      Âm lịch: <b className={l.isFirst || l.isFull || l.holiday ? "text-brand-600 dark:text-brand-300" : ""}>{l.label}</b> năm{" "}
      {lunarYearName(l.year)}
      {l.isFirst ? " · Mùng 1" : l.isFull ? " · Ngày rằm" : ""}
      {l.holiday ? ` · ${l.holiday}` : ""}
    </span>
  );
}

export default function EntryForm({
  mode,
  id,
  initial,
  categories,
  festivals,
  minDate,
}: {
  mode: "create" | "edit";
  id?: number;
  initial: EntryFormInitial;
  categories: Category[];
  festivals: Festival[];
  minDate?: string | null;
}) {
  const router = useRouter();
  const [type, setType] = useState(initial.type);
  const [date, setDate] = useState(initial.date);
  const [amountText, setAmountText] = useState(initial.amount ? String(initial.amount) : "");
  const [categoryId, setCategoryId] = useState<number | "">(initial.categoryId ?? "");
  const [festivalId, setFestivalId] = useState<number | "">(initial.festivalId ?? "");
  const [party, setParty] = useState(initial.party);
  const [description, setDescription] = useState(initial.description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = Number(amountText) || 0;
  const options = useMemo(
    () => categories.filter((c) => c.type === type && (c.active || c.id === initial.categoryId)),
    [categories, type, initial.categoryId]
  );

  function switchType(t: "thu" | "chi") {
    setType(t);
    setCategoryId("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!categoryId) return setError("Chọn danh mục");
    if (amount <= 0) return setError("Số tiền phải lớn hơn 0");
    setSaving(true);
    setError(null);
    const res = await fetch(mode === "edit" ? `/api/ledger/entries/${id}` : "/api/ledger/entries", {
      method: mode === "edit" ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        date,
        amount,
        categoryId,
        festivalId: festivalId || null,
        party: party.trim() || null,
        description,
      }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Lưu thất bại");
      setSaving(false);
      return;
    }
    router.push(`/admin/thu-chi?y=${date.slice(0, 4)}&m=${Number(date.slice(5, 7))}&d=${date}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {mode === "create" ? (
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1 dark:bg-white/5">
          {(["thu", "chi"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchType(t)}
              className={cn(
                "h-10 rounded-lg text-sm font-semibold transition-colors",
                type === t
                  ? t === "thu"
                    ? "bg-white text-emerald-700 shadow-theme-xs dark:bg-gray-800 dark:text-emerald-400"
                    : "bg-white text-red-600 shadow-theme-xs dark:bg-gray-800 dark:text-red-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              )}
            >
              {t === "thu" ? "Phiếu thu" : "Phiếu chi"}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Ngày phát sinh" hint={<LunarHint dateKey={date} />}>
          <Input type="date" value={date} min={minDate ?? undefined} onChange={(e) => setDate(e.target.value)} required />
        </Field>

        <Field label="Danh mục">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")} required>
            <option value="">— Chọn danh mục —</option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.active ? "" : " (đã tắt)"}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Số tiền (VND)"
          className="md:col-span-2"
          hint={
            amount > 0 ? (
              <>
                <b className={type === "thu" ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>{vnd(amount)}</b>{" "}
                — <i>{numberToVietnameseWords(amount)}</i>
              </>
            ) : (
              "Tiền bằng chữ sẽ hiện ở đây"
            )
          }
        >
          <Input
            inputMode="numeric"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""))}
            placeholder="Nhập số tiền"
            className="h-12 text-base"
            required
          />
        </Field>

        <Field
          label="Nội dung"
          className="md:col-span-2"
          hint={type === "chi" ? "Nội dung phiếu chi được hiện trên trang công khai thu chi (nếu đang bật công khai)." : undefined}
        >
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={type === "thu" ? "Ví dụ: Tiền trông xe dịp lễ hội" : "Ví dụ: Mua hương, hoa, lễ vật ngày rằm"}
            required
          />
        </Field>

        <Field label={type === "thu" ? "Người nộp (không bắt buộc)" : "Người nhận (không bắt buộc)"}>
          <Input value={party} onChange={(e) => setParty(e.target.value)} placeholder="Họ tên / đơn vị" />
        </Field>

        <Field label="Gắn với ngày lễ (không bắt buộc)">
          <Select value={festivalId} onChange={(e) => setFestivalId(e.target.value ? Number(e.target.value) : "")}>
            <option value="">— Không —</option>
            {festivals.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} - {f.year}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? "Đang lưu..." : mode === "edit" ? "Lưu thay đổi" : type === "thu" ? "Lưu phiếu thu" : "Lưu phiếu chi"}
        </Button>
      </div>
    </form>
  );
}
