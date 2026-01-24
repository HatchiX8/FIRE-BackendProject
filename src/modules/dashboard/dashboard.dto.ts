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

// 建立歷史紀錄用的請求 body 型別（與 service 內 DTO 結構對應）
export interface NewDashboardReportRequestBody {
  stockId: string;
  buyPrice: number;
  quantity: number;
  buyCost: number;
  buyDate: string; // "YYYY/MM/DD"
  buyNote?: string | null;
  sellPrice: number;
  sellQty: number;
  sellCost: number;
  sellDate: string; // "YYYY-MM-DD" 或 "YYYY/MM/DD"
  realizedPnl: string;
  sellNote?: string | null;
}

// 建立歷史紀錄（建倉 + 賣出）用 DTO
export interface NewDashboardReportDto {
  stockId: string;
  buyPrice: number;
  quantity: number;
  buyCost: number;
  buyDate: string; // "YYYY/MM/DD"
  buyNote?: string | null;
  sellPrice: number;
  sellQty: number;
  sellCost: number;
  sellDate: string; // 接受 "YYYY-MM-DD" 或 "YYYY/MM/DD"
  realizedPnl: string;
  sellNote?: string | null;
}

// 編輯歷史紀錄（只調整賣出那一筆）用 DTO
export interface UpdateDashboardReportDto {
  sellDate: string; // "YYYY-MM-DD" 或 "YYYY/MM/DD"
  sellPrice: number;
  sellQty: number;
  sellCost: number;
  realizedPnl: number;
  note?: string | null;
}
