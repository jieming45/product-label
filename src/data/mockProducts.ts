import type { Product, RawProduct } from '@/types/label'
import rawProducts from './products.json'

/**
 * 解析 products.json 的 `product` 欄位，把「品名(容量)」拆成 variant 與 volume。
 * 例：「日式綠茶無糖(600ml)」→ { variant: '日式綠茶無糖', volume: '600ml' }。
 * 同時支援半形 `()` 與全形 `（）` 括號；沒有括號時整串視為 variant。
 * 第一組採貪婪比對，故有多組括號時以「最後一組」作為容量（例：「A(B)(500ml)」→ variant「A(B)」、volume「500ml」）。
 */
export function parseProductField(product: string): { variant?: string; volume?: string } {
  const match = product.match(/^(.*)[（(]([^（）()]*)[）)]\s*$/)
  if (match) {
    const variant = (match[1] ?? '').trim()
    const volume = (match[2] ?? '').trim()
    return { variant: variant || undefined, volume: volume || undefined }
  }
  const variant = product.trim()
  return { variant: variant || undefined }
}

/** 將單筆原始資料（brand / product / price）轉成標籤用的 {@link Product}。 */
export function toProduct(raw: RawProduct, index: number): Product {
  const { variant, volume } = parseProductField(raw.product)
  return {
    id: `tw-${index + 1}`,
    name: raw.brand.trim(),
    variant,
    volume,
    basePrice: Number(raw.price),
  }
}

/** 將整個原始陣列轉成 {@link Product}[]。 */
export function toProducts(raws: RawProduct[]): Product[] {
  return raws.map(toProduct)
}

/** 由 products.json 取出並轉換後的台灣商品清單。 */
export const twProducts: Product[] = toProducts(rawProducts as RawProduct[])
