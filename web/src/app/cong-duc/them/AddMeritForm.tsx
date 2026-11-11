"use client";

import { useMemo, useState } from "react";
import { numberToVietnameseWords } from "@/lib/vnWords";
import { Alert, Button, checkboxClass, Field, Input, Textarea } from "@/components/admin/ui";
import { IconChevronDown } from "@/components/admin/icons";

type Festival = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  year: number;
};

function formatCurrencyVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export default function AddMeritForm({ festivals }: { festivals: Festival[] }) {
  const [festivalId, setFestivalId] = useState<number>(festivals[0]?.id ?? 0);
  const [honorific, setHonorific] = useState<"none" | "ong" | "ba" | "anh" | "chi">("none");
  const [announce, setAnnounce] = useState(true);
  const [donorName, setDonorName] = useState("");
  const [donorAddress, setDonorAddress] = useState("");
  const [amountText, setAmountText] = useState<string>("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<null | {
    donorName: string;
    donorAddress: string;
    amount: number;
  }>(null);
  const [saving, setSaving] = useState(false);

  function titleCaseAfterSpaces(input: string) {
    // Uppercase the first letter and any letter right after whitespace.
    return String(input || "").replace(/(^|\s)(\p{L})/gu, (_, ws: string, ch: string) => {
      return `${ws}${ch.toLocaleUpperCase("vi-VN")}`;
    });
  }

  const amount = useMemo(() => {
    if (!amountText) return 0;
    const n = Number.parseInt(amountText, 10);
    return Number.isFinite(n) ? n : 0;
  }, [amountText]);

  const canSubmit = useMemo(() => {
    return !!festivalId && donorName.trim().length > 0 && donorAddress.trim().length > 0 && amount >= 0;
  }, [festivalId, donorName, donorAddress, amount]);

  function normalizeAmountInput(raw: string) {
    const digits = raw.replace(/[^\d]/g, "");
    if (!digits) return "";
    const trimmed = digits.replace(/^0+/, "");
    return trimmed === "" ? "0" : trimmed;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/merits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        festivalId,
        honorific,
        announce,
        donorName,
        donorAddress,
        amount,
        note: note.trim() ? note : null,
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Lỗi khi lưu");
      setSaving(false);
      return;
    }

    // Keep page, allow fast consecutive input
    setSuccessModal({ donorName, donorAddress, amount });
    setDonorName("");
    setDonorAddress("");
    setAmountText("");
    setNote("");
    setSuccess("Đã lưu công đức.");
    setSaving(false);
  }

  const bigInput = "h-12 text-base";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Hidden since we only allow active festival */}
      <input type="hidden" name="festivalId" value={festivalId} readOnly />

      <Field label="Tên người công đức">
        <Input
          value={donorName}
          onChange={(e) => setDonorName(titleCaseAfterSpaces(e.target.value))}
          className={bigInput}
          required
          disabled={saving}
          placeholder="Nhập họ tên"
        />
      </Field>

      <Field
        label="Số tiền (VND)"
        hint={
          amount > 0 ? (
            <>
              <span className="font-semibold text-brand-700 dark:text-brand-300">{formatCurrencyVnd(amount)}</span>{" "}
              <span className="text-gray-400">—</span> <span className="italic">{numberToVietnameseWords(amount)}</span>
            </>
          ) : (
            <span className="italic">Tiền bằng chữ sẽ hiện ở đây</span>
          )
        }
      >
        <Input
          inputMode="numeric"
          value={amountText}
          onChange={(e) => setAmountText(normalizeAmountInput(e.target.value))}
          onBlur={() => setAmountText((v) => normalizeAmountInput(v))}
          className={bigInput}
          required
          disabled={saving}
          placeholder="Nhập số tiền"
        />
      </Field>

      <Field label="Địa chỉ">
        <Input
          value={donorAddress}
          onChange={(e) => setDonorAddress(e.target.value)}
          className={bigInput}
          required
          disabled={saving}
          placeholder="Nhập địa chỉ"
        />
      </Field>

      <details className="group rounded-xl border border-gray-200 dark:border-gray-800">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-gray-800 select-none dark:text-white/90 [&::-webkit-details-marker]:hidden">
          Tuỳ chọn nâng cao
          <IconChevronDown className="size-4 text-gray-500 transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-4 border-t border-gray-200 p-4 dark:border-gray-800">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
            <input
              type="checkbox"
              checked={announce}
              onChange={(e) => setAnnounce(e.target.checked)}
              className={checkboxClass}
              disabled={saving}
            />
            <div>
              <div className="text-sm font-medium text-gray-800 dark:text-white/90">Phát loa</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Thông báo giọng đọc khi có công đức mới</div>
            </div>
          </label>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Danh xưng</legend>
            <div className="flex flex-wrap gap-2">
              {[
                { v: "none" as const, label: "Không" },
                { v: "ong" as const, label: "Ông" },
                { v: "ba" as const, label: "Bà" },
                { v: "anh" as const, label: "Anh" },
                { v: "chi" as const, label: "Chị" },
              ].map((opt) => (
                <label
                  key={opt.v}
                  className="cursor-pointer rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-700 transition-colors has-checked:border-brand-500 has-checked:bg-brand-50 has-checked:text-brand-700 dark:border-gray-700 dark:text-gray-300 dark:has-checked:bg-brand-500/15 dark:has-checked:text-brand-300"
                >
                  <input
                    type="radio"
                    name="honorific"
                    value={opt.v}
                    checked={honorific === opt.v}
                    onChange={() => setHonorific(opt.v)}
                    disabled={saving}
                    className="sr-only"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Ghi chú">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={saving}
              placeholder="(Không bắt buộc)"
            />
          </Field>
        </div>
      </details>

      {success ? <Alert variant="success">{success}</Alert> : null}
      {error ? <Alert>{error}</Alert> : null}

      <div className="sticky bottom-0 -mx-5 -mb-5 rounded-b-2xl sm:-mb-6 border-t border-gray-200 bg-white/90 px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6 dark:border-gray-800 dark:bg-gray-900/90">
        <Button type="submit" size="lg" disabled={!canSubmit || saving} className="w-full">
          {saving ? "Đang lưu..." : "Lưu công đức"}
        </Button>
      </div>

      {successModal ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          onClick={() => setSuccessModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xl dark:border-gray-800 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-center text-lg font-semibold text-gray-800 dark:text-white/90">Lưu thành công</div>
            <div className="mt-4 space-y-2 rounded-xl bg-gray-50 p-4 text-sm dark:bg-white/[0.03]">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Tên:</span>{" "}
                <span className="font-medium text-gray-800 dark:text-white/90">{successModal.donorName}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Địa chỉ:</span>{" "}
                <span className="font-medium text-gray-800 dark:text-white/90">{successModal.donorAddress}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Số tiền:</span>{" "}
                <span className="font-semibold text-brand-700 dark:text-brand-300">{formatCurrencyVnd(successModal.amount)}</span>
                <div className="text-xs text-gray-500 italic dark:text-gray-400">
                  {numberToVietnameseWords(successModal.amount)}
                </div>
              </div>
            </div>
            <div className="mt-5">
              <Button onClick={() => setSuccessModal(null)} className="w-full">
                Đóng
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
