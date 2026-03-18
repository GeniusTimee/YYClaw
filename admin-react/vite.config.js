import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/admin/',
  build: {
    outDir: '../admin-dist',
    emptyOutDir: true,
  },
  server: {
    port: 6702,
    proxy: {
      '/admin/api': { target: 'http://localhost:6700', rewrite: p => p.replace('/admin/api', '/admin/api') },
    },
  },
})
