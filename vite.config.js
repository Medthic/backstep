import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vite.dev/config/
export default defineConfig({
  base: "/backstep/",
  plugins: [react()],
  build: {
    // raise warning limit to 1000kb; you can adjust as needed
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split vendor and large libraries into separate chunks.
        // This helps keep main chunks smaller and makes caching better.
        manualChunks(id) {
          if (!id) return
          const normalized = id.replace(/\\/g, '/')
          if (normalized.includes('/node_modules/')) {
            if (normalized.includes('/react/') || normalized.includes('/react-dom/')) {
              return 'vendor_react'
            }
            if (normalized.includes('/date-fns/') || normalized.includes('/luxon/')) {
              return 'vendor_date_utils'
            }
            return 'vendor'
          }

          // Optional: group app components into a separate chunk.
          if (normalized.includes('/src/components/')) {
            return 'components'
          }
        },
      },
    },
  },
})
