import axios from 'axios';
import * as cheerio from 'cheerio';
import * as iconv from 'iconv-lite';

import {  StockInfoRepository } from './stockInfo.query.repo.js';

const MVP_NOTE = 'mvp_string_rules_v1';

// TWSE / TPEx ISIN 列表（上市 / 上櫃）
const TWSE_ISIN_URL = 'https://isin.twse.com.tw/isin/C_public.jsp?strMode=2'; // 上市
const TPEX_ISIN_URL = 'https://isin.twse.com.tw/isin/C_public.jsp?strMode=4'; // 上櫃

type ParsedIsinRow = {
  stockId: string;
  stockName: string;
  marketCategory: string;   // 市場別：上市 / 上櫃 / 等
  securityType: string;     // 有價證券種類：股票 / ETF / TDR 等
  listingDate: string;      // 上市(櫃)日
};

type SecurityType = '股票' | 'ETF' | 'TDR' | '其他';

function detectSectionType(sectionRaw: string): SecurityType {
  const s = sectionRaw.replace(/\s+/g, '').trim();

  if (s.includes('ETF')) return 'ETF';
  if (s.includes('股票')) return '股票';
  if (s.includes('TDR')) return 'TDR';

  // 權證／可轉債／公司債等區塊一律歸其他，交給白名單擋
  return '其他';
}

export class SyncStockMetadataService {
  constructor(
  private readonly infoRepo: StockInfoRepository
  ) {}

  async execute(): Promise<{ total: number; synced: number }> {
    // 1) 抓取上市 / 上櫃 HTML
    const [twseHtml, tpexHtml] = await Promise.all([
      this.fetchHtml(TWSE_ISIN_URL),
      this.fetchHtml(TPEX_ISIN_URL),
    ]);

    // 2) 解析 HTML 表格為中間結構
    const twseRows = this.parseIsinHtml(twseHtml, {
      // 上市：要「股票、ETF、TDR」
      allowedSecurityTypes: ['股票', 'ETF', 'TDR'],
    });
    const tpexRows = this.parseIsinHtml(tpexHtml, {
      // 上櫃：要「股票、ETF」
      allowedSecurityTypes: ['股票', 'ETF'],
    });

    const allRows = [...twseRows, ...tpexRows];

    // 3) 以 stockId 去重（理論上不會重複，做一下保險）
    const byId = new Map<string, ParsedIsinRow>();
    for (const row of allRows) {
      if (!byId.has(row.stockId)) {
        byId.set(row.stockId, row);
      }
    }

    const uniqueRows = Array.from(byId.values());

    // 4) 轉成寫入 stockInfo 的 payload
     const payload = uniqueRows.map((r) => ({
      stockId: r.stockId,
      stockName: r.stockName,
      note: MVP_NOTE,
    }));

    // ⚠️ 防護：若解析出來的資料太少（< 10 筆），可能是網頁結構改變
    // 改成 < 10 而不是 < 100，允許初始化或部分情況下資料較少
    const MIN_STOCK_COUNT = 10;
    if (payload.length < MIN_STOCK_COUNT) {
      throw new Error(
        `解析出的股票筆數 (${payload.length}) 低於最低要求 (${MIN_STOCK_COUNT})，` +
        `可能是網頁結構改變或網路問題，已中止同步以防誤刪資料。`
      );
    }

    // 5) 清空舊資料，再寫入新資料
    await this.infoRepo.deleteAll();

    const BATCH_SIZE = 500;
    for (let i = 0; i < payload.length; i += BATCH_SIZE) {
      const batch = payload.slice(i, i + BATCH_SIZE);
      await this.infoRepo.upsertMany(batch);
    }

    return {
      total: allRows.length,
      synced: payload.length,
    };
  }

  /**
   * 抓取指定 URL 的 HTML 內容
   */
  private async fetchHtml(url: string): Promise<string> {
    const res = await axios.get(url, {
      responseType: 'arraybuffer', // 改成 arraybuffer，不要讓 axios 自動解碼
    });

    // 用 iconv-lite 把 Big5 轉成 UTF-8
    const html = iconv.decode(Buffer.from(res.data), 'big5');
    return html;
  }

  /**
   * 解析 TWSE/TPEx ISIN HTML 表格為結構化資料
   */


 private parseIsinHtml(
  html: string,
  options: { allowedSecurityTypes: Array<SecurityType> }
): ParsedIsinRow[] {
  const { allowedSecurityTypes } = options;
  const $ = cheerio.load(html);

  const rows: ParsedIsinRow[] = [];

  let currentSection = ''; // 由區塊標題列決定

  $('table tr').each((index, tr) => {
    const tds = $(tr).find('td');
    if (tds.length === 0) return;

    // 1) 區塊標題列：通常只有 1 格 + colspan
    if (tds.length === 1) {
    const td0 = tds.eq(0);
    if (td0.attr('colspan')) {
      currentSection = td0.text();
    }
    return;
  }

    // 2) 資料列：通常固定欄位數（你原本用 <6 先擋掉也 ok）
    if (tds.length < 3) return;

    const type = detectSectionType(currentSection);
    if (!allowedSecurityTypes.includes(type)) return; // 白名單直接排除權證區塊

    // 3) 解析代號與名稱
    const codeNameText = tds.eq(0).text().trim();
    const match = codeNameText.match(/^([0-9A-Z]{4,6})\s*(.+)$/);
    if (!match) return;

    const stockId = match[1];
    const stockName = match[2].trim();
    if (!stockName) return;

    const isEtfCode = /^\d{4,5}[A-Z]?$/.test(stockId);

    if (type === '股票' && !/^\d{4}$/.test(stockId)) return;
    if (type === 'ETF' && !isEtfCode) return;

    const listingDate = tds.eq(2).text().trim();
    const marketCategory = tds.eq(3).text().trim();

    rows.push({ stockId, stockName, marketCategory, securityType: type, listingDate });
  });

  return rows;
  }
}

