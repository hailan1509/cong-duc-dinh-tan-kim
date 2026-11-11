// Hằng số dùng chung client/server cho sổ thu chi (không import gì phía server ở đây).

/** Mệnh giá tiền Việt Nam đang lưu hành (tiền giấy) */
export const DENOMINATIONS = [500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200];

export const MONTH_NAMES = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`);
export const WEEKDAYS_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
