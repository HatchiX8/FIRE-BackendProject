export interface NewAssetDto {
  stockId: string; // 股票代碼
  buyPrice: number; // 買進價格
  quantity: number; // 買進股數
  buyCost: number; // 買進成本
  buyDate: string; // 2025/08/11
  note?: string; // 備註
}

export interface AssetPortfolioDto {
  shareholding: AssetInfo[];
  pagination: PaginationInfo;
}

export interface AssetInfo {
  assetId: string;
  stockId: string;
  stockName: string;
  quantity: number;
  buyPrice: number;
  // currentPrice: number; // 市價,後續擴充
  // marketValue: number; // 總市值收盤價*股數,後續擴充
  totalCost: number;
  // stockProfit: number; // 未實現損益後續擴充
  // profitRate: 3.16; // 未實現損益百分比,後續擴充
  note: string;
  buyDate: string;
}

export interface PaginationInfo {
  total_page: number;
  current_page: number;
}

export interface EditAssetDto {
  stockId: string;
  buyDate: string; // "2025/08/11"
  buyPrice: number;
  quantity: number;
  buyCost: number;
  note?: string;
}

export interface UserPortfolioSummaryDto {
  totalInvest: number; // 總資金
  cashInvest: number; // 現金部位 = totalInvest - stockCost
  // stockValue: number; // 股票市值,後續擴充
  stockCost: number; // 成本部位 = cost_total
  positionRatio: number; // 持股水位 = stockCost / totalInvest
  // stockProfit: number; // 未實現損益,後續擴充
  // profitRate: number; // 未實現損益報酬率,後續擴充
}

export interface sellAssetDto {
  sellPrice: number;
  sellQty: number;
  sellCost: number;
  realizedPnl: number;
  sellDate: string; // "2025/08/11"
  note?: string;
}
