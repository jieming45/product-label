import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductLabel from '@/components/ProductLabel.vue'
import type { Product } from '@/types/label'

const twProduct: Product = {
  id: 't2',
  name: '茶裏王',
  variant: '日式綠茶無糖',
  volume: '600ml',
  basePrice: 20,
}

describe('ProductLabel — 選擇性欄位', () => {
  it('只有口味（無容量）時不顯示括號容量', () => {
    const wrapper = mount(ProductLabel, {
      props: {
        product: { id: 'v', name: 'A', variant: '紅鮭', basePrice: 100 },
        labelStyle: 'tw-jp',
      },
    })
    const variant = wrapper.get('[data-test="product-variant"]')
    expect(variant.text()).toContain('紅鮭')
    expect(variant.text()).not.toContain('(')
  })

  it('只有容量（無口味）時仍顯示容量', () => {
    const wrapper = mount(ProductLabel, {
      props: {
        product: { id: 'v', name: 'A', volume: '500ml', basePrice: 100 },
        labelStyle: 'tw-jp',
      },
    })
    expect(wrapper.get('[data-test="product-variant"]').text()).toContain('500ml')
  })

  it('口味與容量皆無時不渲染次要描述列', () => {
    const wrapper = mount(ProductLabel, {
      props: { product: { id: 'v', name: 'A', basePrice: 100 }, labelStyle: 'tw-jp' },
    })
    expect(wrapper.find('[data-test="product-variant"]').exists()).toBe(false)
  })
})

describe('ProductLabel — 台灣售價標籤 (tw)', () => {
  it('顯示 $ 售價與元', () => {
    const wrapper = mount(ProductLabel, { props: { product: twProduct, labelStyle: 'tw' } })
    const text = wrapper.text()
    expect(text).toContain('$20')
    expect(text).toContain('元')
  })

  it('套用黃底紅框且 data-style 為 tw', () => {
    const label = mount(ProductLabel, { props: { product: twProduct, labelStyle: 'tw' } }).get(
      '[data-test="label"]',
    )
    expect(label.classes()).toContain('bg-[#fff4c2]')
    expect(label.attributes('data-style')).toBe('tw')
  })

  it('以千分位格式化高價商品', () => {
    const wrapper = mount(ProductLabel, {
      props: { product: { ...twProduct, basePrice: 1980 }, labelStyle: 'tw' },
    })
    expect(wrapper.get('[data-test="base-price"]').text()).toContain('1,980')
  })

  it('不渲染特價徽章與原價', () => {
    const wrapper = mount(ProductLabel, { props: { product: twProduct, labelStyle: 'tw' } })
    expect(wrapper.find('[data-test="sale-badge"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="original-price"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('原價')
  })
})

describe('ProductLabel — 台灣超市-日本 (tw-jp)', () => {
  it('沿用日本排版（白底深灰框）且 data-style 為 tw-jp', () => {
    const label = mount(ProductLabel, { props: { product: twProduct, labelStyle: 'tw-jp' } }).get(
      '[data-test="label"]',
    )
    expect(label.classes()).toContain('bg-white')
    expect(label.classes()).toContain('border-gray-800')
    expect(label.classes()).not.toContain('bg-[#fff4c2]')
    expect(label.attributes('data-style')).toBe('tw-jp')
  })

  it('僅顯示售價數字與「元」，不含「售價」字樣與 $', () => {
    const wrapper = mount(ProductLabel, { props: { product: twProduct, labelStyle: 'tw-jp' } })
    const text = wrapper.text()
    expect(text).toContain('元')
    expect(text).not.toContain('售價')
    expect(text).not.toContain('$')
    expect(wrapper.get('[data-test="base-price"]').text()).toBe('20')
  })

  it('移除條碼序號與灰色頁尾橫線（即使商品帶有條碼也不顯示）', () => {
    const wrapper = mount(ProductLabel, {
      props: { product: { ...twProduct, barcode: '4710088410016' }, labelStyle: 'tw-jp' },
    })
    expect(wrapper.find('[data-test="barcode"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('4710088410016')
    expect(wrapper.text()).not.toContain('プラ')
  })

  it('字體較台灣樣式放大（商品名 text-lg、售價數字 text-[40px]）', () => {
    const twjp = mount(ProductLabel, { props: { product: twProduct, labelStyle: 'tw-jp' } })
    const tw = mount(ProductLabel, { props: { product: twProduct, labelStyle: 'tw' } })
    expect(twjp.get('[data-test="product-name"]').classes()).toContain('text-lg')
    expect(tw.get('[data-test="product-name"]').classes()).toContain('text-base')
    expect(twjp.get('[data-test="base-price"]').classes()).toContain('text-[40px]')
  })
})

describe('ProductLabel — 預設值', () => {
  it('未指定 labelStyle 時預設為台灣樣式 (tw)', () => {
    const wrapper = mount(ProductLabel, { props: { product: twProduct } })
    expect(wrapper.get('[data-test="label"]').attributes('data-style')).toBe('tw')
    expect(wrapper.text()).toContain('$20')
  })
})
