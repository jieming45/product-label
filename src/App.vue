<script setup lang="ts">
import { ref } from 'vue'
import ProductLabel from '@/components/ProductLabel.vue'
import { twProducts } from '@/data/mockProducts'
import { LABEL_STYLES, type LabelStyle } from '@/types/label'

const labelStyle = ref<LabelStyle>('tw')

function handlePrint() {
  window.print()
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 text-gray-900">
    <!-- 工具列（列印時隱藏） -->
    <header class="print:hidden sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
        <h1 class="mr-auto text-lg font-bold">產品標籤生成工具</h1>

        <!-- 風格切換 -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">風格</span>
          <div
            role="group"
            aria-label="標籤風格選擇"
            class="inline-flex overflow-hidden rounded-md border border-gray-300"
          >
            <button
              v-for="opt in LABEL_STYLES"
              :key="opt.value"
              type="button"
              class="px-3 py-1.5 text-sm font-medium transition-colors"
              :class="
                labelStyle === opt.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              "
              :aria-pressed="labelStyle === opt.value"
              @click="labelStyle = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- 列印 -->
        <button
          type="button"
          class="rounded-md bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
          @click="handlePrint"
        >
          列印
        </button>
      </div>
    </header>

    <!-- 標籤網格 -->
    <main class="mx-auto max-w-6xl px-6 py-8 print:max-w-none print:p-0">
      <div
        class="flex flex-wrap gap-3 print:gap-0"
        data-test="label-grid"
      >
        <ProductLabel
          v-for="product in twProducts"
          :key="product.id"
          :product="product"
          :label-style="labelStyle"
        />
      </div>
    </main>
  </div>
</template>
