import "dotenv/config";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const serverport = process.env.SERVERPORT;
const backend = process.env.BACKEND;

// https://vite.dev/config/
export default defineConfig({
  // base: "/",
  plugins: [react()],
  preview: {
    host: true,
    allowedHosts: true,
    port: serverport,
    strictPort: true,
    proxy: {
      '/AccountDocument': backend,
    }
  },
  server: {
    port: serverport,
    host: true,
    strictPort: true,
    proxy: {
      '/AccountDocument': backend,
    }
  }
})