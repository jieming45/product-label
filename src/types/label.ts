/**
 * 標籤視覺風格：
 * - 'tw'    = 台灣售價標籤（紅框黃底，$XX 元）
 * - 'tw-jp' = 台灣超市-日本：沿用日本超市的排版與紅色字色，內容為台灣售價（XX 元、無稅）
 */
export type LabelStyle = 'tw' | 'tw-jp'

/** 風格選項清單（供工具列切換使用）。 */
export const LABEL_STYLES: { value: LabelStyle; label: string }[] = [
  { value: 'tw', label: '台灣' },
  { value: 'tw-jp', label: '台灣超市-日本' },
]

/** 單一商品資料。 */
export interface Product {
  /** 唯一識別碼，用於列表 key */
  id: string
  /** 主商品名稱，例如「茶裏王」 */
  name: string
  /** 次要描述／口味，例如「日式綠茶無糖」 */
  variant?: string
  /** 容量或規格，例如「600ml」 */
  volume?: string
  /** 售價，例如 20 */
  basePrice: number
  /** 條碼（EAN-13），可選 */
  barcode?: string
}
