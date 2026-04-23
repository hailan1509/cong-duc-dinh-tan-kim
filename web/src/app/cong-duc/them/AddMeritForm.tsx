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
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <div className="text-xs font-medium text-slate-700">Ngày lễ</div>
          <select
            value={festivalId}
            onChange={(e) => setFestivalId(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            disabled={saving}
          >
            {festivals.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} - {f.year}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <div className="text-xs font-medium text-slate-700">Số tiền (VND)</div>
          <input
            inputMode="numeric"
            value={amountText}
            onChange={(e) => setAmountText(normalizeAmountInput(e.target.value))}
            onBlur={() => setAmountText((v) => normalizeAmountInput(v))}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            required
            disabled={saving}
          />
          <div className="mt-1 text-xs text-slate-600">
            {amount > 0 ? (
              <>
                <span className="font-semibold">{formatCurrencyVnd(amount)}</span> —{" "}
                <span className="italic">{numberToVietnameseWords(amount)}</span>
              </>
            ) : (
              <span className="italic">Nhập số tiền để hiện tiền bằng chữ</span>
            )}
          </div>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <fieldset className="block">
          <legend className="text-xs font-medium text-slate-700">Danh xưng</legend>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="honorific"
                value="none"
                checked={honorific === "none"}
                onChange={() => setHonorific("none")}
                disabled={saving}
              />
              <span>Không</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="honorific"
                value="ong"
                checked={honorific === "ong"}
                onChange={() => setHonorific("ong")}
                disabled={saving}
              />
              <span>Ông</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="honorific"
                value="ba"
                checked={honorific === "ba"}
                onChange={() => setHonorific("ba")}
                disabled={saving}
              />
              <span>Bà</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="honorific"
                value="anh"
                checked={honorific === "anh"}
                onChange={() => setHonorific("anh")}
                disabled={saving}
              />
              <span>Anh</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="honorific"
                value="chi"
                checked={honorific === "chi"}
                onChange={() => setHonorific("chi")}
                disabled={saving}
              />
              <span>Chị</span>
            </label>
          </div>
        </fieldset>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={announce}
            onChange={(e) => setAnnounce(e.target.checked)}
            className="h-4 w-4"
            disabled={saving}
          />
          <span className="text-sm font-medium text-slate-800">Phát loa</span>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <div className="text-xs font-medium text-slate-700">Tên người công đức</div>
          <input
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            required
            disabled={saving}
          />
        </label>

        <label className="block">
          <div className="text-xs font-medium text-slate-700">Địa chỉ</div>
          <input
            value={donorAddress}
            onChange={(e) => setDonorAddress(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            required
            disabled={saving}
          />
        </label>
      </div>

      <label className="block">
        <div className="text-xs font-medium text-slate-700">Ghi chú</div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 min-h-24 w-full rounded-lg border px-3 py-2 text-sm"
          disabled={saving}
        />
      </label>

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <button
        disabled={!canSubmit || saving}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Đang lưu..." : "Lưu công đức"}
      </button>

      {successModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSuccessModal(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold">Lưu thành công</div>
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
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
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

