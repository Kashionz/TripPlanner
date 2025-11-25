# 🗺 TripPlanner - 旅遊行程規劃協作平台

一款日系簡約風格的旅遊行程規劃 Web App，讓你與朋友一起規劃、即時協作、輕鬆出發。

![TripPlanner Banner](https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=400&fit=crop)

## 功能特色

- **行程規劃** - 拖拉排序景點、整合 Google Maps、自動計算交通時間
- **多人協作** - 邀請好友加入、即時同步編輯、留言討論
- **費用分攤** - 記錄旅途開支、自動計算分攤、清晰明瞭
- **行程匯出** - 匯出 PDF 行程表、離線查看、輕鬆分享

## 技術棧

### 前端
- **React 18** + **Vite** - 現代化開發體驗
- **TypeScript** - 型別安全
- **Tailwind CSS** + **shadcn/ui** - 日系簡約 UI
- **Zustand** - 輕量級狀態管理
- **React Router v6** - 客戶端路由

### 後端
- **Firebase Authentication** - Google 登入
- **Cloud Firestore** - 即時資料庫
- **Firebase Storage** - 圖片儲存
- **Firebase Hosting** - 網站部署

### 第三方 API
- **Google Maps JavaScript API** - 地圖顯示
- **Google Places API** - 景點搜尋
- **Google Directions API** - 路線規劃

## 快速開始

### 前置需求
- Node.js 18+
- npm 或 pnpm
- Firebase 專案
- Google Cloud Platform 專案 (Maps API)

### 安裝步驟

1. **Clone 專案**
```bash
git clone https://github.com/yourusername/travel-planner.git
cd travel-planner
```

2. **安裝依賴**
```bash
npm install
```

3. **設定環境變數**
```bash
cp .env.example .env
```
編輯 `.env` 檔案，填入你的 Firebase 和 Google Maps API 設定。

4. **啟動開發伺服器**
```bash
npm run dev
```

5. **開啟瀏覽器**
訪問 http://localhost:3000

## 專案結構

```
travel-planner/
├── public/              # 靜態資源
├── src/
│   ├── components/      # 可重用元件
│   │   ├── ui/          # shadcn/ui 元件
│   │   ├── layout/      # 版面配置
│   │   ├── auth/        # 認證相關
│   │   ├── trip/        # 行程相關
│   │   └── ...
│   ├── pages/           # 頁面元件
│   ├── hooks/           # 自訂 Hooks
│   ├── stores/          # Zustand Stores
│   ├── services/        # API 服務
│   ├── types/           # TypeScript 型別
│   ├── utils/           # 工具函式
│   └── lib/             # 第三方整合
├── docs/                # 文件
└── ...
```

## 可用指令

```bash
# 開發
npm run dev          # 啟動開發伺服器

# 建置
npm run build        # 建置生產版本
npm run preview      # 預覽生產版本

# 程式碼品質
npm run lint         # ESLint 檢查
```

## 開發進度

- [x] Phase 1: 基礎架構
- [x] Phase 2: 行程管理
- [x] Phase 3: 景點功能
- [x] Phase 4: 協作功能
- [ ] Phase 5: 費用管理
- [ ] Phase 6: 匯出與優化