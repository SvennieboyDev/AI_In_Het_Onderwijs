import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/AI_In_Het_Onderwijs/',
  plugins: [react(), tailwindcss()],
})
