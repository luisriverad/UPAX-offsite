import {
  BLOQUES_CEO,
  CAMPOS_PROPUESTA,
  DGS,
  GUION,
  UNIDADES,
  VISTAS_CONSOLIDADO,
} from '../data/content'
import type { VistaConsolidado } from '../data/content'
import { ANGULO_CEO, gruposCeo, gruposDgs } from './asistenteEntrevista'
import type { Grupo } from './asistenteEntrevista'
import {
  COND_ROWS_DEFAULT,
  IMP_DEFAULT,
  K,
  columnas,
  imperativos,
  indicadoresDe,
  letraIndicador,
  listaDe,
  listaTexto,
  unidadDe,
} from './model'
import type { Values } from '../types'

/**
 * Traduce cada pantalla a los tramos que el asistente sabe leer: proponer
 * borradores con la evidencia ya capturada en el proceso.
 */

const g = (v: Values, k: string) => (v[k] ?? '').trim()

const int = (v: Values, k: string, def: number) => {
  const n = parseInt(v[k] ?? '', 10)
  return Number.isFinite(n) ? n : def
}

/* ------------------------------------------------------------------ *
 * Evidencia: de dónde saca cada pantalla su respaldo
 * ------------------------------------------------------------------ */

/** Lo que dijo el CEO en un bloque de su entrevista. */
function ceo(v: Values, bloque: string): string[] {
  const b = BLOQUES_CEO.find((x) => x.id === bloque)
  return b ? b.preguntas.map((_, q) => g(v, K.ceo(bloque, q))).filter(Boolean) : []
}

/** Lo que contestaron las unidades a una pregunta concreta del guion. */
function dgs(v: Values, bloque: string, q: number): string[] {
  return DGS.map((d) => g(v, K.dg(d, bloque, q))).filter(Boolean)
}

/** Todo lo que dijeron las unidades en un bloque completo. */
function dgsBloque(v: Values, bloque: string): string[] {
  return GUION.filter((p) => p.bloque === bloque).flatMap((p) => dgs(v, bloque, p.q))
}

/** Las síntesis ya escritas en el consolidado para una vista. */
function consolidado(v: Values, vista: string): string[] {
  const x = VISTAS_CONSOLIDADO.find((c) => c.id === vista)
  return x ? x.temas.map((t) => g(v, K.cons(vista, t.id))).filter(Boolean) : []
}

/** Lo capturado en una fila por imperativo (prácticas, estándares, procesos…). */
function porColumna(v: Values, key: (col: number) => string): string[] {
  return columnas(v)
    .map((c) => g(v, key(c.i)))
    .filter(Boolean)
}

const capitaliza = (t: string) => t.charAt(0) + t.slice(1).toLowerCase()

/* ------------------------------------------------------------------ *
 * Un armador por pantalla
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * 04 · síntesis del consolidado
 * ------------------------------------------------------------------ */

/**
 * Qué preguntas de su bloque alimentan a cada tema del consolidado. Como el CEO
 * y los DGs contestan EL MISMO guion, un solo juego de índices sirve para los
 * dos: la síntesis compara la respuesta del CEO contra la de cada unidad a la
 * misma pregunta, no dos textos que hablaban de cosas distintas.
 */
const FUENTES_TEMA: Record<string, number[]> = {
  'pdv.existimos': [0, 3],
  'pdv.promesa': [1, 2],
  'pdv.puente': [4],
  'imp.candidatos': [0, 3],
  'imp.prioridades': [1],
  'imp.dejar': [2],
  'cul.conductas': [0, 1],
  'cul.practicas': [3],
  'cul.mecanismos': [2, 3],
  'neg.estandares': [0],
  'neg.indicadores': [1],
  'neg.procesos': [0],
  'neg.politicas': [0],
}

