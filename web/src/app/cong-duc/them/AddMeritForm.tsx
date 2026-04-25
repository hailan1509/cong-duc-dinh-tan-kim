"use client";

import { useMemo, useState } from "react";

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

function numberToVietnameseWords(n: number) {
  if (!Number.isFinite(n)) return "";
  const num = Math.trunc(Math.abs(n));
  if (num === 0) return "không đồng";

  const ones = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

  function readTens(t: number, full: boolean) {
    const chuc = Math.trunc(t / 10);
    const donvi = t % 10;
    const parts: string[] = [];

    if (chuc > 1) {
      parts.push(`${ones[chuc]} mươi`);
      if (donvi === 1) parts.push("mốt");
      else if (donvi === 4) parts.push("tư");
      else if (donvi === 5) parts.push("lăm");
      else if (donvi > 0) parts.push(ones[donvi]);
    } else if (chuc === 1) {
      parts.push("mười");
      if (donvi === 5) parts.push("lăm");
      else if (donvi > 0) parts.push(ones[donvi]);
    } else {
      if (full && donvi > 0) parts.push("lẻ");
      if (donvi > 0) parts.push(ones[donvi]);
    }

    return parts.join(" ");
  }

  function readHundreds(h: number, full: boolean) {
    const tram = Math.trunc(h / 100);
    const rest = h % 100;
    const parts: string[] = [];

    if (tram > 0 || full) {
      parts.push(`${ones[tram]} trăm`);
      if (rest > 0) parts.push(readTens(rest, true));
    } else if (rest > 0) {
      parts.push(readTens(rest, false));
    }
    return parts.join(" ").trim();
  }

  const units = ["", "nghìn", "triệu", "tỷ"];
  const chunks: number[] = [];
  let x = num;
  while (x > 0) {
    chunks.push(x % 1000);
    x = Math.trunc(x / 1000);
  }

  const parts: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    if (chunk === 0) continue;
    const full = i < chunks.length - 1; // middle chunks need full reading
    const chunkText = readHundreds(chunk, full);
    if (chunkText) {
      parts.push(chunkText);
      const unit = units[i] ?? "";
      if (unit) parts.push(unit);
    }
  }

  const out = parts.join(" ").replace(/\s+/g, " ").trim();
  return `${out} đồng`;
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

  return (
    <form onSubmit={onSubmit} className="space-y-3 md:space-y-4">
      {/* Hidden since we only allow active festival */}
      <input type="hidden" name="festivalId" value={festivalId} readOnly />

      <label className="block">
        <div className="text-xs font-semibold text-slate-700">Tên người công đức</div>
        <input
          value={donorName}
          onChange={(e) => setDonorName(titleCaseAfterSpaces(e.target.value))}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-[#8b0000]/50 focus:shadow-[0_0_0_4px_rgba(255,215,0,0.20)]"
          required
          disabled={saving}
          placeholder="Nhập họ tên"
        />
      </label>
      <label className="block">
        <div className="text-xs font-semibold text-slate-700">Số tiền (VND)</div>
        <input
          inputMode="numeric"
          value={amountText}
          onChange={(e) => setAmountText(normalizeAmountInput(e.target.value))}
          onBlur={() => setAmountText((v) => normalizeAmountInput(v))}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-[#8b0000]/50 focus:shadow-[0_0_0_4px_rgba(255,215,0,0.20)]"
          required
          disabled={saving}
          placeholder="Nhập số tiền"
        />
        <div className="mt-1 text-xs text-slate-600">
          {amount > 0 ? (
            <>
              <span className="font-semibold">{formatCurrencyVnd(amount)}</span>{" "}
              <span className="text-slate-400">—</span> <span className="italic">{numberToVietnameseWords(amount)}</span>
            </>
          ) : (
            <span className="italic">Tiền bằng chữ sẽ hiện ở đây</span>
          )}
        </div>
      </label>

      

      <label className="block">
        <div className="text-xs font-semibold text-slate-700">Địa chỉ</div>
        <input
          value={donorAddress}
          onChange={(e) => setDonorAddress(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-[#8b0000]/50 focus:shadow-[0_0_0_4px_rgba(255,215,0,0.20)]"
          required
          disabled={saving}
          placeholder="Nhập địa chỉ"
        />
      </label>

      <details className="rounded-2xl border border-slate-200 bg-white/60 p-3">
        <summary className="cursor-pointer select-none text-sm font-extrabold text-slate-900">
          Tuỳ chọn nâng cao
        </summary>
        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 p-3">
            <input
              type="checkbox"
              checked={announce}
              onChange={(e) => setAnnounce(e.target.checked)}
              className="h-5 w-5 accent-[#8b0000]"
              disabled={saving}
            />
            <div>
              <div className="text-sm font-semibold text-slate-900">Phát loa</div>
              <div className="text-xs text-slate-600">Thông báo giọng đọc khi có công đức mới</div>
            </div>
          </label>

          <fieldset className="block rounded-2xl border border-slate-200 bg-white/70 p-3">
            <legend className="text-xs font-semibold text-slate-700">Danh xưng</legend>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              {[
                { v: "none" as const, label: "Không" },
                { v: "ong" as const, label: "Ông" },
                { v: "ba" as const, label: "Bà" },
                { v: "anh" as const, label: "Anh" },
                { v: "chi" as const, label: "Chị" },
              ].map((opt) => (
                <label key={opt.v} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="honorific"
                    value={opt.v}
                    checked={honorific === opt.v}
                    onChange={() => setHonorific(opt.v)}
                    disabled={saving}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <div className="text-xs font-semibold text-slate-700">Ghi chú</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#8b0000]/50 focus:shadow-[0_0_0_4px_rgba(255,215,0,0.20)]"
              disabled={saving}
              placeholder="(Không bắt buộc)"
            />
          </label>
        </div>
      </details>

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="sticky bottom-0 -mx-4 mt-2 border-t border-[#8b0000]/10 bg-white/80 p-3 backdrop-blur md:mx-0 md:rounded-2xl md:border md:border-[#8b0000]/15">
        <button
          disabled={!canSubmit || saving}
          className="w-full rounded-xl bg-gradient-to-r from-[#8b0000] via-[#dc143c] to-[#b01919] px-4 py-3 text-base font-extrabold text-white shadow-[0_10px_25px_rgba(139,0,0,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Đang lưu..." : "Lưu công đức"}
        </button>
      </div>

      {successModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSuccessModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border-2 border-[#8b0000]/20 bg-gradient-to-b from-[#fff7e6] to-white p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xl font-extrabold text-[#8b0000]">Lưu thành công</div>
            <div className="mt-2 space-y-2 text-sm">
              <div>
                <span className="text-slate-600">Tên:</span>{" "}
                <span className="font-medium">{successModal.donorName}</span>
              </div>
              <div>
                <span className="text-slate-600">Địa chỉ:</span>{" "}
                <span className="font-medium">{successModal.donorAddress}</span>
              </div>
              <div>
                <span className="text-slate-600">Số tiền:</span>{" "}
                <span className="font-semibold">{formatCurrencyVnd(successModal.amount)}</span>
                <div className="text-xs italic text-slate-600">
                  {numberToVietnameseWords(successModal.amount)}
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setSuccessModal(null)}
                className="rounded-xl bg-gradient-to-r from-[#8b0000] via-[#dc143c] to-[#b01919] px-4 py-2 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(139,0,0,0.28)] hover:brightness-110"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}

