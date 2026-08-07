import { ARCHIVOS_DG, BLOQUES_CEO, DGS, PREGUNTAS_DG, UNIDADES } from '../data/content'
import type { AnalisisGrupo, Repregunta } from './asistenteEntrevista'
import { K, unidadDe } from './model'
import type { Values } from '../types'

/**
 * Capa de modelo del asistente. El motor local (asistenteEntrevista.ts) sigue
 * siendo la base: corre siempre y al instante. Esto se monta encima cuando hay
 * llave configurada y sustituye las propuestas por síntesis redactadas sobre
 * toda la evidencia. Si falla —sin llave, sin red, sin cuota— la pantalla se
 * queda con el resultado local y se avisa; nunca se queda sin nada.
 */

const g = (v: Values, k: string) => (v[k] ?? '').trim()

/* ------------------------------------------------------------------ *
 * La evidencia que se le entrega al modelo
 * ------------------------------------------------------------------ */

/** Todo lo capturado con el CEO y con los DGs, en texto plano. */
export function evidencia(v: Values): string {
  const out: string[] = []

  const delCeo: string[] = []
  BLOQUES_CEO.forEach((b) => {
    b.preguntas.forEach((p, q) => {
      const r = g(v, K.ceo(b.id, q))
      if (r) delCeo.push(`[${b.label}] ${p}\n  → ${r}`)
    })
  })
  if (delCeo.length) out.push('=== ENTREVISTA CON EL CEO ===', ...delCeo)

  const deDgs: string[] = []
  DGS.forEach((d) => {
    PREGUNTAS_DG.forEach((p, q) => {
      const r = g(v, K.dg(d, q))
      if (r) deDgs.push(`[${unidadDe(v, d)}] ${p}\n  → ${r}`)
    })
  })
  if (deDgs.length) out.push('', '=== ENTREVISTAS CON LOS DGs ===', ...deDgs)

  const archivos: string[] = []
  DGS.forEach((d) => {
    const suyos = ARCHIVOS_DG.map((a, i) => (g(v, K.dgArch(d, i)) ? a.nombre : '')).filter(Boolean)
    if (suyos.length) archivos.push(`${unidadDe(v, d)}: ${suyos.join(', ')}`)
  })
  if (archivos.length) out.push('', '=== ARCHIVOS ENTREGADOS ===', ...archivos)

  return out.join('\n')
}

/** Sin nada capturado no hay nada que sintetizar: se evita gastar la llamada. */
export function hayEvidencia(v: Values): boolean {
  return evidencia(v).length > 0
}

/* ------------------------------------------------------------------ *
 * Llamada al modelo
 * ------------------------------------------------------------------ */

const SISTEMA = [
  'Eres el analista del proceso de arquitectura de cultura de UPAX, un grupo mexicano con ocho unidades de negocio:',
  UNIDADES.map((u) => u.nombre).join(', ') + '.',
  '',
  'Tu trabajo es sintetizar la evidencia de las entrevistas, no inventarla. Reglas:',
  '- Trabaja SOLO con lo que aparece en la evidencia. No agregues ejemplos, cifras ni nombres que no estén ahí.',
  '- Distingue lo que dice el CEO de lo que dice cada unidad, y señala cuando no coinciden. El desacuerdo entre unidades es información valiosa, no algo que suavizar.',
  '- Rechaza el lenguaje genérico. "Calidad", "excelencia", "sinergia" o "clase mundial" no dicen nada por sí solos: si la evidencia solo ofrece eso, dilo en vez de repetirlo.',
  '- Español de México, tono ejecutivo y directo. Sin preámbulo, sin relleno, sin cerrar ofreciendo ayuda.',
  '- Cuando la evidencia no alcance para un campo, deja la síntesis vacía y explica por qué. Es preferible a inventar.',
].join('\n')

