// 개발 서버의 API 프록시와 참가자 기능 테스트 환경을 설정한다.
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
/// <reference types="vitest/config" />
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      proxy: {
        '/api': { target: env.API_PROXY_TARGET || 'http://localhost:8080', changeOrigin: true },
      },
    },
    test: { globals: true, environment: 'jsdom', setupFiles: ['./src/vitest.setup.ts'] },
  }
})
