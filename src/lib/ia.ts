import {
  ARCHIVOS_DG,
  BLOQUE_UNIDAD,
  BLOQUES_CEO,
  CAMPOS_PROPUESTA,
  DGS,
  UNIDADES,
  VISTAS_CONSOLIDADO,
} from '../data/content'
import { IMPERATIVOS_MANIFIESTO, PDV_MANIFIESTO } from '../data/manifiesto'
import type { AnalisisGrupo } from './asistenteEntrevista'
import { EJEMPLOS_ARQUITECTURA } from '../data/ejemplos'
import { IMP_DEFAULT, K, documento, unidadDe } from './model'
import { MOLDES_PDV, campoPdv, conArranque } from './redaccionPdv'
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
 * Todo lo capturado, agrupado POR PREGUNTA. El CEO y las unidades contestan
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

/**
 * El modelo VIBE que UPAX ya trabajó (pestaña "Manifiesto UPAX"), en texto plano
 * para el prompt. No es evidencia más: es el marco contra el que hay que
 * contrastar lo que dicen las entrevistas antes de concluir nada.
 */
export function marcoVibe(): string {
  const out: string[] = ['=== MODELO VIBE YA TRABAJADO POR UPAX ===', '', '-- V · PROPUESTA DE VALOR --']

  PDV_MANIFIESTO.forEach((c) => out.push(`${c.tag.toUpperCase()}: ${c.texto}`))

  IMPERATIVOS_MANIFIESTO.forEach((im) => {
    out.push(
      '',
      `-- I · IMPERATIVO ${im.num}: ${im.nombre.toUpperCase()} (${im.bajada}) --`,
      'B · CULTURA — cómo pensamos, decidimos y actuamos:',
      ...im.cultura.rasgos.map((r) => `  ${r.nombre.toUpperCase()}: ${r.texto}`),
      ...(im.cultura.nota ? [`  Nota del Manifiesto: ${im.cultura.nota}`] : []),
      `  Prácticas corporativas: ${im.cultura.practicas.join(' ')}`,
      `  Mecanismos de refuerzo: ${im.cultura.mecanismos.join(' ')}`,
      'E · NEGOCIO:',
      `  Estándar: ${im.negocio.estandar}`,
      `  Indicadores críticos: ${im.negocio.indicadores.join(' ')}`,
      `  Procesos críticos: ${im.negocio.procesos.join(' ')}`,
      `  Políticas: ${im.negocio.politicas.join(' ')}`,
    )
  })

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
  'Recibes además el MODELO VIBE que UPAX ya trabajó: su propuesta de valor, sus imperativos estratégicos y, por imperativo, su cultura y su negocio.',
  'Tu entregable no es un reporte de lo que dijo cada quien: es la conclusión que el grupo va a adoptar.',
  '',
  'Cómo trabajas:',
  '- Lees todas las respuestas de un mismo tema y decides qué sostiene realmente la evidencia. Donde hay divergencia, tomas postura razonada en lugar de listar posturas.',
  '- CONTRASTAS la evidencia contra el modelo VIBE ya trabajado antes de concluir. La evidencia dice qué está pasando; el modelo dice qué acordó UPAX que debía pasar. Tu conclusión se escribe sabiendo las dos cosas.',
  '- El modelo VIBE no es una plantilla que haya que repetir ni una respuesta que haya que forzar: es el marco contra el cual se lee la evidencia. Nunca lo cites como si fuera algo que dijo un entrevistado.',
  '- Cuando la evidencia confirma el modelo, la conclusión lo dice con las palabras del modelo y gana fuerza. Cuando la evidencia lo contradice o revela que no se está cumpliendo, mandas la evidencia y señalas la brecha: eso es un hallazgo, no un error que haya que suavizar.',
  '- Cuando la evidencia toca algo que el modelo ya define —un imperativo, un rasgo de cultura, un estándar, un indicador, un proceso o una política—, lo conectas explícitamente en lugar de redactar en paralelo como si el modelo no existiera.',
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

export class ErrorIA extends Error {
  constructor(
    message: string,
    /** true cuando no vale la pena reintentar: falta la llave o está mal */
    readonly sinLlave = false,
  ) {
    super(message)
  }
}

async function llamar(sistema: string, instruccion: string, esquema: unknown): Promise<unknown> {
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
        system: sistema,
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

/**
 * Los tres campos de la Propuesta de Valor tienen arranque fijo. Se le dice al
 * modelo antes de escribir —y de todos modos se verifica al recibir—, tanto
 * cuando redacta la síntesis como cuando solo corrige la redacción.
 */
function reglasDeForma(lote: Lote): string[] {
  return lote.items
    .map((it) => {
      const campo = campoPdv(it.clave)
      return campo ? `- ${it.clave} → el texto empieza literalmente con ${MOLDES_PDV[campo].regla}` : ''
    })
    .filter(Boolean)
}

async function sintetizarLote(v: Values, pantalla: string, lote: Lote): Promise<Map<string, SintesisIA>> {
  const forma = reglasDeForma(lote)

  const instruccion = [
    // el marco va primero: se lee la evidencia sabiendo contra qué se contrasta
    marcoVibe(),
    '',
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
    'Antes de redactar, contrasta esas respuestas contra el MODELO VIBE de arriba: qué lo confirma, qué lo contradice y qué el modelo ya define y la evidencia todavía no alcanza.',
    'En `base`, además del respaldo de las entrevistas, di si la conclusión se apoya en el modelo VIBE o se aparta de él. En `tension`, una brecha entre lo que el modelo declara y lo que la evidencia muestra cuenta como decisión pendiente.',
    'La sintesis se guarda tal cual en el documento: escríbela como la frase que UPAX adopta, no como comentario sobre las entrevistas ni como recuento de posturas.',
    'Si el campo ya tiene texto, evalúalo contra la evidencia y propón la versión que la evidencia sostiene, aunque contradiga lo escrito.',
    'Sé breve: sintesis una o dos frases, base una, tension como mucho dos.',
    'Devuelve exactamente un objeto por clave, con la clave copiada literal.',
    ...(forma.length
      ? [
          '',
          'FORMA OBLIGATORIA DE LA REDACCIÓN',
          ...forma,
          'No es una preferencia de estilo: una sintesis que no empiece así está mal escrita.',
          'El arranque es parte de la frase, no un título: lo que sigue debe leerse de corrido con él.',
          'En el campo «Cómo lo hacemos» el verbo va en futuro y en primera persona del plural, sin excepción.',
        ]
      : []),
  ].join('\n')

  const data = (await llamar(SISTEMA, instruccion, ESQUEMA_SINTESIS)) as {
    campos?: { clave: string; sintesis: string; base: string; tension: string }[]
  }
  const campos = new Map<string, SintesisIA>()
  ;(data.campos ?? []).forEach((c) => {
    if (c?.clave && c.sintesis?.trim()) {
      campos.set(c.clave, {
        sintesis: conArranque(c.clave, c.sintesis),
        base: c.base?.trim() ?? '',
        tension: c.tension?.trim() ?? '',
      })
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
 * Proponer imperativos
 * ------------------------------------------------------------------ */

export interface ImperativoPropuesto {
  nombre: string
  corto: string
}

const ESQUEMA_IMPERATIVOS = {
  type: 'object',
  properties: {
    imperativos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre: {
            type: 'string',
            description:
              'El imperativo redactado como lo que UPAX tiene que lograr excepcionalmente bien. Una frase, en presente, concreta y verificable. No un valor ni una aspiración.',
          },
          corto: {
            type: 'string',
            description:
              'Una o dos palabras que lo nombren, para usarlo como encabezado de columna. En mayúscula inicial, sin punto final.',
          },
        },
        required: ['nombre', 'corto'],
        additionalProperties: false,
      },
    },
  },
  required: ['imperativos'],
  additionalProperties: false,
} as const

/**
 * Las tres arquitecturas de "Ver ejemplos", en texto. Son el ancla de nivel: sin
 * ellas el modelo escribe consignas de cartel en vez de imperativos.
 */
function ejemplosDeReferencia(): string {
  const out: string[] = ['=== ARQUITECTURAS DE REFERENCIA (cómo se escribe un imperativo) ===']
  EJEMPLOS_ARQUITECTURA.forEach((e) => {
    out.push(
      '',
      `${e.empresa} — existe para: ${e.existimos} Promesa: “${e.promesa}”`,
      ...e.imperativos.map((im) => `  · ${im.nombre} → estándar: ${im.estandar}`),
    )
  })
  return out.join('\n')
}

/**
 * Los candidatos que el grupo va a discutir en la mesa. El modelo no decide
 * cuáles quedan —eso se marca a mano en la pantalla—, así que aquí conviene
 * cubrir el espacio: propuestas distintas entre sí, no diez versiones de dos.
 */
export async function proponerImperativos(v: Values): Promise<ImperativoPropuesto[]> {
  // lo que el grupo ya redactó en la 05 pesa más que el marco: es su versión
  const capturados = CAMPOS_PROPUESTA.map((c) => {
    const texto = g(v, K.pdv(c.id))
    return texto ? `${c.tag}: ${texto}` : ''
  }).filter(Boolean)

  const instruccion = [
    marcoVibe(),
    '',
    ejemplosDeReferencia(),
    '',
    'EVIDENCIA RECOLECTADA',
    evidencia(v) || '(todavía no hay nada capturado)',
    '',
    ...(capturados.length ? ['PROPUESTA DE VALOR YA REDACTADA EN LA PLATAFORMA', ...capturados, ''] : []),
    'TAREA',
    `Propón exactamente ${IMP_DEFAULT} imperativos estratégicos candidatos para UPAX.`,
    'Un imperativo es lo que UPAX tiene que lograr excepcionalmente bien para sostener su propuesta de valor. No es un valor, no es una iniciativa y no es un deseo.',
    '',
    'DE DÓNDE SALEN, EN ESTE ORDEN:',
    `1. Del MODELO VIBE de arriba: los ${IMPERATIVOS_MANIFIESTO.length} que UPAX ya trabajó van incluidos, redactados a la luz de lo que se levantó en las entrevistas. No los reinventes ni los renombres por variar.`,
    '2. De la evidencia: lo que las entrevistas y los archivos exigen y el modelo todavía no cubre.',
    '3. De las arquitecturas de referencia: úsalas para calibrar el NIVEL de concreción y la forma de redactar, no para importar su contenido. UPAX no es una armadora ni una cadena de autoservicio; un imperativo de Toyota copiado tal cual es un error.',
    '',
    'Si no hay evidencia suficiente para llegar a diez, extiende desde el modelo VIBE y desde la propuesta de valor de UPAX: prefiere un imperativo derivado de lo que UPAX ya declaró antes que uno inventado.',
    `Los ${IMP_DEFAULT} son candidatos para que el grupo elija en vivo: cubre el espacio en vez de repetirte. Dos propuestas que se resuelven con la misma decisión son una sola.`,
    'Ordénalos de más a menos respaldado por la evidencia; los que ya están en el modelo VIBE y la evidencia confirma van primero.',
    'Nada de lenguaje genérico: "excelencia", "sinergia", "ser los mejores" no son imperativos.',
  ].join('\n')

  const data = (await llamar(SISTEMA, instruccion, ESQUEMA_IMPERATIVOS)) as {
    imperativos?: { nombre: string; corto: string }[]
  }

  const propuestos = (data.imperativos ?? [])
    .map((im) => ({ nombre: (im?.nombre ?? '').trim(), corto: (im?.corto ?? '').trim() }))
    .filter((im) => im.nombre)
    .slice(0, IMP_DEFAULT)

  if (!propuestos.length) throw new ErrorIA('El modelo no devolvió ningún imperativo utilizable.')
  return propuestos
}

/* ------------------------------------------------------------------ *
 * Elevar la redacción
 * ------------------------------------------------------------------ */

/**
 * Otro oficio, no otra versión del mismo. El de arriba lee la evidencia cruda y
 * decide QUÉ dice el documento; este ya no discute el contenido: toma la idea
 * que el grupo decidió y la vuelve a escribir al nivel de un documento que se
 * presenta a un consejo. No es un corrector de ortografía: es un salto de
 * registro.
 */
const SISTEMA_REDACCION = [
  'Escribes como el CEO de una empresa trasnacional que cotiza en Wall Street. Ese es el nivel exigido:',
  'lo que redactas se lee en un comité ejecutivo, en un informe anual y frente a inversionistas.',
  '',
  `Trabajas sobre la arquitectura de cultura ya decidida de UPAX: grupo mexicano con ${UNIDADES.length} unidades de negocio`,
  `(${UNIDADES.map((u) => u.nombre).join(', ')}).`,
  '',
  'NO eres un corrector de ortografía. Corregir acentos y comas no es tu trabajo y no es lo que se te pide.',
  'Tu trabajo es tomar la MISMA idea y volver a escribirla con un lenguaje incomparablemente más profesional.',
  '',
  'Qué significa eso:',
  '- Subes el registro: vocabulario preciso de negocio, sintaxis firme, cadencia de documento corporativo.',
  '- Conviertes descripción en compromiso. Una frase de trabajo se vuelve una declaración que la empresa sostiene.',
  '- Eliminas el tono coloquial, lo tentativo y lo aproximado. Nada de "tratar de", "buscar", "más o menos", "etc.".',
  '- Voz activa, presente o futuro según corresponda, afirmativo, sin condicionales ni disculpas.',
  '- Densidad: cada palabra carga peso. Si sobra, se va. Elevar no es alargar ni adornar.',
  '',
  'Lo único que NO puedes hacer:',
  '- Cambiar la idea. Sale la misma decisión, dicha a otro nivel.',
  '- Agregar hechos, cifras, plazos, nombres o compromisos que no estén ya en el texto original.',
  '- Quitar algo sustantivo con el pretexto de la síntesis.',
  '- Caer en el lenguaje corporativo vacío que suena a folleto: "excelencia", "sinergia", "clase mundial",',
  '  "valor agregado", "liderazgo", "de vanguardia". Eso es lo contrario de escribir como un CEO serio.',
  '',
  'Español de México. Sin preámbulo ni comentario: entregas la frase lista para el documento.',
  'Siempre entregas una versión elevada. Devolver el texto idéntico solo se justifica si ya está exactamente a ese nivel.',
].join('\n')

const ESQUEMA_REDACCION = {
  type: 'object',
  properties: {
    campos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          clave: { type: 'string', description: 'la clave exacta del campo, copiada de la lista' },
          texto: {
            type: 'string',
            description:
              'La misma idea, escrita al nivel de un CEO de empresa trasnacional que cotiza en bolsa. Es lo que se guarda tal cual en el documento.',
          },
          cambio: {
            type: 'string',
            description:
              'Qué se elevó, en una frase corta y concreta (por ejemplo: "de descripción operativa a compromiso institucional"). Cadena vacía solo si el texto quedó idéntico.',
          },
        },
        required: ['clave', 'texto', 'cambio'],
        additionalProperties: false,
      },
    },
  },
  required: ['campos'],
  additionalProperties: false,
} as const

