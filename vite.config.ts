import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// El copiloto IA llama a la API de Anthropic a traves de este proxy de desarrollo,
// asi la llave nunca viaja al navegador. Define ANTHROPIC_API_KEY en tu archivo .env
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (p: string) => p.replace(/^\/api\/anthropic/, ''),
          configure: (proxy: any) => {
            proxy.on('proxyReq', (proxyReq: any) => {
              proxyReq.setHeader('x-api-key', env.ANTHROPIC_API_KEY || '')
              proxyReq.setHeader('anthropic-version', '2023-06-01')
              // El salto real a Anthropic sale de este servidor, no del navegador.
              // Si dejamos pasar el Origin heredado del browser, la API lo trata
              // como llamada directa desde el cliente y exige el header de acceso
              // directo — que implicaria exponer la llave. Se quitan y ya.
              proxyReq.removeHeader('origin')
              proxyReq.removeHeader('referer')
            })
          },
        },
      },
    },
  }
})
