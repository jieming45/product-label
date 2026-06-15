import type { Product } from '@/types/label'
import rawProducts from './products.json'

/**
 * 產品資料來源：由 `src/data/products.json` 驅動。
 *
 * - 開發環境下，畫面的「新增」功能會透過自訂 Vite plugin（見 `vite-plugin-products.ts`）
 *   經由 dev server 把新商品寫回此 JSON 檔，存檔後 Vite HMR 會自動重新載入。
 * - 此處的靜態 import 提供「首次渲染」與「純靜態部署（無 API）」時的初始資料，
 *   即使後端 API 不存在也能正常顯示商品。
 */

/**
 * 把來源 JSON 轉換為強型別的 `Product[]`。
 * 採取防呆策略：忽略非物件項目、補齊缺漏欄位，避免單筆髒資料讓整頁崩潰。
 */
function toProducts(data: unknown): Product[] {
  if (!Array.isArray(data)) {
    console.warn('[mockProducts] products.json 根節點不是陣列，改用空清單。')
    return []
  }

  return data
    .filter(
      (item): item is Record<string, unknown> =>
        item != null && typeof item === 'object' && !Array.isArray(item),
    )
    .map((item) => {
      const price = Number(item.basePrice)
      return {
        id: item.id != null ? String(item.id) : `tw-${Date.now()}`,
        name: item.name != null ? String(item.name) : '',
        variant: item.variant != null ? String(item.variant) : undefined,
        volume: item.volume != null ? String(item.volume) : undefined,
        basePrice: Number.isFinite(price) ? price : 0,
        barcode: item.barcode != null ? String(item.barcode) : undefined,
      } satisfies Product
    })
}

/**
 * 台灣示範資料，型別為 `Product[]`，由 products.json 讀入。
 */
export const twProducts: Product[] = toProducts(rawProducts)