const normaliza = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Palabras largas que aparecen en cualquier frase y no sirven para comparar. */
const SIN_PESO = new Set([
  'porque',
  'cuando',
  'donde',
  'nuestro',
  'nuestra',
  'nuestros',
  'nuestras',
  'siempre',
  'tambien',
  'entonces',
  'aunque',
  'mismo',
  'misma',
  'todos',
  'todas',
  'hacer',
  'tener',
  'estar',
  'poder',
  'sobre',
  'entre',
  'entre',
  'entre',
])

/** Términos con carga semántica de un texto, para medir si dos respuestas hablan de lo mismo. */
function terminos(t: string): Set<string> {
  return new Set(
    normaliza(t)
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 4 && !SIN_PESO.has(w)),
  )
}

function comparten(a: Set<string>, b: Set<string>): number {
  let n = 0
  a.forEach((w) => {
    if (b.has(w)) n++
  })
  return n
}

/** La frase más sustanciosa de una respuesta, sin el punto final: va entre comillas. */
function principal(t: string): string {
  const partes = t
    .split(/[.;!?]+\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const frase = partes.sort((a, z) => z.length - a.length)[0] ?? t.trim()
  return frase.replace(/[.;,:]+$/, '')
}

interface Voz {
  unidad: string
  texto: string
}

export interface SintesisLocal {
  /** el texto que va al campo: la definición, sin narrar quién dijo qué */
  sintesis: string
  /** sobre qué evidencia se apoya */
  base: string
  /** dónde no coinciden */
  tension: string
}

/**
 * Síntesis de respaldo, sin modelo. No puede redactar prosa nueva: elige la
 * formulación mejor sostenida por la evidencia y la entrega limpia, con la
 * atribución aparte. Cuando hay llave, el modelo reescribe esto encima.
 */
function sintesisTema(v: Values, bloque: string, idx: number[]): SintesisLocal {
  const vacia: SintesisLocal = { sintesis: '', base: '', tension: '' }

  const delCeo = idx.map((q) => g(v, K.ceo(bloque, q))).filter(Boolean)

  // mismas preguntas para todos: cada unidad se compara contra el CEO en el
  // mismo índice. Una unidad cuenta una sola vez aunque conteste varias.
  const porUnidad = new Map<string, string>()
  UNIDADES.forEach((u) => {
    const suyas = idx.map((q) => g(v, K.dg(u.id, bloque, q))).filter(Boolean)
    if (suyas.length) porUnidad.set(unidadDe(v, u.id), suyas.sort((a, z) => z.length - a.length)[0])
  })
  const voces: Voz[] = [...porUnidad].map(([unidad, texto]) => ({ unidad, texto }))

  if (!delCeo.length && !voces.length) return vacia

  // el CEO manda como referencia; si no contestó ese tema, la marca la primera unidad
  const conCeo = delCeo.length > 0
  const sintesis = conCeo ? principal(delCeo[0]) : principal(voces[0].texto)
  const resto = conCeo ? voces : voces.slice(1)

  const clave = terminos(sintesis)
  const coinciden = resto.filter((x) => comparten(clave, terminos(x.texto)) >= 2)
  const aparte = resto.filter((x) => !coinciden.includes(x))

  const base: string[] = []
  base.push(
    conCeo
      ? `${delCeo.length} ${delCeo.length === 1 ? 'respuesta' : 'respuestas'} del CEO`
      : `sin respuesta del CEO en este tema; formulación de ${voces[0].unidad}`,
  )
  if (coinciden.length) base.push(`la sostienen ${coinciden.map((x) => x.unidad).join(', ')}`)
  base.push(`${voces.length} de ${UNIDADES.length} unidades con respuesta`)

  const tension: string[] = []
  if (aparte.length) {
    tension.push(`${aparte[0].unidad} propone en cambio: “${principal(aparte[0].texto)}”`)
    if (aparte.length > 1) tension.push(`también se apartan ${aparte.slice(1).map((x) => x.unidad).join(', ')}`)
  }
  if (!voces.length) tension.push('ninguna unidad ha respondido sobre este tema todavía')

  return { sintesis, base: `${base.join(' · ')}.`, tension: tension.length ? `${tension.join('; ')}.` : '' }
}

/** 04 · una síntesis por tema, cruzando CEO y DGs sobre ese tema en concreto. */
function gruposConsolidado(v: Values): Grupo[] {
  return VISTAS_CONSOLIDADO.map((vista) => ({
    id: `cons-${vista.id}`,
    label: `Consolidado · ${vista.label}`,
    preguntas: vista.temas.map((t) => `Síntesis de “${t.label}”`),
    clave: (i: number) => K.cons(vista.id, vista.temas[i].id),
    angulo: ANGULO_CEO[vista.id] ?? '¿Qué evidencia sostiene esa síntesis?',
    sintetiza: true,
    // sin `fuentes`: el borrador es la síntesis del tema o no hay borrador.
    // Una frase suelta de otro tema no es una síntesis y no debe ofrecerse.
    borradorDe: (i: number) => sintesisDeVista(v, vista, i).sintesis,
    metaDe: (i: number) => sintesisDeVista(v, vista, i),
  }))
}

/** Resuelve el tema de una vista del consolidado a su síntesis local. */
function sintesisDeVista(v: Values, vista: VistaConsolidado, i: number): SintesisLocal {
  const tema = vista.temas[i]
  const f = FUENTES_TEMA[`${vista.id}.${tema.id}`]
  return f ? sintesisTema(v, tema.bloque, f) : { sintesis: '', base: '', tension: '' }
}

/** 05 · los tres campos del Excel, alimentados por consolidado y entrevistas. */
function gruposPropuesta(v: Values): Grupo[] {
  return [
    {
      id: 'pdv',
      label: 'Propuesta de Valor',
      preguntas: CAMPOS_PROPUESTA.map((c) => `${capitaliza(c.tag)}: ${c.hint}`),
      clave: (i: number) => K.pdv(CAMPOS_PROPUESTA[i].id),
      angulo: '¿Un cliente actual firmaría esa frase tal como está escrita?',
      sintetiza: true,
      // los tres campos son los mismos tres temas del consolidado: si ya se
      // sintetizaron ahí, esa es la fuente; si no, se sintetiza la evidencia cruda
      borradorDe: (i: number) => {
        const campo = CAMPOS_PROPUESTA[i]
        return g(v, K.cons('pdv', campo.id)) || sintesisDePropuesta(v, i).sintesis
      },
      metaDe: (i: number) => {
        const campo = CAMPOS_PROPUESTA[i]
        const yaConsolidado = g(v, K.cons('pdv', campo.id))
        if (yaConsolidado) return { base: 'Tomado de la síntesis aprobada en el Consolidado.', tension: '' }
        return sintesisDePropuesta(v, i)
      },
    },
  ]
}

function sintesisDePropuesta(v: Values, i: number): SintesisLocal {
  const f = FUENTES_TEMA[`pdv.${CAMPOS_PROPUESTA[i].id}`]
  return f ? sintesisTema(v, 'pdv', f) : { sintesis: '', base: '', tension: '' }
}

/** 06 · el enunciado y su nombre corto se juzgan por separado: no piden lo mismo. */
function gruposImperativos(v: Values): Grupo[] {
  const n = Math.max(imperativos(v).length, int(v, K.impCount, IMP_DEFAULT))
  const etiquetas = Array.from({ length: n }, (_, i) => `Imperativo ${i + 1}`)
  return [
    {
      id: 'imp-enunciado',
      label: 'Imperativos · enunciado',
      preguntas: etiquetas,
      clave: (i: number) => K.impNombre(i),
      angulo: `¿Esto aplica igual en las ${UNIDADES.length} unidades o solo en algunas?`,
      fuentes: [...consolidado(v, 'imp'), ...ceo(v, 'imp'), ...dgsBloque(v, 'imp')],
    },
    {
      id: 'imp-corto',
      label: 'Imperativos · nombre corto',
      preguntas: etiquetas,
      clave: (i: number) => K.impCorto(i),
      angulo: '¿Alguien lo repetiría de memoria una semana después?',
      breve: true,
      borradorDe: (i: number) => g(v, K.impNombre(i)),
    },
  ]
}

/** 07 · una columna por imperativo, cada una con sus renglones de comportamiento. */
function gruposConductas(v: Values): Grupo[] {
  const filas = int(v, K.condRows, COND_ROWS_DEFAULT)
  const evidencia = [...consolidado(v, 'cul'), ...ceo(v, 'cul'), ...dgsBloque(v, 'cul')]
  return columnas(v).map((c) => ({
    id: `cond-${c.i}`,
    label: `Conductas · ${c.label}`,
    preguntas: Array.from({ length: filas }, (_, r) => `Comportamiento ${r + 1}`),
    clave: (r: number) => K.cond(c.i, r),
    angulo: '¿Cómo se ve ese comportamiento un martes cualquiera, en una operación real?',
    fuentes: evidencia,
  }))
}

/** 08 · el mecanismo se propone desde la práctica de su misma fila. */
function gruposPracticas(v: Values): Grupo[] {
  const cols = columnas(v)
  const filas = int(v, K.condRows, COND_ROWS_DEFAULT)
  const conductas = cols
    .flatMap((c) => Array.from({ length: filas }, (_, r) => g(v, K.cond(c.i, r))))
    .filter(Boolean)
  const evidencia = [...ceo(v, 'cul'), ...dgsBloque(v, 'cul')]
  return [
    {
      id: 'prac',
      label: 'Prácticas corporativas',
      preguntas: cols.map((c) => c.label),
      clave: (i: number) => K.prac(cols[i].i),
      angulo: '¿Cada cuánto ocurre y quién la convoca?',
      fuentes: [...conductas, ...evidencia],
    },
    {
      id: 'mec',
      label: 'Mecanismos de refuerzo',
      preguntas: cols.map((c) => c.label),
      clave: (i: number) => K.mec(cols[i].i),
      angulo: '¿Qué pasa hoy cuando alguien no lo cumple?',
      borradorDe: (i: number) => g(v, K.prac(cols[i].i)),
      fuentes: evidencia,
    },
  ]
}

/** 09 · los cuatro bloques de Negocio: estándares, indicadores, procesos y políticas. */
function gruposEstandares(v: Values): Grupo[] {
  const cols = columnas(v)
  const evidencia = [...consolidado(v, 'neg'), ...ceo(v, 'neg')]

  // un tramo de indicadores por imperativo: así el asistente sabe qué está midiendo
  const porImperativo = cols.flatMap((c): Grupo[] => {
    const inds = indicadoresDe(v, c.i)
    const nombreInd = (r: number) => inds[r]?.nombre || `Indicador ${letraIndicador(r)}`
    return [
      {
        id: `ind-${c.i}`,
        label: `Indicadores · ${c.label}`,
        preguntas: inds.map((x) => `Indicador ${letraIndicador(x.r)}`),
        clave: (r: number) => K.ind(c.i, r, 'nombre'),
        angulo: '¿Ese número ya existe hoy o habría que empezar a medirlo?',
        breve: true,
        fuentes: [g(v, K.est(c.i)), ...evidencia].filter(Boolean),
      },
      {
        // meta y fuente van juntas: un número sin origen no sirve para decidir
        id: `ind-meta-${c.i}`,
        label: `Indicadores · ${c.label} · meta 2027 y fuente`,
        preguntas: inds.flatMap((x) => [`${nombreInd(x.r)} · meta 2027`, `${nombreInd(x.r)} · fuente del dato`]),
        clave: (i: number) => (i % 2 === 0 ? K.ind(c.i, i / 2, 'meta') : K.ind(c.i, (i - 1) / 2, 'fuente')),
        angulo: '¿Quién reporta ese dato y cada cuánto?',
        breve: true,
      },
      {
        id: `proc-${c.i}`,
        label: `Procesos críticos · ${c.label}`,
        preguntas: listaDe(v, 'proc', c.i).map((x) => `Proceso ${x.r + 1}`),
        clave: (r: number) => K.proc(c.i, r),
        angulo: '¿Quién es el dueño del proceso y cada cuánto se revisa?',
        fuentes: [g(v, K.est(c.i)), ...evidencia].filter(Boolean),
      },
      {
        id: `pol-${c.i}`,
        label: `Políticas · ${c.label}`,
        preguntas: listaDe(v, 'pol', c.i).map((x) => `Política ${x.r + 1}`),
        clave: (r: number) => K.pol(c.i, r),
        angulo: '¿Quién puede autorizar una excepción a esa regla?',
        fuentes: [listaTexto(v, 'proc', c.i), ...evidencia].filter(Boolean),
      },
    ]
  })

  return [
    {
      id: 'est',
      label: 'Estándares',
      preguntas: cols.map((c) => c.label),
      clave: (i: number) => K.est(cols[i].i),
      angulo: '¿Cómo se verifica que ese estándar se cumple?',
      fuentes: [...porColumna(v, K.prac), ...evidencia],
    },
    ...porImperativo,
  ]
}

/* ------------------------------------------------------------------ *
 * Despachador
 * ------------------------------------------------------------------ */

/**
 * Los dos oficios del asistente, que no son intercambiables:
 * `sintesis` lee la evidencia cruda y propone qué debe decir el documento;
 * `redaccion` ya no discute el contenido, solo deja bien escrito lo decidido.
 */
export type ModoAsistente = 'sintesis' | 'redaccion'

export interface AsistenteDePantalla {
  grupos: Grupo[]
  /** cómo se nombra, en el panel, aquello que el asistente está leyendo */
  fuente: string
  modo: ModoAsistente
}

export function asistenteDePantalla(id: string, v: Values): AsistenteDePantalla {
  switch (id) {
    case 's02':
      return { grupos: gruposCeo(), fuente: 'la entrevista con el CEO', modo: 'sintesis' }
    case 's03':
      return { grupos: gruposDgs(), fuente: 'las entrevistas con los DGs', modo: 'sintesis' }
    case 's04':
      return { grupos: gruposConsolidado(v), fuente: 'el consolidado de evidencia', modo: 'sintesis' }
    case 's05':
      return { grupos: gruposPropuesta(v), fuente: 'la Propuesta de Valor', modo: 'sintesis' }
    case 's06':
      return { grupos: gruposImperativos(v), fuente: 'los imperativos estratégicos', modo: 'sintesis' }
    case 's07':
      return { grupos: gruposConductas(v), fuente: 'la cuadrícula de comportamientos', modo: 'sintesis' }
    case 's08':
      return { grupos: gruposPracticas(v), fuente: 'prácticas y mecanismos', modo: 'sintesis' }
    case 's09':
      return { grupos: gruposEstandares(v), fuente: 'los cuatro bloques de Negocio', modo: 'sintesis' }
    case 's12':
      // la pantalla de cierre no vuelve a decidir nada: recorre los nueve bloques
      // del Excel ya resueltos y solo revisa cómo están escritos
      return {
        grupos: [
          ...gruposPropuesta(v),
          ...gruposImperativos(v),
          ...gruposConductas(v),
          ...gruposPracticas(v),
          ...gruposEstandares(v),
        ],
        fuente: 'toda la arquitectura',
        modo: 'redaccion',
      }
    default:
      return { grupos: [], fuente: 'esta pantalla', modo: 'sintesis' }
  }
}
