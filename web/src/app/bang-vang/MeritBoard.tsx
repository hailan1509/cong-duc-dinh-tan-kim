"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Merit = {
  id: number;
  donorName: string;
  donorAddress: string;
  amount: number;
  createdAt: string;
};

type Festival = {
  id: number;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
};

const DISPLAY_LIMIT = 30;
const TOP_DONORS_LIMIT = 15;

function formatCurrencyVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export default function MeritBoard() {
  const [festival, setFestival] = useState<Festival | null>(null);
  const [merits, setMerits] = useState<Merit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; detail?: string }>>([]);
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [speechReady, setSpeechReady] = useState(false);
  const [speechVoiceName, setSpeechVoiceName] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<Array<{ name: string; lang: string }>>([]);
  const [hasVietnameseVoice, setHasVietnameseVoice] = useState(false);
  const [ttsProvider, setTtsProvider] = useState<"webspeech" | "fpt">("webspeech");
  const [fptReady, setFptReady] = useState(false);

  const speakerEnabledRef = useRef(false);
  const speechVoiceNameRef = useRef<string | null>(null);
  const ttsProviderRef = useRef<"webspeech" | "fpt">("webspeech");
  const fptReadyRef = useRef(false);
  const ttsQueueRef = useRef<string[]>([]);
  const ttsRunningRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  function hardStopTts() {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // ignore
    }
    try {
      const a = currentAudioRef.current;
      if (a) {
        a.pause();
        a.src = "";
      }
    } catch {
      // ignore
    }
    currentAudioRef.current = null;
    ttsQueueRef.current = [];
    ttsRunningRef.current = false;
  }

  function enqueueSpeak(text: string) {
    if (!speakerEnabledRef.current) return;
    const t = String(text || "").trim();
    if (!t) return;
    if (ttsQueueRef.current.length >= 10) ttsQueueRef.current.shift();
    ttsQueueRef.current.push(t);
    void pumpTtsQueue();
  }

  async function pumpTtsQueue() {
    if (ttsRunningRef.current) return;
    ttsRunningRef.current = true;
    try {
      while (speakerEnabledRef.current && ttsQueueRef.current.length > 0) {
        const next = ttsQueueRef.current.shift();
        if (!next) continue;
        if (ttsProviderRef.current === "fpt") {
          await speakFpt(next);
        } else {
          await speakWebSpeech(next);
        }
      }
    } finally {
      ttsRunningRef.current = false;
    }
  }

  async function speakWebSpeech(text: string) {
    if (!speakerEnabledRef.current) return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    await new Promise<void>((resolve) => {
      try {
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "vi-VN";
        if (speechVoiceNameRef.current) {
          const v = synth.getVoices().find((vv) => vv.name === speechVoiceNameRef.current);
          if (v) u.voice = v;
        }
        u.rate = 1;
        u.pitch = 1;
        u.volume = 1;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        synth.speak(u);
      } catch {
        resolve();
      }
    });
  }

  async function speakFpt(text: string) {
    if (!speakerEnabledRef.current) return;
    if (!fptReadyRef.current) return;
    try {
      const res = await fetch("/api/public/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) return;

      // FPT returns async url; audio may appear after a short delay.
      const url = data.url;
      const audio = new Audio();
      audio.src = url;
      currentAudioRef.current = audio

      // retry a few times if not ready
      for (let i = 0; i < 10; i++) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await audio.play();
          await new Promise<void>((resolve) => {
            const done = () => {
              audio.removeEventListener("ended", done);
              audio.removeEventListener("error", done);
              resolve();
            };
            audio.addEventListener("ended", done);
            audio.addEventListener("error", done);
          });
          return;
        } catch {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 700));
          audio.load();
        }
      }
    } catch {
      // ignore
    }
  }

  async function load() {
    try {
      setError(null);
      const res = await fetch("/api/public/active", { cache: "no-store" });
      const data = (await res.json()) as { festival: Festival | null; merits: Merit[] };
      setFestival(data.festival);
      setMerits(Array.isArray(data.merits) ? data.merits : []);
      setLastUpdated(
        new Date().toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    try {
      const v = localStorage.getItem("cdtk_speaker") === "1";
      setSpeakerEnabled(v);
      speakerEnabledRef.current = v;
    } catch {
      // ignore
    }

    // Prepare speech voices (some browsers load voices async)
    try {
      const synth = window.speechSynthesis;
      if (synth) {
        const pickVoice = () => {
          const voices = synth.getVoices();
          const normalized = voices.map((v) => ({
            name: v.name,
            lang: (v.lang || "").toLowerCase(),
          }));
          setAvailableVoices(normalized.map((v) => ({ name: v.name, lang: v.lang || "" })));

          const vi =
            voices.find((vv) => vv.lang?.toLowerCase().startsWith("vi")) ||
            voices.find((vv) => /viet|việt|vietnam/i.test(vv.name));

          setHasVietnameseVoice(!!vi);

          if (vi) {
            setSpeechVoiceName(vi.name);
            speechVoiceNameRef.current = vi.name;
          } else if (voices.length > 0 && !speechVoiceNameRef.current) {
            // fallback to first available voice
            setSpeechVoiceName(voices[0]!.name);
            speechVoiceNameRef.current = voices[0]!.name;
          }
          setSpeechReady(true);
        };
        pickVoice();
        synth.onvoiceschanged = () => pickVoice();
      }
    } catch {
      // ignore
    }

    // Load TTS config
    const refreshTtsConfig = async () => {
      try {
        const res = await fetch("/api/public/tts-config", { cache: "no-store" });
        const data = (await res.json()) as {
          setting: { ttsEnabled: boolean; ttsProvider: "webspeech" | "fpt" };
          hasFptKey: boolean;
        };
        const shouldFpt =
          !!data?.setting?.ttsEnabled && data?.setting?.ttsProvider === "fpt" && !!data?.hasFptKey;
        setTtsProvider(shouldFpt ? "fpt" : "webspeech");
        setFptReady(shouldFpt);
        ttsProviderRef.current = shouldFpt ? "fpt" : "webspeech";
        fptReadyRef.current = shouldFpt;
      } catch {
        // ignore
      }
    };

    void refreshTtsConfig();

    const onVisibility = () => {
      if (document.visibilityState === "visible") void refreshTtsConfig();
    };
    document.addEventListener("visibilitychange", onVisibility);

    load();
    let es: EventSource | null = null;
    const timers = new Map<string, number>();

    try {
      es = new EventSource("/api/public/stream");
      es.addEventListener("merit_created", async (evt) => {
        try {
          const payload = JSON.parse((evt as MessageEvent).data) as {
            donorName?: string;
            donorAddress?: string;
            amount?: number;
            honorific?: "ong" | "ba" | "anh" | "chi";
            announce?: boolean;
          };
          const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
          const title = "Có công đức mới";
          const detail =
            payload?.donorName && payload?.amount != null
              ? `${payload.donorName} • ${formatCurrencyVnd(Number(payload.amount) || 0)}`
              : undefined;
          setToasts((prev) => [{ id, title, detail }, ...prev].slice(0, 5));
          timers.set(
            id,
            window.setTimeout(() => {
              setToasts((prev) => prev.filter((t) => t.id !== id));
              const timer = timers.get(id);
              if (timer) window.clearTimeout(timer);
              timers.delete(id);
            }, 5000)
          );

          if (payload?.donorName && payload?.amount != null && payload.announce !== false) {
            const name = String(payload.donorName).trim();
            const amt = Number(payload.amount) || 0;
            if (name) {
              // In case admin just changed settings, refresh once before speaking
              if (ttsProviderRef.current !== "fpt") await refreshTtsConfig();
              const honor =
                payload.honorific === "ba"
                  ? "Bà"
                  : payload.honorific === "anh"
                    ? "Anh"
                    : payload.honorific === "chi"
                      ? "Chị"
                      : "Ông";
              enqueueSpeak(`${honor} ${name} công đức ${formatCurrencyVnd(amt)}`);
            }
          }
        } catch {
          const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
          setToasts((prev) => [{ id, title: "Có công đức mới" }, ...prev].slice(0, 5));
          timers.set(
            id,
            window.setTimeout(() => {
              setToasts((prev) => prev.filter((t) => t.id !== id));
              const timer = timers.get(id);
              if (timer) window.clearTimeout(timer);
              timers.delete(id);
            }, 5000)
          );
        }
        await load();
      });
      es.onerror = () => {
        // Fallback: keep UI working, but avoid spamming
        const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        setToasts((prev) => [{ id, title: "Mất kết nối realtime, sẽ tự cập nhật lại" }, ...prev].slice(0, 3));
        timers.set(
          id,
          window.setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
            const timer = timers.get(id);
            if (timer) window.clearTimeout(timer);
            timers.delete(id);
          }, 5000)
        );
      };
    } catch {
      // ignore
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      for (const timer of timers.values()) window.clearTimeout(timer);
      timers.clear();
      if (es) es.close();
    };
  }, []);

  // Keep refs in sync for SSE callbacks
  useEffect(() => {
    speakerEnabledRef.current = speakerEnabled;
    if (!speakerEnabled) hardStopTts();
  }, [speakerEnabled]);

  useEffect(() => {
    speechVoiceNameRef.current = speechVoiceName;
  }, [speechVoiceName]);

  useEffect(() => {
    ttsProviderRef.current = ttsProvider;
  }, [ttsProvider]);

  useEffect(() => {
    fptReadyRef.current = fptReady;
  }, [fptReady]);

  const total = useMemo(() => merits.reduce((sum, m) => sum + (Number.isFinite(m.amount) ? m.amount : 0), 0), [merits]);

  const topDonors = useMemo(() => {
    return [...merits]
      .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
      .slice(0, TOP_DONORS_LIMIT);
  }, [merits]);

  const lastRows = useMemo(() => {
    return [...merits]
      .sort((a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0))
      .slice(0, DISPLAY_LIMIT);
  }, [merits]);

  return (
    <div className="container">
      {toasts.length > 0 ? (
        <div className="fixed bottom-3 right-3 z-50 w-[min(420px,calc(100%-24px))] space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold">{t.title}</div>
                  {t.detail ? <div className="mt-0.5 truncate text-amber-800">{t.detail}</div> : null}
                </div>
                <button
                  className="shrink-0 rounded-md px-2 py-1 text-xs text-amber-900/70 hover:bg-amber-100"
                  onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                  type="button"
                >
                  Đóng
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="header-wrapper">
        <h1 className="main-title">Công Đức Đình Làng Tân Kim {festival?.year ?? ""}</h1>
        <p className="subtitle">{festival?.name ?? "Chưa có ngày lễ active"}</p>
        <div className="header-info">
          <div className="header-info-item">
            <div className="header-info-label">Tổng Tiền Công Đức</div>
            <div className="header-info-value gold">{formatCurrencyVnd(total)}</div>
          </div>
          <div className="header-info-item">
            <div className="header-info-label">Cập Nhật Lần Cuối</div>
            <div className="header-info-value">{lastUpdated || "Đang tải..."}</div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => enqueueSpeak("Xin chào. Đây là thử loa công đức.")}
        disabled={!speakerEnabled || !speechReady}
        className="fixed bottom-4 right-28 z-50 rounded-full border border-red-900/20 bg-white/90 px-4 py-2 text-xs font-semibold text-red-900 shadow-lg backdrop-blur hover:bg-white disabled:opacity-60"
        title={!speechReady ? "Trình duyệt đang tải giọng đọc..." : speakerEnabled ? "Thử loa" : "Hãy bật loa trước"}
      >
        Thử loa
      </button>

      <button
        type="button"
        onClick={() => {
          const next = !speakerEnabled;
          setSpeakerEnabled(next);
          try {
            localStorage.setItem("cdtk_speaker", next ? "1" : "0");
          } catch {
            // ignore
          }
          if (next) {
            // user gesture => speech allowed
            enqueueSpeak("Đã bật loa thông báo công đức");
          }
        }}
        className="fixed bottom-4 right-4 z-50 rounded-full border border-red-900/20 bg-white/90 px-5 py-3 text-sm font-semibold text-red-900 shadow-lg backdrop-blur hover:bg-white"
        aria-pressed={speakerEnabled}
        title={speakerEnabled ? "Tắt loa" : "Bật loa"}
      >
        {speakerEnabled ? "Tắt loa" : "Bật loa"}
      </button>

      <div className="main-content">
        <div className="main-list-section">
          <div className="cards-grid">
            {!festival ? (
              <div className="error-message">Chưa có ngày lễ nào được đặt active.</div>
            ) : error ? (
              <div className="error-message">
                Lỗi khi tải dữ liệu.
                <pre style={{ whiteSpace: "pre-wrap", textAlign: "left", margin: 0 }}>{error}</pre>
              </div>
            ) : lastRows.length === 0 ? (
              <div className="loading">Đang tải dữ liệu</div>
            ) : (
              lastRows.map((row) => (
                <div key={row.id} className="donor-card">
                  <div className="donor-header">
                    <div className="donor-name">{row.donorName}</div>
                  </div>
                  <div className="donor-body">
                    <div className="donor-info">
                      <div className="donor-info-label">Địa chỉ</div>
                      <div className="donor-info-value">{row.donorAddress}</div>
                    </div>
                    <div className="donor-amount">
                      <div className="donor-amount-label">Số tiền công đức</div>
                      <div className="donor-amount-value">{formatCurrencyVnd(row.amount)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="top-donors-section">
          <h2 className="top-donors-title">Bảng Vàng</h2>
          {!festival ? (
            <div className="error-message">Chưa có ngày lễ active.</div>
          ) : error ? (
            <div className="error-message">Không tải được Bảng Vàng.</div>
          ) : topDonors.length === 0 ? (
            <div className="loading">Đang tải...</div>
          ) : (
            topDonors.map((row, idx) => {
              const rank = idx + 1;
              const rankClass = rank === 1 ? "top-1" : rank === 2 ? "top-2" : rank === 3 ? "top-3" : "";
              const itemClass =
                rank === 1
                  ? "top-donor-item top-1-item"
                  : rank === 2
                    ? "top-donor-item top-2-item"
                    : rank === 3
                      ? "top-donor-item top-3-item"
                      : "top-donor-item";

              return (
                <div key={row.id} className={itemClass}>
                  <div>
                    <span className={`top-donor-rank ${rankClass}`}>{rank}</span>
                    <span className="top-donor-name">{row.donorName}</span>
                  </div>
                  <div className="top-donor-amount">{formatCurrencyVnd(row.amount)}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

