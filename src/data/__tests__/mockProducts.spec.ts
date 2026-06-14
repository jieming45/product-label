import { describe, it, expect } from 'vitest'
import { parseProductField, toProduct, toProducts, twProducts } from '@/data/mockProducts'
import type { RawProduct } from '@/types/label'

describe('parseProductField', () => {
  it('拆出 variant 與 volume（半形括號）', () => {
    expect(parseProductField('日式綠茶無糖(600ml)')).toEqual({
      variant: '日式綠茶無糖',
      volume: '600ml',
    })
  })

  it('支援全形括號', () => {
    expect(parseProductField('綠茶（530ml）')).toEqual({ variant: '綠茶', volume: '530ml' })
  })

  it('無括號時整串為 variant、無 volume', () => {
    expect(parseProductField('日式綠茶')).toEqual({ variant: '日式綠茶' })
  })

  it('去除前後與括號內外的空白', () => {
    expect(parseProductField('  綠茶 ( 530ml ) ')).toEqual({ variant: '綠茶', volume: '530ml' })
  })
})

describe('toProduct', () => {
  it('將原始資料轉成 Product（id 由索引產生、price 轉數字）', () => {
    const raw: RawProduct = { brand: '伊藤園', product: '綠茶(530ml)', price: '25' }
    expect(toProduct(raw, 6)).toEqual({
      id: 'tw-7',
      name: '伊藤園',
      variant: '綠茶',
      volume: '530ml',
      basePrice: 25,
    })
  })

  it('品名無容量時 volume 為 undefined', () => {
    const raw: RawProduct = { brand: '某品牌', product: '原味豆漿', price: '15' }
    expect(toProduct(raw, 0)).toEqual({
      id: 'tw-1',
      name: '某品牌',
      variant: '原味豆漿',
      volume: undefined,
      basePrice: 15,
    })
  })
})

describe('toProducts', () => {
  it('依序轉換並產生連號 id', () => {
    const raws: RawProduct[] = [
      { brand: 'A', product: 'a(1L)', price: '10' },
      { brand: 'B', product: 'b', price: '20' },
    ]
    const result = toProducts(raws)
    expect(result.map((p) => p.id)).toEqual(['tw-1', 'tw-2'])
    expect(result[0]?.volume).toBe('1L')
    expect(result[1]?.basePrice).toBe(20)
  })
})

describe('twProducts (由 products.json 載入)', () => {
  it('為非空陣列，且每筆格式正確', () => {
    expect(twProducts.length).toBeGreaterThan(0)
    for (const p of twProducts) {
      expect(p.id).toMatch(/^tw-\d+$/)
      expect(p.name.length).toBeGreaterThan(0)
      expect(typeof p.basePrice).toBe('number')
      expect(Number.isNaN(p.basePrice)).toBe(false)
    }
  })

  it('正確還原第一筆（茶裏王 日式綠茶無糖 600ml 20）', () => {
    expect(twProducts[0]).toEqual({
      id: 'tw-1',
      name: '茶裏王',
      variant: '日式綠茶無糖',
      volume: '600ml',
      basePrice: 20,
    })
  })
})
