/**
 * 價格格式化工具（純函式，方便單元測試）。
 */

/**
 * 以千分位格式化價格，例如 1234 → "1,234"。
 * 會先取整數，避免浮點誤差顯示出小數。
 *
 * @param price 數值
 * @returns 含千分位逗號的字串
 */
export function formatPrice(price: number): string {
  return Math.round(price).toLocaleString('en-US')
}
