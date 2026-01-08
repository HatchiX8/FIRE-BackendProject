// ----------取得申請者----------
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
// ------------------------------
// export type UpgradeRequestStatus = 'pending' | 'approved' | 'rejected';
// ----------取得使用者----------
export interface UserItemDto {
  id: string;
  name: string;
  adminNote: string;
  memberAge: number;
}

export interface GetUserListResponseDto {
  message: string;
  data: UserItemDto[];
}
// ------------------------------

// ----------審核申請----------
export type ReviewStatus = 'approved' | 'rejected';

export interface ReviewUpgradeRequestBodyDto {
  status: ReviewStatus;
  userNote: string;
}

export interface ReviewUpgradeResponseDto {
  message: string;
}
// ---------------------------

// ----------會員權限操作----------
export type ActivationStatus = 'downgrade' | 'ban';

export interface PatchUserActivationBodyDto {
  status: ActivationStatus;
  userNote: string;
}

export interface PatchUserActivationResponseDto {
  message: string;
}
// -------------------------------