/** El modelo devuelve JSON validado contra estos esquemas, no texto libre que haya que parsear. */
const ESQUEMA_SINTESIS = {
  type: 'object',
  properties: {
    campos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          clave: { type: 'string', description: 'la clave exacta del campo, copiada de la lista' },
          sintesis: {
            type: 'string',
            description:
              'La definición que la evidencia sostiene, redactada como texto final para el documento, no como comentario sobre la evidencia. Una a tres frases. Cadena vacía si no hay evidencia suficiente.',
          },
          base: {
            type: 'string',
            description: 'Sobre qué evidencia está construida: qué dijo el CEO y qué unidades lo sostienen. Una frase.',
          },
          tension: {
            type: 'string',
            description:
              'Dónde se contradicen las unidades o el CEO, citando quién. Máximo dos frases. Cadena vacía si no hay tensión.',
          },
        },
        required: ['clave', 'sintesis', 'base', 'tension'],
        additionalProperties: false,
      },
    },
  },
  required: ['campos'],
  additionalProperties: false,
} as const

const ESQUEMA_DUDAS = {
  type: 'object',
  properties: {
    dudas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          clave: { type: 'string', description: 'la clave exacta de la respuesta, copiada de la lista' },
          repreguntas: {
            type: 'array',
            description: 'Tres repreguntas sobre esa respuesta en concreto.',
            items: { type: 'string' },
          },
        },
        required: ['clave', 'repreguntas'],
        additionalProperties: false,
      },
    },
  },
  required: ['dudas'],
  additionalProperties: false,
} as const

export class ErrorIA extends Error {
  constructor(
    message: string,
    /** true cuando no vale la pena reintentar: falta la llave o está mal */
    readonly sinLlave = false,
  ) {
    super(message)
  }
}

