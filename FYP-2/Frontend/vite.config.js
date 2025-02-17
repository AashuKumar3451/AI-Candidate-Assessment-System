import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  server:{
    proxy:{
      "/auth" : "http://localhost:3000",
      '/user': 'http://localhost:3000',
      '/blog': 'http://localhost:3000',
      '/admin': 'http://localhost:3000'
    }
  },
  plugins: [react()],
})
