"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Field, Input, Select, Textarea, buttonClass } from "@/components/admin/ui";
import { DENOMINATIONS } from "@/lib/ledgerConst";
import { numberToVietnameseWords } from "@/lib/vnWords";
import { LunarHint } from "./EntryForm";
import { vnd } from "./format";

type Festival = { id: number; name: string; year: number };

export default function BoxCountForm({
  today,
  festivals,
  defaultFestivalId,
  minDate,
}: {
  today: string;
  festivals: Festival[];
  defaultFestivalId: number | null;
  minDate?: string | null;
}) {
  const router = useRouter();
  const [date, setDate] = useState(today);
  const [location, setLocation] = useState("Hòm công đức chính");
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [participants, setParticipants] = useState("");
  const [festivalId, setFestivalId] = useState<number | "">(defaultFestivalId ?? "");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | { entryId: number; code: string; total: number }>(null);

  const total = DENOMINATIONS.reduce((s, v) => s + v * (Number(counts[v]) || 0), 0);
  const sheets = DENOMINATIONS.reduce((s, v) => s + (Number(counts[v]) || 0), 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (total <= 0) return setError("Chưa nhập số tờ");
    if (!confirm(`Xác nhận biên bản kiểm đếm: tổng ${vnd(total)}?`)) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/ledger/box-counts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        location,
        denominations: DENOMINATIONS.map((value) => ({ value, count: Number(counts[value]) || 0 })),
        participants,
        festivalId: festivalId || null,
        note: note.trim() || null,
      }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string; entry?: { id: number; code: string; amount: number } } | null;
    setSaving(false);
    if (!res.ok || !data?.entry) return setError(data?.error ?? "Lưu thất bại");
    setDone({ entryId: data.entry.id, code: data.entry.code, total: data.entry.amount });
    setCounts({});
    setNote("");
    router.refresh();
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-800 dark:text-white/90">Đã lập phiếu thu {done.code}</div>
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {vnd(done.total)} — <i>{numberToVietnameseWords(done.total)}</i>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href={`/admin/thu-chi/kiem-dem/${done.entryId}`} className={buttonClass("primary", "md")}>
            In biên bản
          </Link>
          <Button variant="outline" onClick={() => setDone(null)}>
            Kiểm đếm tiếp
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Ngày kiểm đếm" hint={<LunarHint dateKey={date} />}>
          <Input type="date" value={date} min={minDate ?? undefined} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="Hòm / vị trí">
          <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
        </Field>
      </div>

      <div>
        <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Số tờ theo mệnh giá</div>
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Mệnh giá</th>
                <th className="px-4 py-2 text-left font-medium">Số tờ</th>
                <th className="px-4 py-2 text-right font-medium">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {DENOMINATIONS.map((v) => {
                const c = Number(counts[v]) || 0;
                return (
                  <tr key={v}>
                    <td className="px-4 py-2 font-medium whitespace-nowrap text-gray-800 dark:text-white/90">{vnd(v)}</td>
                    <td className="px-4 py-2">
                      <input
                        inputMode="numeric"
                        value={counts[v] ?? ""}
                        onChange={(e) => setCounts((p) => ({ ...p, [v]: e.target.value.replace(/\D/g, "").slice(0, 7) }))}
                        className="h-9 w-24 rounded-lg border border-gray-300 bg-white px-3 text-right text-sm outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/15 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                        placeholder="0"
                        aria-label={`Số tờ ${vnd(v)}`}
                      />
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap text-gray-700 dark:text-gray-300">{c ? vnd(v * c) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gold-50 dark:bg-gold-400/10">
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white/90">Tổng cộng</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{sheets.toLocaleString("vi-VN")} tờ</td>
                <td className="px-4 py-3 text-right text-base font-bold whitespace-nowrap text-brand-700 dark:text-brand-300">{vnd(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="mt-1.5 text-xs text-gray-500 italic dark:text-gray-400">
          {total > 0 ? numberToVietnameseWords(total) : "Tiền bằng chữ sẽ hiện ở đây"}
        </div>
      </div>

      <Field label="Thành phần tham gia kiểm đếm" hint="Mỗi người một dòng: họ tên – vai trò (người giữ chìa khoá, người ghi sổ, đại diện giám sát…)">
        <Textarea
          value={participants}
          onChange={(e) => setParticipants(e.target.value)}
          placeholder={"Nguyễn Văn A – Thủ từ, giữ chìa khoá\nTrần Thị B – Ghi sổ thu chi\nLê Văn C – Đại diện Ban quản lý"}
          className="min-h-28"
          required
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
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
        <Field label="Ghi chú (không bắt buộc)">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Vd: gồm cả tiền đặt ban thờ, chân nhang" />
        </Field>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving || total <= 0}>
          {saving ? "Đang lưu..." : `Lập biên bản & phiếu thu ${total > 0 ? vnd(total) : ""}`}
        </Button>
      </div>
    </form>
  );
}
