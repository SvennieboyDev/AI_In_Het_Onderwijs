import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// De frontend praat via /api met de lokale Python-backend (poort 8000).
// API-sleutels staan alleen in de backend, nooit hier.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
})
