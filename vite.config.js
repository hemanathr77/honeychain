import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ── Development server ─────────────────────────────────────
  server: {
    port: 5173,
    proxy: {
      // Proxy /api requests to backend in dev (avoids CORS issues)
      '/api': {
        target: process.env.VITE_API_URL
          ? process.env.VITE_API_URL.replace('/api', '')
          : 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // ── Build ──────────────────────────────────────────────────
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
