/**
 * Equivalente en produccion del proxy /api/anthropic de vite.config.ts.
 *
 * En dev el proxy vive en el server de Vite; en Vercel el sitio se publica
 * estatico, asi que sin esta funcion la llamada devuelve 404 y el asistente
 * cae al analisis local. La llave sigue sin viajar al navegador: se lee de
 * ANTHROPIC_API_KEY en el entorno de Vercel.
 */

// el consolidado de 13 campos tarda ~34s con effort medium; el default de
// Vercel no alcanza, hay que pedir la ventana completa
export const maxDuration = 60

const API = 'https://api.anthropic.com'

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: { message: 'Solo se acepta POST.' } }, 405)
  }

  const llave = process.env.ANTHROPIC_API_KEY
  if (!llave) {
    return json(
      { error: { message: 'Falta ANTHROPIC_API_KEY en las variables de entorno del proyecto.' } },
      401,
    )
  }

  // /api/anthropic/v1/messages -> /v1/messages
  const url = new URL(req.url)
  const ruta = url.pathname.replace(/^\/api\/anthropic/, '')

  let res: Response
  try {
    res = await fetch(`${API}${ruta}${url.search}`, {
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

  // se devuelve el cuerpo tal cual: ia.ts lee error.message de la propia API
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
