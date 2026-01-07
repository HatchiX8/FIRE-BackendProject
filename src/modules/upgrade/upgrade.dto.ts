export type UpgradeRequestStatus = 'pending' | 'approved' | 'rejected';

export interface UpgradeRequestItemDto {
  id: string;
  name: string;
  upgradeReason: string;
  createdAt: string; // "YYYY/MM/DD HH:mm"
}

export interface GetUpgradeRequestsResponseDto {
  message: string;
  data: UpgradeRequestItemDto[];
}
