// Đọc số tiền thành chữ tiếng Việt, vd. 1500000 → "một triệu năm trăm nghìn đồng"
export function numberToVietnameseWords(n: number) {
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