export interface CorreccionIA {
  texto: string
  cambio: string
}

async function corregirLote(lote: Lote): Promise<Map<string, CorreccionIA>> {
  const instruccion = [
    `TEXTOS A ELEVAR — bloque "${lote.grupo}"`,
    ...lote.items.map((it) => [`- clave: ${it.clave}`, `  campo: ${it.pregunta}`, `  texto: ${it.actual}`].join('\n')),
    '',
    'TAREA',
    'Reescribe cada texto con un lenguaje mucho más profesional, conservando exactamente la misma idea.',
    'El campo dice qué papel juega ese texto en el documento: úsalo para calibrar el registro, no para agregarle contenido.',
    'Devuelve exactamente un objeto por clave, con la clave copiada literal.',
    ...(reglasDeForma(lote).length
      ? ['', 'FORMA OBLIGATORIA DE LA REDACCIÓN', ...reglasDeForma(lote), 'Si el texto no empieza así, ajústalo.']
      : []),
  ].join('\n')

  const data = (await llamar(SISTEMA_REDACCION, instruccion, ESQUEMA_REDACCION)) as {
    campos?: { clave: string; texto: string; cambio: string }[]
  }
  const campos = new Map<string, CorreccionIA>()
  ;(data.campos ?? []).forEach((c) => {
    if (c?.clave && c.texto?.trim()) {
      campos.set(c.clave, { texto: conArranque(c.clave, c.texto), cambio: c.cambio?.trim() ?? '' })
    }
  })
  return campos
}

