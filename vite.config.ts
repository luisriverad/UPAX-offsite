import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite's loadEnv da prioridad a process.env sobre .env.local.
 * Si hay otra ANTHROPIC_API_KEY en el entorno del sistema (otra org / sin créditos),
 * el proxy de la app usaría esa y fallaría aunque .env.local esté bien.
 * Preferimos la del proyecto.
 */
function apiKeyDelProyecto(): string {
  for (const name of ['.env.local', '.env']) {
    const file = path.resolve(process.cwd(), name)
    if (!fs.existsSync(file)) continue
    const line = fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .find((l) => /^\s*ANTHROPIC_API_KEY\s*=/.test(l))
    if (!line) continue
    const raw = line.replace(/^\s*ANTHROPIC_API_KEY\s*=\s*/, '').trim()
    const unquoted = raw.replace(/^['"]|['"]$/g, '')
    if (unquoted) return unquoted
  }
  const env = loadEnv('development', process.cwd(), '')
  return env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || ''
}

// El copiloto IA llama a la API de Anthropic a traves de este proxy de desarrollo,
// asi la llave nunca viaja al navegador. Define ANTHROPIC_API_KEY en .env.local
export default defineConfig(({ mode }) => {
  const apiKey = apiKeyDelProyecto()
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (p: string) => p.replace(/^\/api\/anthropic/, ''),
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          configure: (proxy: any) => {
            proxy.on('proxyReq', (proxyReq: any) => {
              // El salto real a Anthropic sale de este servidor, no del navegador.
              // Si dejamos pasar el Origin heredado del browser, la API lo trata
              // como llamada directa desde el cliente y exige el header de acceso
              // directo — que implicaria exponer la llave. Se quitan y ya.
              proxyReq.removeHeader('origin')
              proxyReq.removeHeader('referer')
              proxyReq.setHeader('x-api-key', apiKey)
              proxyReq.setHeader('anthropic-version', '2023-06-01')
            })
          },
        },
      },
    },
  }
})
