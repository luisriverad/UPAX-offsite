/**
 * Proxy de Anthropic en producción (Vercel).
 *
 * Equivalente al proxy de vite.config.ts en local. La llave no viaja al
 * navegador: se lee de ANTHROPIC_API_KEY en el entorno de Vercel.
 *
 * Importante: en proyectos Vite (sin Next) Vercel NO soporta catch-all
 * `[...path]` bajo /api — por eso esta ruta es fija: /api/anthropic/v1/messages
 */

export const maxDuration = 60

const DESTINO = 'https://api.anthropic.com/v1/messages'

export async function POST(req: Request): Promise<Response> {
  const llave = process.env.ANTHROPIC_API_KEY
  if (!llave) {
    return json(
      { error: { message: 'Falta ANTHROPIC_API_KEY en las variables de entorno del proyecto.' } },
      401,
    )
  }

  let res: Response
  try {
    res = await fetch(DESTINO, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': llave,
        'anthropic-version': '2023-06-01',
      },
      body: await req.text(),
    })
  } catch {
    return json({ error: { message: 'No se pudo alcanzar la API de Anthropic.' } }, 502)
  }

  return new Response(res.body, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  })
}

function json(cuerpo: unknown, status: number): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
