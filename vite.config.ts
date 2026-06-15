import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { productsApiPlugin } from './vite-plugin-products'

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
