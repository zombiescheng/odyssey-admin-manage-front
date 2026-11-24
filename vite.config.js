import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.PHOENIX_BACKEND_TARGET
  return {
    base: env.VITE_PUBLIC_BASE || './',
    plugins: [vue()],
    server: {
      host: '127.0.0.1',
      port: 5175,
      proxy: target ? {
        '/api': {
          target,
          changeOrigin: true,
          configure(proxy) {
            proxy.on('proxyReq', (proxyRequest, request) => {
              const url = request.url?.split('?', 1)[0]
              if (url === '/api/open/oauth/token' && env.PHOENIX_LOGIN_AUTHORIZATION) {
                proxyRequest.setHeader('Authorization', env.PHOENIX_LOGIN_AUTHORIZATION)
              }
            })
          },
        },
      } : undefined,
    },
  }
})