export interface ResultadoCorreccion {
  campos: Map<string, CorreccionIA>
  omitidos: number
  fallidos: number
}

/** Reescribe a nivel ejecutivo todo lo que ya tiene texto escrito. */
export async function corregir(
  grupos: AnalisisGrupo[],
  onLote?: (hechos: number, total: number) => void,
): Promise<ResultadoCorreccion> {
  const lotes: Lote[] = []
  grupos.forEach((b) => {
    // sin texto no hay nada que corregir: no se gasta la llamada
    const conTexto = b.items.filter((it) => it.actual)
    for (let i = 0; i < conTexto.length; i += MAX_POR_LOTE) {
      lotes.push({ grupo: b.label, items: conTexto.slice(i, i + MAX_POR_LOTE) })
    }
  })

  const elegidos = lotes.slice(0, MAX_LOTES)
  const omitidos = lotes.slice(MAX_LOTES).reduce((n, l) => n + l.items.length, 0)
  if (!elegidos.length) return { campos: new Map(), omitidos: 0, fallidos: 0 }

  let hechos = 0
  const resultados = await Promise.allSettled(
    elegidos.map((l) =>
      corregirLote(l).finally(() => {
        hechos++
        onLote?.(hechos, elegidos.length)
      }),
    ),
  )

  const campos = new Map<string, CorreccionIA>()
  resultados.forEach((r) => {
    if (r.status === 'fulfilled') r.value.forEach((val, clave) => campos.set(clave, val))
  })

  const fallidos = resultados.filter((r) => r.status === 'rejected').length
  if (fallidos === resultados.length) {
    const primero = resultados.find((r) => r.status === 'rejected') as PromiseRejectedResult
    throw primero.reason instanceof ErrorIA ? primero.reason : new ErrorIA('No se pudo consultar al modelo.')
  }

  return { campos, omitidos, fallidos }
}

