// Ngày theo giờ Việt Nam (UTC+7), không phụ thuộc múi giờ của server (Docker chạy UTC).

const OFFSET_MS = 7 * 60 * 60 * 1000;

/** "YYYY-MM-DD" theo giờ VN của một thời điểm */
export function vnDateKey(d: Date) {
  return new Date(d.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

/** Thời điểm 00:00 giờ VN của ngày `key` ("YYYY-MM-DD") */
export function vnStartOfDay(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) - OFFSET_MS);
}

/** Lưu ngày phát sinh của phiếu ở 12:00 giờ VN để không bao giờ lệch sang ngày khác */
export function vnNoon(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12) - OFFSET_MS);
}

/** [start, end) của tháng `month` (1-12) theo giờ VN */
export function vnMonthRange(year: number, month: number) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1) - OFFSET_MS),
    end: new Date(Date.UTC(year, month, 1) - OFFSET_MS),
  };
}

export function vnYearRange(year: number) {
  return {
    start: new Date(Date.UTC(year, 0, 1) - OFFSET_MS),
    end: new Date(Date.UTC(year + 1, 0, 1) - OFFSET_MS),
  };
}

/** Năm/tháng hiện tại theo giờ VN */
export function vnNowYm() {
  const key = vnDateKey(new Date());
  return { year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)) };
}

export function isValidDateKey(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** "dd/mm/yyyy" từ "YYYY-MM-DD" */
export function formatDateKey(key: string) {
  return `${key.slice(8, 10)}/${key.slice(5, 7)}/${key.slice(0, 4)}`;
}
