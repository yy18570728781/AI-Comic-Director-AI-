import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
            '/api': {
                target: process.env.VITE_API_BASE_URL,
                changeOrigin: true,
            },
            '/socket.io': {
                target: process.env.VITE_WS_URL,
                changeOrigin: true,
                ws: true,
            },
        },
    },
})