/* ------------------------------------------------------------------ *
 * Diamante de alineación · auto-análisis
 * ------------------------------------------------------------------ */

/** Lo ya sintetizado en el Consolidado: la lectura que el grupo dio por buena. */
function consolidadoTexto(v: Values): string {
  const out: string[] = []
  VISTAS_CONSOLIDADO.forEach((vista) => {
    vista.temas.forEach((t) => {
      const texto = g(v, K.cons(vista.id, t.id))
      if (texto) out.push(`${vista.label} · ${t.label}: ${texto}`)
    })
  })
  return out.length ? ['=== SÍNTESIS APROBADAS EN EL CONSOLIDADO ===', ...out].join('\n') : ''
}

/** La arquitectura ya redactada en el Off-Site, bloque por bloque. */
function arquitecturaTexto(v: Values): string {
  const out: string[] = []
  documento(v).forEach((sec) => {
    const items = sec.items.filter((it) => it.texto)
    if (items.length) out.push(`-- ${sec.titulo} --`, ...items.map((it) => `  ${it.label}: ${it.texto}`))
  })
  return out.length ? ['=== ARQUITECTURA YA REDACTADA EN LA PLATAFORMA ===', ...out].join('\n') : ''
}

/** Las lecturas de alineación que el equipo marcó a mano, pregunta por pregunta. */
function alineacionTexto(v: Values): string {
  const out: string[] = []
  BLOQUES_CEO.forEach((b) => {
    b.preguntas.forEach((pregunta, q) => {
      const grado = g(v, K.alinGrado(b.id, q))
      const nota = g(v, K.alinNota(b.id, q))
      if (grado || nota) out.push(`${b.label} · P${q + 1} ${pregunta}`, `  ${grado || 'sin marcar'}${nota ? ` — ${nota}` : ''}`)
    })
  })
  return out.length ? ['=== LECTURA MANUAL DE ALINEACIÓN CEO ↔ DGs ===', ...out].join('\n') : ''
}

