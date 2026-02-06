const WARRANT_TAIL = new Set(['P', 'F', 'Q', 'C', 'B', 'X', 'Y']);

export function isMvpStockId(stockId: string): boolean {
  const id = stockId.trim().toUpperCase();
  const len = id.length;

  // 規則 1：權證 / 牛熊
  if (len === 6 && WARRANT_TAIL.has(id[len - 1])) {
    return false;
  }

  // 規則 2：債券類
  if (id.startsWith('B')) {
    return false;
  }

  // 規則 3：可轉債 / 交換債
  if ((len === 5 || len === 6) && /^\d{4}[1-9]/.test(id)) {
    return false;
  }

  return true;
}
