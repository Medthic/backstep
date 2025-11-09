import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
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