/** Todo lo que hay capturado en la plataforma, en un solo texto para el modelo. */
export function contextoCompleto(v: Values): string {
  return [
    marcoVibe(),
    '',
    'EVIDENCIA RECOLECTADA (entrevistas y archivos)',
    evidencia(v) || '(todavía no hay nada capturado)',
    '',
    consolidadoTexto(v),
    '',
    alineacionTexto(v),
    '',
    arquitecturaTexto(v),
  ]
    .filter((x) => x !== '')
    .join('\n')
}

export type EjeDiamante = 'est' | 'ofe' | 'gen' | 'pro'

export interface CalificacionEje {
  puntaje: number
  sustento: string
}

export interface DiamanteIA {
  ejes: Record<EjeDiamante, CalificacionEje>
  /** el veredicto de conjunto, en dos o tres frases */
  lectura: string
}

const SISTEMA_DIAMANTE = [
  'Eres consultor senior de management, nivel socio de firma de primer nivel. Calificas el Diamante de Alineación',
  `de UPAX: grupo mexicano con ${UNIDADES.length} unidades de negocio (${UNIDADES.map((u) => u.nombre).join(', ')}).`,
  '',
  'El diamante son cuatro fuerzas, cada una de 0 a 10:',
  '- ESTRATEGIA: rumbo claro, decidido y vigente; la dirección sabe a qué le dice que no.',
  '- OFERTA: los productos y servicios resuelven algo que el cliente valora y paga, y se diferencian.',
  '- GENTE: el equipo tiene capacidad, información y disposición para ejecutar lo que se decidió.',
  '- PROCESOS: la operación entrega con consistencia, sin depender del héroe de turno; documentada y medida.',
  '',
  'Cómo calificas:',
  '- Calificas EVIDENCIA, no intención. Un 8 exige que puedas nombrar el hecho que lo sostiene; si solo hay una sensación o una declaración de buenas intenciones, es 5.',
  '- La ausencia de información no es un 5 de cortesía ni un 8 por default: si no hay nada que sostenga el eje, califica bajo y dilo en el sustento.',
  '- Lo que una empresa DECLARA en su manifiesto no es evidencia de que ocurra. Evidencia es lo que las entrevistas y los archivos muestran que pasa.',
  '- La divergencia entre el CEO y los directores es información dura: un rumbo que solo existe en la cabeza del CEO baja Estrategia, no la sube.',
  '- No inflas para quedar bien ni castigas para parecer riguroso. La calificación tiene que poder defenderse frente al comité con hechos concretos.',
  '',
  'El sustento de cada eje: dos frases como máximo, en español de México, tono ejecutivo y directo.',
  'Nombra la evidencia concreta —quién lo dijo, qué unidad, qué documento— en vez de generalidades. Nada de "excelencia", "sinergia" ni "clase mundial".',
].join('\n')

