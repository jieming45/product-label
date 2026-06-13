<script setup lang="ts">
import { computed } from 'vue'
import type { LabelStyle, Product } from '@/types/label'
import { formatPrice } from '@/utils/price'

const props = withDefaults(
  defineProps<{
    /** 商品資料 */
    product: Product
    /** 標籤風格：'tw' 台灣售價標籤 / 'tw-jp' 台灣超市-日本 */
    labelStyle?: LabelStyle
  }>(),
  {
    labelStyle: 'tw',
  },
)

const formattedBasePrice = computed(() => formatPrice(props.product.basePrice))

// 台灣超市-日本：日式排版（白底深灰框、紅色大字），字體較大
const isTwJp = computed(() => props.labelStyle === 'tw-jp')
</script>

<template>
  <div
    class="label relative box-border h-[3cm] w-[5cm] overflow-hidden break-inside-avoid"
    :class="isTwJp ? 'border border-gray-800 bg-white' : 'border-2 border-[#e3000f] bg-[#fff4c2]'"
    data-test="label"
    :data-style="labelStyle"
  >
    <!-- ====== 台灣超市-日本 ('tw-jp')：日式排版＋台灣售價，字體放大 ====== -->
    <div v-if="isTwJp" class="flex h-full flex-col p-2">
      <div class="min-w-0 leading-tight">
        <div class="line-clamp-2 text-lg font-bold text-gray-900" data-test="product-name">
          {{ product.name }}
        </div>
        <div
          v-if="product.variant || product.volume"
          class="text-[15px] text-gray-700"
          data-test="product-variant"
        >
          {{ product.variant
          }}<span v-if="product.volume" class="text-gray-500"> ({{ product.volume }})</span>
        </div>
      </div>

      <div class="mt-auto flex items-baseline justify-end text-red-600">
        <span
          class="text-[40px] font-extrabold leading-none tracking-tighter"
          data-test="base-price"
          >{{ formattedBasePrice }}</span
        >
        <span class="ml-1 text-base font-bold">元</span>
      </div>
    </div>

    <!-- ============== 台灣售價標籤 ('tw') ============== -->
    <div v-else class="flex h-full flex-col p-2">
      <div class="min-w-0 leading-tight">
        <div class="line-clamp-2 text-base font-bold text-gray-900" data-test="product-name">
          {{ product.name }}
        </div>
        <div
          v-if="product.variant || product.volume"
          class="text-xs text-gray-600"
          data-test="product-variant"
        >
          {{ product.variant
          }}<span v-if="product.volume" class="text-gray-500"> ({{ product.volume }})</span>
        </div>
      </div>

      <div class="mt-auto flex items-end justify-end">
        <div
          class="flex items-baseline font-black leading-none whitespace-nowrap text-[#e3000f]"
          data-test="base-price"
        >
          <span class="self-start pt-1 text-base">$</span>
          <span class="text-[42px] tracking-tighter">{{ formattedBasePrice }}</span>
          <span class="ml-0.5 self-end pb-1 text-sm">元</span>
        </div>
      </div>
    </div>
  </div>
</template>
