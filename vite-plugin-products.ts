import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * 自訂 Vite plugin：在 dev server / preview server 上掛一個極簡的本地檔案 API，
 * 讓「純前端」的瀏覽器也能（在開發環境）把新商品寫回 `src/data/products.json`。
 *
 *   GET  /api/products  → 回傳目前 products.json 的內容
 *   POST /api/products  → 驗證 → 產生唯一 id → append → fs.writeFile 寫回
 *
 * 注意：此 API 只存在於 Vite 開發 / 預覽伺服器，正式靜態部署（無 Node 伺服器）時不會有，
 * 屆時前端仍可靠 mockProducts.ts 的靜態 import 顯示資料，但無法新增寫入。
 */

const API_PATH = '/api/products'
const MAX_BODY_BYTES = 1_000_000

/** products.json 內單筆資料的形狀（與 src/types/label.ts 的 Product 對應）。 */
interface RawProduct {
  id: string
  name: string
  variant?: string
  volume?: string
  basePrice: number
  barcode?: string
}

type NextFn = (err?: unknown) => void

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolveBody, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer) => {
      body += chunk
      if (body.length > MAX_BODY_BYTES) reject(new Error('請求內容過大'))
    })
    req.on('end', () => resolveBody(body))
    req.on('error', reject)
  })
}

export function productsApiPlugin(): Plugin {
  /** products.json 的絕對路徑，於 configResolved 時依專案根目錄決定。 */
  let dataFile = ''

  /** 讀取並驗證 products.json；檔案不存在或為空時回傳空陣列。 */
  async function readProducts(): Promise<RawProduct[]> {
    if (!existsSync(dataFile)) return []
    const text = (await readFile(dataFile, 'utf-8')).trim()
    if (!text) return []
    const parsed: unknown = JSON.parse(text) // 格式錯誤會 throw，由 middleware 的 try-catch 接住
    if (!Array.isArray(parsed)) {
      throw new Error('products.json 結構錯誤：根節點必須是陣列')
    }
    return parsed as RawProduct[]
  }

  /** 依現有資料產生下一個唯一 id（沿用 tw-<遞增數字> 慣例）。 */
  function nextId(products: RawProduct[]): string {
    let max = 0
    for (const p of products) {
      const match = /^tw-(\d+)$/.exec(String(p?.id ?? ''))
      if (match) max = Math.max(max, Number(match[1]))
    }
    return max > 0 ? `tw-${max + 1}` : `tw-${Date.now()}`
  }

  const middleware = async (req: IncomingMessage, res: ServerResponse, next: NextFn) => {
    const url = (req.url ?? '').split('?')[0]
    if (url !== API_PATH) return next()

    try {
      // ── 讀取現有產品 ──────────────────────────────────────────────
      if (req.method === 'GET') {
        return sendJson(res, 200, await readProducts())
      }

      // ── 新增產品並寫回檔案 ────────────────────────────────────────
      if (req.method === 'POST') {
        const rawBody = await readBody(req)
        let payload: Record<string, unknown>
        try {
          payload = JSON.parse(rawBody || '{}') as Record<string, unknown>
        } catch {
          return sendJson(res, 400, { error: '請求內容不是合法的 JSON' })
        }

        // 後端驗證（與前端表單驗證雙保險）
        const name = typeof payload.name === 'string' ? payload.name.trim() : ''
        const variant = typeof payload.variant === 'string' ? payload.variant.trim() : ''
        const basePrice = Number(payload.basePrice)

        if (!name) return sendJson(res, 400, { error: '品牌（name）為必填' })
        if (!variant) return sendJson(res, 400, { error: '產品名稱（variant）為必填' })
        if (!Number.isFinite(basePrice) || basePrice < 0) {
          return sendJson(res, 400, { error: '價格（basePrice）必須是 0 以上的數字' })
        }

        const products = await readProducts()
        const created: RawProduct = { id: nextId(products), name, variant, basePrice }
        products.push(created)
        await writeFile(dataFile, JSON.stringify(products, null, 2) + '\n', 'utf-8')

        return sendJson(res, 201, created)
      }

      res.setHeader('Allow', 'GET, POST')
      return sendJson(res, 405, { error: `不支援的方法：${req.method}` })
    } catch (err) {
      const message = err instanceof Error ? err.message : '伺服器內部錯誤'
      return sendJson(res, 500, { error: message })
    }
  }

  return {
    name: 'vite-plugin-products-api',
    configResolved(config) {
      dataFile = resolve(config.root, 'src/data/products.json')
    },
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