const ESQUEMA_DIAMANTE = {
  type: 'object',
  properties: {
    ejes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          eje: { type: 'string', enum: ['est', 'ofe', 'gen', 'pro'], description: 'est=Estrategia, ofe=Oferta, gen=Gente, pro=Procesos' },
          // el rango va en la descripción y se vuelve a acotar al recibir: la API
          // no admite minimum/maximum en un integer dentro del esquema de salida
          puntaje: { type: 'integer', description: 'la calificación del eje: un entero de 0 a 10' },
          sustento: {
            type: 'string',
            description:
              'Por qué ese número y no otro, citando la evidencia concreta que lo sostiene o diciendo que no la hay. Máximo dos frases.',
          },
        },
        required: ['eje', 'puntaje', 'sustento'],
        additionalProperties: false,
      },
    },
    lectura: {
      type: 'string',
      description:
        'El veredicto de conjunto en dos o tres frases: qué figura sale, por dónde se está fugando el resultado y cuál es el movimiento que más mueve la figura.',
    },
  },
  required: ['ejes', 'lectura'],
  additionalProperties: false,
} as const

/**
 * Auto-análisis del diamante: el modelo lee TODO lo que hay en la plataforma
 * —manifiesto, entrevistas, archivos, consolidado, lectura de alineación y la
 * arquitectura ya redactada— y califica los cuatro ejes con su sustento. Lo que
 * devuelve es un punto de partida para discutir en la mesa, no un veredicto:
 * los deslizadores siguen siendo editables después.
 */
export async function calificarDiamante(v: Values): Promise<DiamanteIA> {
  const instruccion = [
    contextoCompleto(v),
    '',
    'TAREA',
    'Con TODO lo anterior, califica los cuatro ejes del Diamante de Alineación de UPAX de 0 a 10 y escribe la lectura de conjunto.',
    'Usa toda la información disponible, no solo un bloque: las entrevistas dicen qué está pasando, el modelo VIBE dice qué acordó UPAX que debía pasar, y la brecha entre ambos es parte de la calificación.',
    'Devuelve exactamente los cuatro ejes, una vez cada uno.',
  ].join('\n')

  const data = (await llamar(SISTEMA_DIAMANTE, instruccion, ESQUEMA_DIAMANTE)) as {
    ejes?: { eje: string; puntaje: number; sustento: string }[]
    lectura?: string
  }

  const ejes = {} as Record<EjeDiamante, CalificacionEje>
  ;(data.ejes ?? []).forEach((e) => {
    const id = e?.eje as EjeDiamante
    if (!['est', 'ofe', 'gen', 'pro'].includes(id)) return
    const n = Math.round(Number(e.puntaje))
    if (!Number.isFinite(n)) return
    ejes[id] = { puntaje: Math.min(10, Math.max(0, n)), sustento: (e.sustento ?? '').trim() }
  })

  if (Object.keys(ejes).length < 4) throw new ErrorIA('El modelo no devolvió los cuatro ejes calificados.')
  return { ejes, lectura: (data.lectura ?? '').trim() }
}
