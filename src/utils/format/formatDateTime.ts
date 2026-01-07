// 日期格式化為 YYYY/MM/DD HH:mm
export function formatDateTime(date: Date): string {
  const pad2 = (n: number): string => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());
  return `${y}/${m}/${d} ${hh}:${mm}`;
}
