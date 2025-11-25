import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    // 程式碼分割設定
    rollupOptions: {
      output: {
        manualChunks: {
          // 核心 React 庫
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Firebase 相關
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // UI 相關庫
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            'lucide-react',
          ],
          // 拖拉排序
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          // 日期與表單
          'vendor-form': ['react-hook-form', '@hookform/resolvers', 'zod', 'date-fns'],
          // 匯出相關
          'vendor-export': ['jspdf', 'html2canvas', 'file-saver'],
        },
      },
    },
    // 壓縮設定 - 使用 esbuild (Vite 預設)
    minify: 'esbuild',
    // 資源大小警告閾值
    chunkSizeWarningLimit: 500,
    // 產生 source map
    sourcemap: false,
    // 資源內嵌閾值
    assetsInlineLimit: 4096, // 4KB 以下內嵌為 base64
  },
  // 效能優化
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'zustand',
      'date-fns',
      'lucide-react',
    ],
  },
})