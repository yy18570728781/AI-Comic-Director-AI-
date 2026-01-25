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
                target: 'http://localhost:7001',
                changeOrigin: true,
            },
            '/socket.io': {
                target: 'http://localhost:7001',
                changeOrigin: true,
                ws: true,
            },
        },
    },
})
