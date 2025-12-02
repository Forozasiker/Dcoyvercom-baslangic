import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 80,
    allowedHosts: ['dcoyver.com', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: false, // Origin'i koru
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Origin header'ını koru veya ayarla
            if (!proxyReq.getHeader('origin') && req.headers.host) {
              proxyReq.setHeader('origin', `http://${req.headers.host}`)
            }
            if (!proxyReq.getHeader('referer') && req.headers.host) {
              proxyReq.setHeader('referer', `http://${req.headers.host}${req.url}`)
            }
          })
        }
      }
    }
  }
})
