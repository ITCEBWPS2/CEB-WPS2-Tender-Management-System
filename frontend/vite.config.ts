/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env from both config directory (__dirname) and current working directory
  const env = {
    ...loadEnv(mode, __dirname, ''),
    ...loadEnv(mode, process.cwd(), ''),
  }
  const apiUrl = env.VITE_API_URL || process.env.VITE_API_URL

  if (mode === 'production') {
    if (!apiUrl || apiUrl.includes('localhost')) {
      throw new Error(
        `[BUILD GUARD ERROR] Production build aborted: VITE_API_URL is undefined or contains 'localhost' (received: "${apiUrl || ''}"). ` +
        `A production build must define a valid production backend API URL (e.g. in frontend/.env.production).`
      )
    }
  }

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:5010',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  }
})
