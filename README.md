# 產品標籤自動化生成工具 (Product Label Generator)

以 **Vue 3 (Composition API) + Vite + TypeScript + TailwindCSS v4** 打造的商品標籤生成 / 列印工具。
單張標籤尺寸為實體 **5cm × 3cm**，支援兩種風格即時切換：

| 風格 | 說明 |
| --- | --- |
| **台灣 (`tw`)** | 紅框黃底、右下紅色大字 `$售價 元`，僅顯示目前售價。採用通用標價慣例，未使用任何特定零售商的商標、名稱或商業外觀。 |
| **台灣超市-日本 (`tw-jp`)** | 沿用日本超市的排版與紅色字色（白底、深灰框、右下紅色大字），內容為台灣格式 `XX 元`（僅售價數字＋元，不含「售價」字樣與 `$`）。字體較大，不顯示條碼序號與灰色頁尾橫線。 |

## 開發

```bash
npm install
npm run dev          # 啟動開發伺服器 (預設 http://localhost:5173)
npm run test:run     # 執行 Vitest 單元測試
npm run type-check   # vue-tsc 型別檢查
npm run build        # 型別檢查 + production build (輸出至 dist/)
npm run preview      # 預覽 production build
```

## 專案結構

```
src/
├─ components/
│  ├─ ProductLabel.vue          # 標籤元件（tw / tw-jp 風格切換）
│  └─ __tests__/                # 元件測試
├─ utils/
│  ├─ price.ts                  # 純函式：formatPrice（千分位）
│  └─ __tests__/
├─ types/label.ts               # Product / RawProduct / LabelStyle 型別、LABEL_STYLES 清單
├─ data/
│  ├─ products.json             # 商品資料來源（{ brand, product, price }）
│  ├─ mockProducts.ts           # 讀取 products.json 並轉成 twProducts (Product[])
│  └─ __tests__/                # 轉換邏輯測試
├─ App.vue                      # 工具列（含「新增」表單）+ 列印用標籤網格
├─ main.ts
└─ style.css                    # Tailwind 匯入 + 列印 (@page / print-color-adjust)
```

`vite.config.ts` 內含一個僅在 `npm run dev` 提供的 `products-api` 外掛（`GET`/`POST /api/products`），用來讀寫 `products.json`。

## 列印注意事項

- 點擊工具列「列印」按鈕（呼叫 `window.print()`）。工具列在列印時自動隱藏（`print:hidden`）。
- 為求 `5cm × 3cm` 尺寸精準，`@page { margin: 0 }` 已移除預設頁邊；仍請在瀏覽器列印對話框中選擇 **「無邊界」** 與 **「實際大小 / 100% 縮放」**。
- 紅色價格與黃色底色透過 `print-color-adjust: exact` 強制印出，避免瀏覽器省墨忽略背景色。

## 商品資料與新增

商品資料存放於 [`src/data/products.json`](src/data/products.json)，格式為：

```json
[
  { "brand": "伊藤園", "product": "綠茶(530ml)", "price": "25" }
]
```

`mockProducts.ts` 會在載入時讀取此檔並轉成標籤所需的 `Product[]`（`twProducts`）：`brand → name`、`product` 的括號內容拆成 `volume`、括號前為 `variant`、`price` 轉成數字 `basePrice`、`id` 依序產生（`tw-1`、`tw-2`…）。

**新增商品**（需在 `npm run dev` 開發模式）：點工具列的「新增」→ 填寫 `品牌 / 品名 / 價格` → 按「確定」即透過 `POST /api/products` 寫回 `products.json`（按「取消」放棄）。寫入後清單即時更新。
> 因為瀏覽器無法直接寫檔，寫入經由開發伺服器的 `products-api` 外掛完成；production build 不含此 API，故「新增」按鈕只在開發模式顯示。

## 參考樣板

原始靜態樣板保留於專案根目錄供對照：[`label.html`](label.html)、[`label.css`](label.css)。
