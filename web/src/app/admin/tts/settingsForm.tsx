"use client";

import { useState } from "react";
import { Alert, Button, Field, Input, Select } from "@/components/admin/ui";
import { IconSpeaker } from "@/components/admin/icons";

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="flex cursor-pointer items-center gap-3">
          <span className="relative inline-flex">
            <input
              type="checkbox"
              checked={ttsEnabled}
              onChange={(e) => setTtsEnabled(e.target.checked)}
              className="peer sr-only"
            />
            <span className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-brand-600 peer-focus-visible:ring-3 peer-focus-visible:ring-brand-500/25 dark:bg-gray-700" />
            <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-theme-sm transition-transform peer-checked:translate-x-5" />
          </span>
          <span className="text-sm font-medium text-gray-800 dark:text-white/90">Bật giọng đọc</span>
        </label>
        <div className="flex gap-2">
          <Button variant="outline" onClick={test}>
            <IconSpeaker /> Thử giọng
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </div>

      {ok ? <Alert variant="success">{ok}</Alert> : null}
      {error ? <Alert>{error}</Alert> : null}

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Provider">
          <Select value={ttsProvider} onChange={(e) => setTtsProvider(e.target.value as Initial["ttsProvider"])}>
            <option value="fpt">FPT.AI</option>
            <option value="webspeech">Web Speech (trình duyệt)</option>
          </Select>
        </Field>

        <Alert variant="info" className="self-end">
          API key FPT.AI không lưu trong DB. Bạn đặt ở ENV:{" "}
          <span className="font-mono text-xs">FPT_AI_TTS_API_KEY</span>
        </Alert>

        <Field label="FPT voice">
          <Select value={fptVoice} onChange={(e) => setFptVoice(e.target.value)}>
            {FPT_VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="FPT speed (-3..+3)">
          <Input type="number" min={-3} max={3} value={fptSpeed} onChange={(e) => setFptSpeed(Number(e.target.value))} />
        </Field>

        <Field label="FPT format">
          <Select value={fptFormat} onChange={(e) => setFptFormat(e.target.value as Initial["fptFormat"])}>
            <option value="mp3">mp3</option>
            <option value="wav">wav</option>
          </Select>
        </Field>
      </div>
    </div>
  );
}