async function llamar(instruccion: string, esquema: unknown): Promise<unknown> {
  let res: Response
  try {
    res = await fetch('/api/anthropic/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-opus-5',
        // el pensamiento adaptativo va activado por defecto y consume parte de
        // max_tokens: hay que dejar holgura para que la respuesta no se corte
        max_tokens: 16000,
        // medido sobre los 13 campos del consolidado: `medium` tarda ~34s y la
        // calidad se sostiene; `high` no mejora lo suficiente para el doble de espera
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: esquema } },
        system: SISTEMA,
        messages: [{ role: 'user', content: instruccion }],
      }),
    })
  } catch {
    throw new ErrorIA('No se pudo conectar con el modelo. Revisa la red.')
  }

  if (res.status === 401 || res.status === 403) {
    throw new ErrorIA('La llave de la API no es válida o no tiene permisos.', true)
  }
  if (!res.ok) {
    const detalle = await res.text().catch(() => '')
    throw new ErrorIA(`El modelo respondió ${res.status}. ${detalle.slice(0, 160)}`)
  }

  const data = (await res.json()) as {
    stop_reason?: string
    content?: { type: string; text?: string }[]
  }
  if (data.stop_reason === 'refusal') throw new ErrorIA('El modelo declinó responder a esta petición.')

  const txt = (data.content ?? [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('')
    .trim()
  if (!txt) throw new ErrorIA('El modelo devolvió una respuesta vacía.')

  try {
    return JSON.parse(txt)
  } catch {
    throw new ErrorIA('El modelo devolvió algo que no se pudo leer.')
  }
}

/* ------------------------------------------------------------------ *
 * Analizar
 * ------------------------------------------------------------------ */

export interface SintesisIA {
  sintesis: string
  base: string
  tension: string
}

/**
 * Tope de campos por llamada. Una pantalla de cierre puede juntar cuarenta y
 * pico: sin tope, la espera y la respuesta se disparan. Se priorizan los vacíos.
 */
const MAX_CAMPOS = 24

export interface ResultadoSintesis {
  campos: Map<string, SintesisIA>
  /** cuántos campos quedaron fuera por el tope, para poder decirlo */
  omitidos: number
}

/** Redacta la síntesis de cada campo de la pantalla sobre toda la evidencia. */
export async function sintetizar(v: Values, pantalla: string, grupos: AnalisisGrupo[]): Promise<ResultadoSintesis> {
  const todos = grupos.flatMap((b) => b.items.map((it) => ({ it, grupo: b.label })))
  // primero los que están vacíos: ahí es donde el análisis hace más falta
  const orden = [...todos].sort((a, z) => Number(Boolean(a.it.actual)) - Number(Boolean(z.it.actual)))
  const elegidos = orden.slice(0, MAX_CAMPOS)
  if (!elegidos.length) return { campos: new Map(), omitidos: 0 }

  const instruccion = [
    'EVIDENCIA RECOLECTADA',
    evidencia(v) || '(todavía no hay nada capturado)',
    '',
    `CAMPOS A SINTETIZAR — pantalla "${pantalla}"`,
    ...elegidos.map(({ it, grupo }) =>
      [`- clave: ${it.clave}`, `  campo: ${grupo} · ${it.pregunta}`, `  texto actual: ${it.actual || '(vacío)'}`].join('\n'),
    ),
    '',
    'TAREA',
    'Para cada clave listada devuelve un objeto con sintesis, base y tension.',
    'La sintesis es el texto que se va a guardar tal cual en el campo: escríbela como definición final, no como comentario sobre las entrevistas.',
    'Si el campo ya tiene texto, no lo repitas: propón la versión que la evidencia realmente sostiene, aunque contradiga lo escrito.',
    'Sé breve: la sintesis de una a tres frases, la base una sola frase, la tension como mucho dos.',
    'Devuelve exactamente un objeto por clave, con la clave copiada literal.',
  ].join('\n')

  const data = (await llamar(instruccion, ESQUEMA_SINTESIS)) as { campos?: { clave: string; sintesis: string; base: string; tension: string }[] }
  const campos = new Map<string, SintesisIA>()
  ;(data.campos ?? []).forEach((c) => {
    if (c?.clave && c.sintesis?.trim()) {
      campos.set(c.clave, { sintesis: c.sintesis.trim(), base: c.base?.trim() ?? '', tension: c.tension?.trim() ?? '' })
    }
  })
  return { campos, omitidos: todos.length - elegidos.length }
}

/* ------------------------------------------------------------------ *
 * Cuestionar
 * ------------------------------------------------------------------ */

/** Reescribe las repreguntas para que hablen de la respuesta concreta, no de un molde. */
export async function repreguntar(v: Values, pantalla: string, dudas: Repregunta[]): Promise<Map<string, string[]>> {
  const conTexto = dudas.filter((d) => d.respuesta)
  if (!conTexto.length) return new Map()

  const instruccion = [
    'EVIDENCIA RECOLECTADA',
    evidencia(v) || '(todavía no hay nada capturado)',
    '',
    `RESPUESTAS QUE NECESITAN OTRA VUELTA — pantalla "${pantalla}"`,
    ...conTexto.map((d) =>
      [`- clave: ${d.clave}`, `  pregunta: ${d.pregunta}`, `  respuesta: ${d.respuesta}`].join('\n'),
    ),
    '',
    'TAREA',
    'Para cada clave escribe TRES repreguntas sobre esa respuesta en concreto.',
    'Cada repregunta debe citar o apoyarse en algo que esa respuesta dice: no deben poder aplicarse a ninguna otra respuesta de la lista.',
    'Si la respuesta contradice lo que dijo otra unidad o el propio CEO en otra parte de la evidencia, una de las tres debe confrontarlo nombrando la fuente.',
    'Directas, sin rodeos, como las haría un consultor senior en la sala.',
  ].join('\n')

  const data = (await llamar(instruccion, ESQUEMA_DUDAS)) as { dudas?: { clave: string; repreguntas: string[] }[] }
  const salida = new Map<string, string[]>()
  ;(data.dudas ?? []).forEach((d) => {
    const limpias = (d?.repreguntas ?? []).map((r) => r.trim()).filter(Boolean)
    if (d?.clave && limpias.length) salida.set(d.clave, limpias)
  })
  return salida
}
