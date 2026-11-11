"use client";

// Thu vs chi theo tháng: cột đôi, một trục, chú thích + tooltip khi rê chuột/chạm.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { compactVnd, vnd } from "./format";

export type ChartMonth = { month: number; thu: number; chi: number; closing: number; disabled: boolean };

const THU = "#2f6fb0";
const CHI = "#c8232c";

const W = 720;
const H = 260;
const PAD = { top: 12, right: 8, bottom: 28, left: 52 };

function niceMax(v: number) {
  if (v <= 0) return 1_000_000;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

/** Bar with 4px rounded top, square on the baseline */
function bar(x: number, y: number, w: number, h: number) {
  if (h <= 0) return "";
  const r = Math.min(4, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export default function YearChart({
  months,
  selected,
  linkBase,
}: {
  months: ChartMonth[];
  selected?: number;
  /** vd. "/thu-chi?y=2026" — bấm cột sẽ tới `${linkBase}&m=<tháng>` */
  linkBase?: string;
}) {
  const router = useRouter();
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...months.map((m) => Math.max(m.thu, m.chi))));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const band = plotW / 12;
  const barW = Math.min(18, (band - 10) / 2);
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const hm = hover != null ? months[hover - 1] : null;

  return (
    <figure className="relative">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-stone-600">
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-sm" style={{ background: THU }} /> Thu
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-sm" style={{ background: CHI }} /> Chi
        </span>
      </div>
      <div className="custom-scrollbar overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full min-w-[540px]" role="img" aria-label="Biểu đồ thu chi theo tháng">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#e7e2d8" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="#78716c">
              {t === 0 ? "0" : compactVnd(t)}
            </text>
          </g>
        ))}
        {months.map((m, i) => {
          const cx = PAD.left + band * i + band / 2;
          const active = hover === m.month || selected === m.month;
          return (
            <g key={m.month} opacity={m.disabled ? 0.35 : 1}>
              {active ? <rect x={cx - band / 2 + 2} y={PAD.top} width={band - 4} height={plotH} fill="#f3eee4" rx={4} /> : null}
              <path d={bar(cx - barW - 1, y(m.thu), barW, plotH + PAD.top - y(m.thu))} fill={THU} />
              <path d={bar(cx + 1, y(m.chi), barW, plotH + PAD.top - y(m.chi))} fill={CHI} />
              <text
                x={cx}
                y={H - 8}
                textAnchor="middle"
                fontSize={11}
                fill={selected === m.month ? "#1c1917" : "#78716c"}
                fontWeight={selected === m.month ? 700 : 400}
              >
                T{m.month}
              </text>
              {/* Hit target: the whole column */}
              <rect
                x={cx - band / 2}
                y={PAD.top}
                width={band}
                height={plotH + PAD.bottom}
                fill="transparent"
                className={linkBase ? "cursor-pointer" : ""}
                onMouseEnter={() => setHover(m.month)}
                onMouseLeave={() => setHover(null)}
                onTouchStart={() => setHover(m.month)}
                onClick={() => linkBase && router.push(`${linkBase}&m=${m.month}`, { scroll: false })}
              >
                <title>{`Tháng ${m.month}: thu ${vnd(m.thu)}, chi ${vnd(m.chi)}`}</title>
              </rect>
            </g>
          );
        })}
        <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} stroke="#a8a29e" strokeWidth={1} />
      </svg>
      </div>

      {hm ? (
        <div
          className="pointer-events-none absolute top-8 z-10 w-52 rounded-xl border border-stone-200 bg-white p-3 text-sm shadow-lg"
          style={{
            left: `clamp(0px, calc(${((PAD.left + band * (hm.month - 0.5)) / W) * 100}% - 104px), calc(100% - 208px))`,
          }}
        >
          <div className="mb-1.5 font-semibold text-stone-900">Tháng {hm.month}</div>
          <div className="flex justify-between gap-3 text-stone-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ background: THU }} /> Thu
            </span>
            <span className="font-semibold text-stone-900">{vnd(hm.thu)}</span>
          </div>
          <div className="flex justify-between gap-3 text-stone-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ background: CHI }} /> Chi
            </span>
            <span className="font-semibold text-stone-900">{vnd(hm.chi)}</span>
          </div>
          <div className="mt-1.5 flex justify-between gap-3 border-t border-stone-100 pt-1.5 text-stone-600">
            <span>Tồn cuối tháng</span>
            <span className="font-semibold text-stone-900">{vnd(hm.closing)}</span>
          </div>
        </div>
      ) : null}
    </figure>
  );
}
