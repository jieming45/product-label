<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import ProductLabel from '@/components/ProductLabel.vue'
import { toProducts, twProducts } from '@/data/mockProducts'
import { LABEL_STYLES, type LabelStyle, type Product, type RawProduct } from '@/types/label'

// 價格：非負整數或最多兩位小數（與後端 isValidPrice 一致，拒絕科學記號／負數）
const PRICE_RE = /^\d+(\.\d{1,2})?$/

const labelStyle = ref<LabelStyle>('tw')

// 標籤清單：初始來自 products.json（透過 mockProducts 轉換），開發模式下再向 API 取最新檔案內容
const products = ref<Product[]>([...twProducts])

// 寫入 JSON 需要開發伺服器 API（configureServer），故「新增」僅在 dev 模式提供
const isDev = import.meta.env.DEV

const showAddForm = ref(false)
const submitting = ref(false)
const formError = ref('')
const form = reactive({ brand: '', product: '', price: '' })

const addButton = ref<HTMLButtonElement | null>(null)
const brandInput = ref<HTMLInputElement | null>(null)

/** 從開發 API 取回最新的 products.json 並轉成標籤清單；API 不可用時沿用現有清單。 */
async function refresh() {
  try {
    const res = await fetch('/api/products')
    if (!res.ok) return
    const data = (await res.json()) as RawProduct[]
    products.value = toProducts(data)
  } catch (err) {
    // 例如 production build 無此 API → 保留既有清單
    if (isDev) console.warn('[products] 無法取得 /api/products：', err)
  }
}

async function openAddForm() {
  form.brand = ''
  form.product = ''
  form.price = ''
  formError.value = ''
  showAddForm.value = true
  await nextTick()
  brandInput.value?.focus()
}

function closeAddForm() {
  showAddForm.value = false
  // 關閉後把焦點移回「新增」按鈕，避免焦點遺留在已移除的輸入框
  addButton.value?.focus()
}

async function submitAdd() {
  formError.value = ''
  const brand = form.brand.trim()
  const product = form.product.trim()
  const price = form.price.trim()

  if (!brand || !product) {
    formError.value = '請填寫品牌與品名'
    return
  }
  if (!PRICE_RE.test(price)) {
    formError.value = '價格需為非負數字（最多兩位小數）'
    return
  }

  submitting.value = true
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, product, price }),
    })
    if (!res.ok) {
      let msg = `HTTP ${res.status}`
      try {
        const data = await res.json()
        if (data?.error) msg = data.error
      } catch {
        // 回應非 JSON → 沿用狀態碼訊息
      }
      throw new Error(msg)
    }
    await refresh()
    closeAddForm()
  } catch (e) {
    formError.value = `寫入失敗：${e instanceof Error ? e.message : String(e)}（需在 npm run dev 開發模式下使用）`
  } finally {
    submitting.value = false
  }
}

function handlePrint() {
  window.print()
}

onMounted(() => {
  if (isDev) refresh()
})
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

        <!-- 新增（需開發伺服器 API） -->
        <button
          v-if="isDev"
          ref="addButton"
          type="button"
          class="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          @click="openAddForm"
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

    <!-- 標籤網格 -->
    <main class="mx-auto max-w-6xl px-6 py-8 print:max-w-none print:p-0">
      <div class="flex flex-wrap gap-3 print:gap-0" data-test="label-grid">
        <ProductLabel
          v-for="product in products"
          :key="product.id"
          :product="product"
          :label-style="labelStyle"
        />
      </div>
    </main>

    <!-- 新增商品 Modal -->
    <div
      v-if="showAddForm"
      class="print:hidden fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-title"
      @click.self="closeAddForm"
      @keydown.esc="closeAddForm"
    >
      <div class="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
        <h2 id="add-title" class="mb-4 text-base font-bold text-gray-900">新增商品</h2>
        <form class="space-y-3" @submit.prevent="submitAdd">
          <label class="block">
            <span class="mb-1 block text-sm text-gray-600">品牌 (brand)</span>
            <input
              v-model="form.brand"
              type="text"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              placeholder="例：伊藤園"
              data-test="field-brand"
            />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm text-gray-600">品名 (product)</span>
            <input
              v-model="form.product"
              type="text"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              placeholder="例：日式綠茶(530ml)"
              data-test="field-product"
            />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm text-gray-600">價格 (price)</span>
            <input
              v-model="form.price"
              type="text"
              inputmode="numeric"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              placeholder="例：25"
              data-test="field-price"
            />
          </label>

          <p v-if="formError" class="text-sm text-red-600" role="alert" data-test="form-error">
            {{ formError }}
          </p>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              @click="closeAddForm"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="rounded-md bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {{ submitting ? '寫入中…' : '確定' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
