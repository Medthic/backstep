import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vite.dev/config/
export default defineConfig({
  base: "/backstep/",
  plugins: [react()],
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {

          manualChunks(id) {
            if (!id) return
            const normalized = id.replace(/\\/g, '/')
            if (normalized.includes('/node_modules/')) {
              return 'vendor'
            }

            if (normalized.includes('/src/components/')) {
              return 'components'
            }
          },
        },
      },
    },
})
