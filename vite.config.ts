import { fileURLToPath, URL } from 'node:url'
import { readFile, writeFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

const PRODUCTS_FILE = fileURLToPath(new URL('./src/data/products.json', import.meta.url))

interface RawEntry {
  brand: string
  product: string
  price: string
}

/** 價格格式：非負整數或最多兩位小數（拒絕科學記號、負數、空字串等）。 */
function isValidPrice(price: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(price)
}

/** 讀取請求 body（上限 1MB）。以 Buffer 累積後再解碼，確保多位元組 UTF-8（中文）不被截斷。 */
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > 1_000_000) {
        req.destroy()
        reject(new Error('Request body too large'))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

/**
 * 讀取 products.json。
 * - 檔案不存在（首次）→ 回傳空陣列
 * - 內容損毀（JSON 解析失敗）→ 拋出錯誤，避免後續寫入覆蓋／清空既有資料
 */
async function readProducts(): Promise<RawEntry[]> {
  let json: string
  try {
    json = await readFile(PRODUCTS_FILE, 'utf-8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw err
  }
  const parsed = JSON.parse(json)
  return Array.isArray(parsed) ? (parsed as RawEntry[]) : []
}

// 將寫入序列化，避免並發 POST 互相覆蓋（read-modify-write race）
let writeChain: Promise<unknown> = Promise.resolve()
function serializeWrite<T>(task: () => Promise<T>): Promise<T> {
  const run = writeChain.then(task, task)
  writeChain = run.catch(() => {})
  return run
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

/**
 * 開發伺服器 API：讀寫 src/data/products.json。
 * - GET  /api/products → 回傳目前的原始商品陣列
 * - POST /api/products → 驗證並附加一筆 { brand, product, price } 後寫回檔案
 *
 * 僅在 `npm run dev`（configureServer）下提供；production build 不含此 API。
 */
function productsApiPlugin(): Plugin {
  return {
    name: 'products-api',
    configureServer(server) {
      server.middlewares.use('/api/products', async (req, res) => {
        try {
          if (req.method === 'GET') {
            sendJson(res, 200, await readProducts())
            return
          }

          if (req.method === 'POST') {
            let parsed: unknown
            try {
              parsed = JSON.parse(await readBody(req))
            } catch {
              sendJson(res, 400, { error: 'Invalid JSON body' })
              return
            }

            const input = parsed as Record<string, unknown>
            const brand = typeof input.brand === 'string' ? input.brand.trim() : ''
            const product = typeof input.product === 'string' ? input.product.trim() : ''
            const price =
              typeof input.price === 'number'
                ? String(input.price)
                : typeof input.price === 'string'
                  ? input.price.trim()
                  : ''

            if (!brand || !product || !isValidPrice(price)) {
              sendJson(res, 400, {
                error: 'brand 與 product 必填，price 需為非負數字（最多兩位小數）',
              })
              return
            }

            const entry: RawEntry = { brand, product, price }
            await serializeWrite(async () => {
              const list = await readProducts()
              list.push(entry)
              await writeFile(PRODUCTS_FILE, JSON.stringify(list, null, 2) + '\n', 'utf-8')
            })
            sendJson(res, 201, entry)
            return
          }

          sendJson(res, 405, { error: 'Method Not Allowed' })
        } catch (err) {
          console.error('[products-api] error:', err)
          sendJson(res, 500, { error: 'Internal server error' })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // 以相對路徑輸出，方便直接以 file:// 或子路徑部署列印頁面
  base: './',
  // 預設 5173；若環境變數 PORT 有值則優先採用（供預覽工具自動指派埠號）
  server: {
    port: Number(process.env.PORT) || 5173,
  },
  plugins: [vue(), tailwindcss(), productsApiPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
