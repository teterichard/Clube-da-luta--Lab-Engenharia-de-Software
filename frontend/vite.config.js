import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Redireciona /api para o back-end (evita problema de CORS no desenvolvimento)
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
