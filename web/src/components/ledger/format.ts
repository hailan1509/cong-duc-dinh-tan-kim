// Định dạng số tiền cho sổ thu chi.

export function vnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + " đ";
}

/** Rút gọn: 2.500.000 → "2,5tr", 950.000 → "950k", 1.200.000.000 → "1,2 tỷ" */
export function compactVnd(n: number) {
  const abs = Math.abs(n);
  const fmt = (v: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(v);
  if (abs >= 1e9) return `${fmt(n / 1e9)} tỷ`;
  if (abs >= 1e6) return `${fmt(n / 1e6)}tr`;
  if (abs >= 1e3) return `${fmt(n / 1e3)}k`;
  return String(n);
}

export function ymHref(base: string, year: number, month: number, extra?: Record<string, string>) {
  const p = new URLSearchParams({ y: String(year), m: String(month), ...(extra ?? {}) });
  return `${base}?${p.toString()}`;
}

export function shiftMonth(year: number, month: number, delta: number) {
  const idx = year * 12 + (month - 1) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

export function parseYm(sp: { y?: string; m?: string }, fallback: { year: number; month: number }) {
  const y = Number(sp.y);
  const m = Number(sp.m);
  return {
    year: Number.isInteger(y) && y >= 2000 && y <= 2100 ? y : fallback.year,
    month: Number.isInteger(m) && m >= 1 && m <= 12 ? m : fallback.month,
  };
}
