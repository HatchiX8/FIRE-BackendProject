# FIRE - 後端
## 專案定位
此 repo 為 FIRE 系統後端 API，負責身份驗證、交易紀錄處理、Lot成本計算與資料庫存取。

## 系統架構
```bash
Frontend (Vue3 + Vite)
        ↓
Nginx Reverse Proxy
        ↓
Backend API (Node.js + Express)
        ↓
PostgreSQL
```

## 使用技術
- Node.js
- Express
- TypeORM
- PostgreSQL
- JWT Authentication
- Google OAuth
### 部署
- Zeabur (Cloud Hosting)
- Nginx Reverse Proxy
- PostgreSQL Cloud Database

## 專案結構 (待確認)
### Backend
```bash
src/
├── modules/        # 模組化功能 
├── entities/       # TypeORM 資料表
├── middlewares/    # 驗證與錯誤處理
├── utils/          # 工具函式
├── types/          # 共用型別
├── db/             # 資料表設計
```

## 環境變數範例
```bash
APP_ENV=
DATABASE_URL=
FRONTEND_URL=
GOOGLE_CALLBACK_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
INTERNAL_SYNC_KEY=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
PASSWORD=
PORT=
```

## 本地開發環境
```bash
npm install
npm run dev
```

## 資料模型設計概念
### 核心資料表：
- users
- deals
- lots
- portfolio_summaries
### 設計重點：
- 交易與持倉分離
- 透過 lot 連動交易紀錄
- 避免直接修改歷史資料
- 所有資產變動可追溯

## API設計概念
- 採 RESTful 架構設計
- 依功能模組拆分路由 (auth / assets / dashboard / users)
- 統一回傳格式與錯誤結構
- Service / Controller 分層處理業務邏輯
- 重要操作皆進行驗證與權限控管

範例路由：
- GET    /api/v1/auth/google
- GET    /api/v1/auth/google/callback
- POST   /api/v1/assets
- POST   /api/v1/reports
- PATCH  /api/v1/users/me

## Auth Flow
1. 使用者透過Google OAuth 登入
2. 驗證成功後簽發 Access Token 與 Refresh Token
3. Access Token 用於 API 存取授權
4. Refresh Token 用於重新取得存取權限
5. Token 以 HttpOnly Cookie 儲存，避免 XSS 攻擊
6. API 請求皆透過 JWT Middleware 驗證身分
7. 登出時清除 Refresh Token（revoke）並清除 HttpOnly Cookie