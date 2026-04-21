export function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

export function yyyyMmDd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

