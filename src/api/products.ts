import type { Product } from '@/types/label'

/**
 * 前端 API client：與 `vite-plugin-products.ts` 提供的本地 dev API 溝通。
 * 在純靜態部署（無此 API）時，呼叫會 throw，由呼叫端自行 fallback。
 */

const ENDPOINT = '/api/products'

/** 新增商品時，前端需提供的欄位（id 由後端產生）。 */
export interface NewProductInput {
  /** 品牌 → Product.name */
  name: string
  /** 產品名稱／口味 → Product.variant */
  variant: string
  /** 價格 → Product.basePrice */
  basePrice: number
}

/** 讀取目前 products.json 的完整清單。 */
export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(ENDPOINT)
  if (!res.ok) throw new Error(`讀取產品清單失敗（HTTP ${res.status}）`)
  const data: unknown = await res.json()
  if (!Array.isArray(data)) throw new Error('產品資料格式錯誤：預期為陣列')
  return data as Product[]
}

/** 新增一筆商品，成功時回傳後端寫入並補上 id 的完整 Product。 */
export async function createProduct(input: NewProductInput): Promise<Product> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  const data: unknown = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data
        ? String((data as { error: unknown }).error)
        : `新增失敗（HTTP ${res.status}）`
    throw new Error(message)
  }
  return data as Product
}
