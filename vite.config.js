import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isAmplify = env.VITE_DEPLOY_TARGET === 'amplify';

  return {
    base: isAmplify ? "/" : "/backstep/",
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
  }
})
