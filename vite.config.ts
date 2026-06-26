import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const signalsTransformer = path.resolve(__dirname, './lib/babel-signals-transformer/index.js')

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [[signalsTransformer, {}]],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
