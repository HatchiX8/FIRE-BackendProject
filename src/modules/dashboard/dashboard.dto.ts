// 單筆歷史交易資料
export interface DashboardTradeReportItem {
  tradesId: string;
  stockId: string;
  stockName: string;
  tradesDate: string; // "YYYY/MM/DD"
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  buyCost: number;
  actualRealizedPnl: number;
  stockProfit: number;
  profitLossRate: number;
  note: string | null;
}

// 回傳格式
export interface DashboardReportsDto {
  totalTrades: DashboardTradeReportItem[];
  pagination: {
    total_page: number;
    current_page: number;
  };
}

// 每月損益點
export interface DashboardTrendPoint {
  period: string; // "YYYY-MM"
  pnl: number; // 該月損益（realizedPnl 加總）
}

// 趨勢回傳格式
export interface DashboardTrendsDto {
  series: DashboardTrendPoint[];
}
