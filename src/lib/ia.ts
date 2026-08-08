import { ARCHIVOS_DG, BLOQUE_UNIDAD, BLOQUES_CEO, DGS, UNIDADES } from '../data/content'
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

/**
 * Todo lo capturado, agrupado POR PREGUNTA. El CEO y las ocho unidades contestan
 * el mismo guion, así que ponerlos uno junto a otro bajo cada pregunta es lo que
 * permite comparar posturas en vez de leer dos entrevistas por separado.
 */
export function evidencia(v: Values): string {
  const out: string[] = []

  // el bloque propio de la unidad va al final: ahí el CEO no contesta
  ;[...BLOQUES_CEO, BLOQUE_UNIDAD].forEach((b) => {
    const compartido = b.id !== BLOQUE_UNIDAD.id
    const delBloque: string[] = []

    b.preguntas.forEach((pregunta, q) => {
      const voces: string[] = []
      if (compartido) {
        const delCeo = g(v, K.ceo(b.id, q))
        if (delCeo) voces.push(`  CEO → ${delCeo}`)
      }
      DGS.forEach((d) => {
        const r = g(v, K.dg(d, b.id, q))
        if (r) voces.push(`  ${unidadDe(v, d)} → ${r}`)
      })
      // una pregunta que nadie contestó no aporta y solo alarga el prompt
      if (voces.length) delBloque.push(`P${q + 1}. ${pregunta}`, ...voces, '')
    })

    if (delBloque.length) {
      out.push(
        compartido
          ? `=== BLOQUE: ${b.label.toUpperCase()} (mismo guion para CEO y unidades) ===`
          : `=== ${b.label.toUpperCase()} (solo responden las unidades; el CEO no contesta este bloque) ===`,
        ...delBloque,
      )
    }
  })

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
  'Eres consultor senior de management, nivel socio de firma de primer nivel, conduciendo el proceso de arquitectura',
  `de cultura de UPAX: grupo mexicano con ${UNIDADES.length} unidades de negocio (${UNIDADES.map((u) => u.nombre).join(', ')}).`,
  '',
  'Recibes las respuestas del CEO y de los directores de cada unidad a LAS MISMAS preguntas.',
  'Tu entregable no es un reporte de lo que dijo cada quien: es la conclusión que el grupo va a adoptar.',
  '',
  'Cómo trabajas:',
  '- Lees todas las respuestas de un mismo tema y decides qué sostiene realmente la evidencia. Donde hay divergencia, tomas postura razonada en lugar de listar posturas.',
  '- Escribes la conclusión como definición final del documento: en presente, afirmativa, sin condicionales ni "debería". Un director tiene que poder leerla en voz alta en el comité sin editarla.',
  '- Distingues una diferencia de énfasis de un desacuerdo real. Solo lo segundo es una decisión pendiente.',
  '- Rechazas el lenguaje genérico: "calidad", "excelencia", "sinergia", "clase mundial", "ser los mejores" no son conclusiones, son ruido. Si toda la evidencia es de ese tipo, lo dices en vez de maquillarlo.',
  '- No inventas. Todo lo que afirmes tiene que poder rastrearse a una respuesta concreta.',
  '- Español de México. Tono ejecutivo y directo, sin preámbulo ni cierre cortés.',
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
              'La conclusión. Una o dos frases en presente, redactadas como la definición final que UPAX adopta — no como resumen de lo que dijo cada quien. Es lo que se guarda tal cual en el documento. Cadena vacía solo si la evidencia no da para ninguna conclusión.',
          },
          base: {
            type: 'string',
            description:
              'En una frase: sobre qué se sostiene la conclusión y qué tan sólido es el respaldo — quién converge y cuántas unidades lo respaldan.',
          },
          tension: {
            type: 'string',
            description:
              'La decisión que el grupo tiene pendiente: qué hay que resolver y por qué importa para el negocio. No una lista de quién dijo qué. Máximo dos frases. Cadena vacía si no hay desacuerdo real, solo diferencias de énfasis.',
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

  if (!res.ok) {
    // el mensaje de la propia API dice mucho más que cualquier suposición nuestra
    const detalle = await res
      .json()
      .then((e: { error?: { message?: string } }) => e?.error?.message ?? '')
      .catch(() => '')

    if (res.status === 401 || res.status === 403) {
      throw new ErrorIA(
        `La API rechazó la llave (${res.status}). ${detalle} · Si acabas de ponerla en .env.local, reinicia el servidor: Vite solo lee las variables al arrancar.`,
        true,
      )
    }
    throw new ErrorIA(`El modelo respondió ${res.status}. ${detalle.slice(0, 180)}`)
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
 * El modelo escribe ~60 tokens por segundo, en serie. Una sola llamada con los
 * trece campos del consolidado son ~2100 tokens de salida: 35 segundos, y el
 * effort no cambia nada porque el tiempo se va en escribir, no en pensar.
 * Medido: 13 campos = 35s, 3 campos = 13s. Por eso se manda un lote por bloque
 * y se corren en paralelo: la espera pasa a ser la del lote más lento.
 */
const MAX_POR_LOTE = 6
/** tope de llamadas simultáneas, para no chocar con el límite de la cuenta */
const MAX_LOTES = 6

interface Lote {
  grupo: string
  items: AnalisisGrupo['items']
}

export interface ResultadoSintesis {
  campos: Map<string, SintesisIA>
  /** cuántos campos quedaron fuera por el tope, para poder decirlo */
  omitidos: number
  /** cuántos lotes fallaron, para no cantar victoria completa */
  fallidos: number
}

const vacios = (l: Lote) => l.items.filter((it) => !it.actual).length

async function sintetizarLote(v: Values, pantalla: string, lote: Lote): Promise<Map<string, SintesisIA>> {
  const instruccion = [
    'EVIDENCIA RECOLECTADA',
    evidencia(v) || '(todavía no hay nada capturado)',
    '',
    `CAMPOS A SINTETIZAR — pantalla "${pantalla}", bloque "${lote.grupo}"`,
    ...lote.items.map((it) =>
      [`- clave: ${it.clave}`, `  campo: ${it.pregunta}`, `  texto actual: ${it.actual || '(vacío)'}`].join('\n'),
    ),
    '',
    'TAREA',
    'Para cada clave, analiza TODAS las respuestas del tema —la del CEO y la de cada unidad a la misma pregunta— y entrega tu conclusión.',
    'La sintesis se guarda tal cual en el documento: escríbela como la frase que UPAX adopta, no como comentario sobre las entrevistas ni como recuento de posturas.',
    'Si el campo ya tiene texto, evalúalo contra la evidencia y propón la versión que la evidencia sostiene, aunque contradiga lo escrito.',
    'Sé breve: sintesis una o dos frases, base una, tension como mucho dos.',
    'Devuelve exactamente un objeto por clave, con la clave copiada literal.',
  ].join('\n')

  const data = (await llamar(instruccion, ESQUEMA_SINTESIS)) as {
    campos?: { clave: string; sintesis: string; base: string; tension: string }[]
  }
  const campos = new Map<string, SintesisIA>()
  ;(data.campos ?? []).forEach((c) => {
    if (c?.clave && c.sintesis?.trim()) {
      campos.set(c.clave, { sintesis: c.sintesis.trim(), base: c.base?.trim() ?? '', tension: c.tension?.trim() ?? '' })
    }
  })
  return campos
}

/** Redacta la síntesis de cada campo de la pantalla sobre toda la evidencia. */
export async function sintetizar(
  v: Values,
  pantalla: string,
  grupos: AnalisisGrupo[],
  /** avisa cada vez que un lote termina, para poder mostrar el avance */
  onLote?: (hechos: number, total: number) => void,
): Promise<ResultadoSintesis> {
  const lotes: Lote[] = []
  grupos.forEach((b) => {
    for (let i = 0; i < b.items.length; i += MAX_POR_LOTE) {
      lotes.push({ grupo: b.label, items: b.items.slice(i, i + MAX_POR_LOTE) })
    }
  })
  // primero donde más falta hace: los lotes con más campos vacíos
  lotes.sort((a, z) => vacios(z) - vacios(a))

  const elegidos = lotes.slice(0, MAX_LOTES)
  const omitidos = lotes.slice(MAX_LOTES).reduce((n, l) => n + l.items.length, 0)
  if (!elegidos.length) return { campos: new Map(), omitidos: 0, fallidos: 0 }

  let hechos = 0
  const resultados = await Promise.allSettled(
    elegidos.map((l) =>
      sintetizarLote(v, pantalla, l).finally(() => {
        hechos++
        onLote?.(hechos, elegidos.length)
      }),
    ),
  )

  const campos = new Map<string, SintesisIA>()
  resultados.forEach((r) => {
    if (r.status === 'fulfilled') r.value.forEach((val, clave) => campos.set(clave, val))
  })

  // si TODOS fallaron, es un error de verdad y hay que decirlo, no devolver vacío
  const fallidos = resultados.filter((r) => r.status === 'rejected').length
  if (fallidos === resultados.length) {
    const primero = resultados.find((r) => r.status === 'rejected') as PromiseRejectedResult
    throw primero.reason instanceof ErrorIA ? primero.reason : new ErrorIA('No se pudo consultar al modelo.')
  }

  return { campos, omitidos, fallidos }
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
