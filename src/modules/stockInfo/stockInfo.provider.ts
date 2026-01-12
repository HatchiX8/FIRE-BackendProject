import axios from 'axios';

type RawRow = Record<string, unknown>;

export type StockListItem = {
  stockId: string;
  stockName: string;
};

function pickString(row: RawRow, keys: string[]): string | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

function normalizeStockId(raw: string): string {
  return raw.replace(/[^\d]/g, '').trim();
}

function mapRows(rows: RawRow[]): StockListItem[] {
  const map = new Map<string, string>();

  for (const row of rows) {
    const idRaw = pickString(row, ['Code', '證券代號', '股票代號', 'SecurityCode']);
    const nameRaw = pickString(row, ['Name', '證券名稱', '股票名稱', 'SecurityName']);

    if (!idRaw || !nameRaw) continue;

    const stockId = normalizeStockId(idRaw);
    if (!stockId) continue;

    if (!map.has(stockId)) map.set(stockId, nameRaw);
  }

  return Array.from(map.entries()).map(([stockId, stockName]) => ({ stockId, stockName }));
}

async function fetchJsonArray(url: string, timeoutMs: number): Promise<RawRow[]> {
  const res = await axios.get(url, {
    timeout: timeoutMs,
    headers: { Accept: 'application/json' },
  });

  if (!Array.isArray(res.data)) throw new Error(`Provider response is not array: ${url}`);
  return res.data as RawRow[];
}

// 台股（TWSE）與櫃買（TPEX）股票清單 API
const TWSE_URL =
  process.env.TWSE_STOCK_LIST_URL ??
  'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_AVG_ALL';

const TPEX_URL =
  process.env.TPEX_STOCK_LIST_URL ??
  'https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes';

export async function fetchStockListFromProviders(): Promise<StockListItem[]> {
  const timeoutMs = Number(process.env.STOCK_PROVIDER_TIMEOUT_MS ?? 15000);

  const [twseRows, tpexRows] = await Promise.all([
    fetchJsonArray(TWSE_URL, timeoutMs),
    fetchJsonArray(TPEX_URL, timeoutMs),
  ]);

  // 合併並去重（以 stockId 為準）
  const merged = [...mapRows(twseRows), ...mapRows(tpexRows)];
  const dedup = new Map<string, string>();
  for (const it of merged) {
    if (!dedup.has(it.stockId)) dedup.set(it.stockId, it.stockName);
  }

  return Array.from(dedup.entries()).map(([stockId, stockName]) => ({ stockId, stockName }));
}
