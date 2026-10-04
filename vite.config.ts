import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), tailwindcss()],
  server: {
    // Test and audit reports contain HTML; changes there would full-reload pages mid-test.
    watch: { ignored: ['**/playwright-report/**', '**/test-results/**', '**/.lighthouseci/**'] },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          // One chunk for the libraries every page needs (instead of dozens of tiny shared chunks):
          // fewer requests on slow mobile networks. Routes and the mock layer stay split.
          groups: [
            {
              name: 'vendor',
              test: /node_modules[\\/](react|react-dom|scheduler|@tanstack|axios|zod|sonner|cn|big\.js)[\\/]/,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
