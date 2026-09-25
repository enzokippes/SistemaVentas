import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',   // Required for Electron (file:// protocol)
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})
