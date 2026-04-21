"use client";

import { useState } from "react";

type Initial = {
  ttsEnabled: boolean;
  ttsProvider: "webspeech" | "fpt";
  fptVoice: string;
  fptSpeed: number;
  fptFormat: "mp3" | "wav";
};

const FPT_VOICES: Array<{ id: string; label: string }> = [
  { id: "banmai", label: "banmai (nữ miền bắc)" },
  { id: "lannhi", label: "lannhi (nữ miền nam)" },
  { id: "leminh", label: "leminh (nam miền bắc)" },
  { id: "myan", label: "myan (nữ miền trung)" },
  { id: "thuminh", label: "thuminh (nữ miền bắc)" },
  { id: "giahuy", label: "giahuy (nam miền trung)" },
  { id: "linhsan", label: "linhsan (nữ miền nam)" },
];

export default function TtsSettingsForm({ initial }: { initial: Initial }) {
  const [ttsEnabled, setTtsEnabled] = useState(initial.ttsEnabled);
  const [ttsProvider, setTtsProvider] = useState<Initial["ttsProvider"]>(initial.ttsProvider);
  const [fptVoice, setFptVoice] = useState(initial.fptVoice);
  const [fptSpeed, setFptSpeed] = useState(initial.fptSpeed);
  const [fptFormat, setFptFormat] = useState<Initial["fptFormat"]>(initial.fptFormat);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    setOk(null);

    const res = await fetch("/api/admin/tts-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ttsEnabled, ttsProvider, fptVoice, fptSpeed, fptFormat }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Lưu thất bại");
      setSaving(false);
      return;
    }

    setOk("Đã lưu cấu hình");
    setSaving(false);
  }

  async function test() {
    setError(null);
    setOk(null);
    const text = "Xin chào. Đây là thử giọng đọc công đức.";
    const res = await fetch("/api/public/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
    if (!res.ok || !data?.url) {
      setError(data?.error ?? "Không gọi được TTS (kiểm tra API key / bật TTS)");
      return;
    }

    const a = new Audio(data.url);
    await a.play().catch(() => setError("Trình duyệt chặn phát âm thanh (hãy bấm Thử lại)"));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={ttsEnabled}
            onChange={(e) => setTtsEnabled(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm font-semibold">Bật giọng đọc</span>
        </label>
        <div className="flex gap-2">
          <button
            onClick={test}
            className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
            type="button"
          >
            Thử giọng
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            type="button"
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>

      {ok ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {ok}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <div className="text-xs font-medium text-slate-700">Provider</div>
          <select
            value={ttsProvider}
            onChange={(e) => setTtsProvider(e.target.value as Initial["ttsProvider"])}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="fpt">FPT.AI</option>
            <option value="webspeech">Web Speech (trình duyệt)</option>
          </select>
        </label>

        <div className="rounded-lg border bg-slate-50 p-3 text-xs text-slate-700">
          API key FPT.AI không lưu trong DB. Bạn đặt ở ENV:{" "}
          <span className="font-mono">FPT_AI_TTS_API_KEY</span>
        </div>

        <label className="block">
          <div className="text-xs font-medium text-slate-700">FPT voice</div>
          <select
            value={fptVoice}
            onChange={(e) => setFptVoice(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          >
            {FPT_VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <div className="text-xs font-medium text-slate-700">FPT speed (-3..+3)</div>
          <input
            type="number"
            min={-3}
            max={3}
            value={fptSpeed}
            onChange={(e) => setFptSpeed(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <div className="text-xs font-medium text-slate-700">FPT format</div>
          <select
            value={fptFormat}
            onChange={(e) => setFptFormat(e.target.value as Initial["fptFormat"])}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="mp3">mp3</option>
            <option value="wav">wav</option>
          </select>
        </label>
      </div>
    </div>
  );
}

