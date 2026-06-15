<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import ProductLabel from '@/components/ProductLabel.vue'
import { twProducts } from '@/data/mockProducts'
import { createProduct, fetchProducts } from '@/api/products'
import type { Product } from '@/types/label'
import { LABEL_STYLES, type LabelStyle } from '@/types/label'

const labelStyle = ref<LabelStyle>('tw')

/**
 * 產品清單為響應式狀態：
 * 初始值用 mockProducts 的靜態 import（純靜態部署也能顯示），
 * 掛載後再向本地 API 取最新內容（讀得到才覆蓋，讀不到就維持 fallback）。
 */
const products = ref<Product[]>([...twProducts])

onMounted(async () => {
  try {
    const fresh = await fetchProducts()
    if (fresh.length) products.value = fresh
  } catch {
    // 沒有可用的本地 API（例如純靜態環境）時，沿用靜態 fallback，不阻斷畫面。
  }
})

function handlePrint() {
  window.print()
}

// ── 新增產品的對話框狀態 ───────────────────────────────────────────
const showAddDialog = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

/** 表單欄位：brand=品牌、product=產品名稱、price=價格（字串以利 input 綁定）。 */
const form = reactive({ brand: '', product: '', price: '' })

function resetForm() {
  form.brand = ''
  form.product = ''
  form.price = ''
  errorMessage.value = ''
}

function openAddDialog() {
  resetForm()
  showAddDialog.value = true
}

/** 取消：清空所有輸入框狀態並關閉對話框。 */
function cancelAdd() {
  resetForm()
  showAddDialog.value = false
}

/** 確定：表單驗證 → 組裝符合 Product 結構的物件 → 寫回 JSON → 更新清單。 */
async function confirmAdd() {
  const brand = form.brand.trim()
  const product = form.product.trim()
  const price = Number(form.price)

  // 基礎表單驗證
  if (!brand || !product) {
    errorMessage.value = '請填寫「品牌」與「產品名稱」。'
    return
  }
  if (!Number.isFinite(price) || price < 0) {
    errorMessage.value = '請輸入有效的「價格」（0 以上的數字）。'
    return
  }

  submitting.value = true
  errorMessage.value = ''
  try {
    // 欄位對應：brand→name、product→variant、price→basePrice；id 由後端產生。
    const created = await createProduct({ name: brand, variant: product, basePrice: price })
    products.value = [...products.value, created]
    resetForm()
    showAddDialog.value = false
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '新增失敗，請稍後再試。'
  } finally {
    submitting.value = false
  }
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

        <!-- 新增 -->
        <button
          type="button"
          class="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-700"
          data-test="add-product"
          @click="openAddDialog"
        >
          新增
        </button>

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

    <!-- 新增產品對話框（列印時隱藏） -->
    <div
      v-if="showAddDialog"
      class="print:hidden fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4"
      data-test="add-dialog"
      @click.self="cancelAdd"
    >
      <div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 class="mb-4 text-base font-bold text-gray-900">新增產品</h2>

        <form class="space-y-3" @submit.prevent="confirmAdd">
          <div>
            <label class="mb-1 block text-sm text-gray-600" for="add-brand">品牌</label>
            <input
              id="add-brand"
              v-model="form.brand"
              type="text"
              placeholder="例如：茶裏王"
              class="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none"
              data-test="field-brand"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm text-gray-600" for="add-product">產品名稱</label>
            <input
              id="add-product"
              v-model="form.product"
              type="text"
              placeholder="例如：日式綠茶無糖"
              class="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none"
              data-test="field-product"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm text-gray-600" for="add-price">價格</label>
            <input
              id="add-price"
              v-model="form.price"
              type="number"
              min="0"
              step="1"
              placeholder="例如：20"
              class="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none"
              data-test="field-price"
            />
          </div>

          <p v-if="errorMessage" class="text-sm text-red-600" data-test="form-error">
            {{ errorMessage }}
          </p>

          <div class="mt-4 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              data-test="cancel-add"
              @click="cancelAdd"
            >
              取消
            </button>
            <button
              type="submit"
              class="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
              data-test="confirm-add"
              :disabled="submitting"
            >
              {{ submitting ? '處理中…' : '確定' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 標籤網格 -->
    <main class="mx-auto max-w-6xl px-6 py-8 print:max-w-none print:p-0">
      <div
        class="flex flex-wrap gap-3 print:gap-0"
        data-test="label-grid"
      >
        <ProductLabel
          v-for="product in products"
          :key="product.id"
          :product="product"
          :label-style="labelStyle"
        />
      </div>
    </main>
  </div>
</template>
