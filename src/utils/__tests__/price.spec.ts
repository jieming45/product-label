import { describe, it, expect } from 'vitest'
import { formatPrice } from '@/utils/price'

describe('formatPrice', () => {
  it('加入千分位逗號', () => {
    expect(formatPrice(1234)).toBe('1,234')
    expect(formatPrice(1000000)).toBe('1,000,000')
  })

  it('小於一千的數值不加逗號', () => {
    expect(formatPrice(20)).toBe('20')
    expect(formatPrice(0)).toBe('0')
  })

  it('四捨五入小數後再格式化', () => {
    expect(formatPrice(129.6)).toBe('130')
  })
})
