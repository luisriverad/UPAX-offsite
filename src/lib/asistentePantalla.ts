import {
  BLOQUES_CEO,
  BLOQUES_OFFSITE,
  CAMPOS_PROPUESTA,
  DGS,
  UNIDADES,
  VISTAS_CONSOLIDADO,
} from '../data/content'
import { ANGULO_CEO, gruposCeo, gruposDgs } from './asistenteEntrevista'
import type { Grupo } from './asistenteEntrevista'
import { COND_ROWS_DEFAULT, IND_DEFAULT, IMP_DEFAULT, K, columnas, imperativos, unidadDe } from './model'
import type { Values } from '../types'

/**
 * Traduce cada pantalla a los tramos que el asistente sabe leer. Así las doce
 * pantallas usan el mismo motor que la entrevista con el CEO: cuestionar lo que
 * quedó flojo y proponer borradores con frases que ya se dijeron en el proceso.
 */

const g = (v: Values, k: string) => (v[k] ?? '').trim()

const int = (v: Values, k: string, def: number) => {
  const n = parseInt(v[k] ?? '', 10)
  return Number.isFinite(n) ? n : def
}

/* ------------------------------------------------------------------ *
 * Evidencia: de dónde saca cada pantalla su respaldo
 * ------------------------------------------------------------------ */

/** Índices del guion de los DGs, para no repartir números sueltos por el archivo. */
const DG_PROPOSITO = 0
const DG_RESULTADO = 1
const DG_PROMESA = 2
const DG_IMPERATIVOS = 3
const DG_CULTURA = 4

/** Lo que dijo el CEO en un bloque de su entrevista. */
function ceo(v: Values, bloque: string): string[] {
  const b = BLOQUES_CEO.find((x) => x.id === bloque)
  return b ? b.preguntas.map((_, q) => g(v, K.ceo(bloque, q))).filter(Boolean) : []
}

/** Lo que contestaron los DGs a una pregunta del guion. */
function dgs(v: Values, pregunta: number): string[] {
  return DGS.map((d) => g(v, K.dg(d, pregunta))).filter(Boolean)
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
 * A qué preguntas concretas corresponde cada tema del consolidado. Sin este
 * mapa, el asistente solo podría ofrecer una frase suelta del bloque entero;
 * con él, cada síntesis cruza lo que dijo el CEO sobre ese tema con lo que
 * dijeron los DGs de cada unidad sobre lo mismo.
 */
const FUENTES_TEMA: Record<string, { ceo: number[]; dg: number[] }> = {
  'pdv.existimos': { ceo: [0, 3], dg: [DG_PROPOSITO, DG_RESULTADO] },
  'pdv.promesa': { ceo: [1, 2], dg: [DG_PROMESA] },
  'pdv.puente': { ceo: [4], dg: [DG_PROMESA] },
  'imp.candidatos': { ceo: [0, 3], dg: [DG_IMPERATIVOS] },
  'imp.prioridades': { ceo: [1], dg: [DG_IMPERATIVOS] },
  'imp.dejar': { ceo: [2], dg: [DG_CULTURA] },
  'cul.conductas': { ceo: [0, 1], dg: [DG_CULTURA] },
  'cul.practicas': { ceo: [3], dg: [DG_CULTURA] },
  'cul.mecanismos': { ceo: [2, 3], dg: [DG_CULTURA] },
  'neg.estandares': { ceo: [0], dg: [] },
  'neg.indicadores': { ceo: [1], dg: [] },
  'neg.procesos': { ceo: [0], dg: [DG_CULTURA] },
  'neg.politicas': { ceo: [0], dg: [DG_CULTURA] },
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

/**
 * Redacta la síntesis de un tema cruzando las dos fuentes: qué dijo el CEO y
 * qué dijeron las unidades. Marca dónde coinciden y dónde no, y cierra
 * declarando sobre cuánta evidencia está construida.
 */
function sintesisTema(v: Values, bloque: string, ceoIdx: number[], dgIdx: number[]): string {
  const delCeo = ceoIdx.map((q) => g(v, K.ceo(bloque, q))).filter(Boolean)
  const voces: Voz[] = UNIDADES.flatMap((u) =>
    dgIdx.map((q) => ({ unidad: unidadDe(v, u.id), texto: g(v, K.dg(u.id, q)) })),
  ).filter((x) => x.texto)

  if (!delCeo.length && !voces.length) return ''

  const partes: string[] = []

  // el CEO manda como referencia; si no contestó ese tema, la marca la primera unidad
  const conCeo = delCeo.length > 0
  const referencia = conCeo ? principal(delCeo[0]) : principal(voces[0].texto)
  const resto = conCeo ? voces : voces.slice(1)

  if (conCeo) {
    partes.push(`El CEO lo plantea así: “${referencia}”.`)
  } else {
    partes.push(`Sin respuesta del CEO en este tema. ${voces[0].unidad} lo describe así: “${referencia}”.`)
  }

  const clave = terminos(referencia)
  const coinciden = resto.filter((x) => comparten(clave, terminos(x.texto)) >= 2)
  const aparte = resto.filter((x) => !coinciden.includes(x))

  if (coinciden.length) {
    const verbo = coinciden.length === 1 ? 'Coincide' : 'Coinciden'
    partes.push(
      `${verbo} ${coinciden.length} de ${UNIDADES.length} unidades: ${coinciden.map((x) => x.unidad).join(', ')}.`,
    )
  }
  if (aparte.length) {
    partes.push(`${aparte[0].unidad} lo plantea distinto: “${principal(aparte[0].texto)}”.`)
    if (aparte.length > 1) {
      partes.push(`También se apartan: ${aparte.slice(1).map((x) => x.unidad).join(', ')}.`)
    }
  }

  // decir sobre qué está construida la síntesis importa tanto como la síntesis
  if (!voces.length && dgIdx.length) {
    partes.push(`Ninguna unidad ha respondido sobre este tema todavía: esto se apoya solo en el CEO.`)
  }
  partes.push(
    `Base: ${delCeo.length} ${delCeo.length === 1 ? 'respuesta' : 'respuestas'} del CEO y ${voces.length} de ${UNIDADES.length} unidades.`,
  )
  return partes.join(' ')
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
    borradorDe: (i: number) => {
      const tema = vista.temas[i]
      const f = FUENTES_TEMA[`${vista.id}.${tema.id}`]
      return f ? sintesisTema(v, tema.bloque, f.ceo, f.dg) : ''
    },
  }))
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
        const yaConsolidado = g(v, K.cons('pdv', campo.id))
        if (yaConsolidado) return yaConsolidado
        const f = FUENTES_TEMA[`pdv.${campo.id}`]
        return f ? sintesisTema(v, 'pdv', f.ceo, f.dg) : ''
      },
    },
  ]
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
      fuentes: [...consolidado(v, 'imp'), ...ceo(v, 'imp'), ...dgs(v, DG_IMPERATIVOS)],
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
  const evidencia = [...consolidado(v, 'cul'), ...ceo(v, 'cul'), ...dgs(v, DG_CULTURA)]
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
  const evidencia = [...ceo(v, 'cul'), ...dgs(v, DG_CULTURA)]
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

/** 09 · estándares por imperativo, más la tabla de indicadores en campos breves. */
function gruposEstandares(v: Values): Grupo[] {
  const cols = columnas(v)
  const n = int(v, K.indCount, IND_DEFAULT)
  const evidencia = [...consolidado(v, 'neg'), ...ceo(v, 'neg')]
  const nombreInd = (r: number) => g(v, K.ind(r, 'nombre')) || `Indicador ${String.fromCharCode(65 + r)}`
  return [
    {
      id: 'est',
      label: 'Estándares',
      preguntas: cols.map((c) => c.label),
      clave: (i: number) => K.est(cols[i].i),
      angulo: '¿Cómo se verifica que ese estándar se cumple?',
      fuentes: [...porColumna(v, K.prac), ...evidencia],
    },
    {
      id: 'ind',
      label: 'Indicadores críticos',
      preguntas: Array.from({ length: n }, (_, r) => `Indicador ${String.fromCharCode(65 + r)}`),
      clave: (r: number) => K.ind(r, 'nombre'),
      angulo: '¿Ese número ya existe hoy o habría que empezar a medirlo?',
      breve: true,
      fuentes: evidencia,
    },
    {
      // meta y fuente van juntas: un número sin origen no sirve para decidir
      id: 'ind-meta',
      label: 'Indicadores · meta 2027 y fuente',
      preguntas: Array.from({ length: n * 2 }, (_, i) =>
        i % 2 === 0 ? `${nombreInd(i / 2)} · meta 2027` : `${nombreInd((i - 1) / 2)} · fuente del dato`,
      ),
      clave: (i: number) =>
        i % 2 === 0 ? K.ind(i / 2, 'meta') : K.ind((i - 1) / 2, 'fuente'),
      angulo: '¿Quién reporta ese dato y cada cuánto?',
      breve: true,
    },
  ]
}

/** 10 · el proceso nace del estándar y la política del proceso que la sostiene. */
function gruposProcesos(v: Values): Grupo[] {
  const cols = columnas(v)
  const evidencia = [...consolidado(v, 'neg'), ...ceo(v, 'neg'), ...ceo(v, 'imp')]
  return [
    {
      id: 'proc',
      label: 'Procesos críticos',
      preguntas: cols.map((c) => c.label),
      clave: (i: number) => K.proc(cols[i].i),
      angulo: '¿Quién es el dueño del proceso y cada cuánto se revisa?',
      fuentes: [...porColumna(v, K.est), ...evidencia],
    },
    {
      id: 'pol',
      label: 'Políticas',
      preguntas: cols.map((c) => c.label),
      clave: (i: number) => K.pol(cols[i].i),
      angulo: '¿Quién puede autorizar una excepción a esa regla?',
      fuentes: [...porColumna(v, K.proc), ...evidencia],
    },
  ]
}

/** 11 · lo que se decide en vivo: versión preliminar y su alternativa. */
function gruposOffsite(v: Values): Grupo[] {
  const etiquetas = BLOQUES_OFFSITE.map((b) => capitaliza(b.label))
  const evidencia = [...consolidado(v, 'pdv'), ...ceo(v, 'pdv'), ...dgs(v, DG_PROMESA)]
  return [
    {
      id: 'off',
      label: 'Versiones preliminares',
      preguntas: etiquetas,
      clave: (i: number) => BLOQUES_OFFSITE[i].src,
      angulo: '¿El grupo la aprobaría hoy tal como está escrita?',
      fuentes: evidencia,
    },
    {
      id: 'off-alt',
      label: 'Alternativas · Opción B',
      preguntas: etiquetas,
      clave: (i: number) => K.pdvAlt(BLOQUES_OFFSITE[i].id),
      angulo: '¿En qué se diferencia realmente de la versión preliminar?',
      fuentes: evidencia,
    },
  ]
}

/* ------------------------------------------------------------------ *
 * Despachador
 * ------------------------------------------------------------------ */

export interface AsistenteDePantalla {
  grupos: Grupo[]
  /** cómo se nombra, en el panel, aquello que el asistente está leyendo */
  fuente: string
}

export function asistenteDePantalla(id: string, v: Values): AsistenteDePantalla {
  switch (id) {
    case 's02':
      return { grupos: gruposCeo(), fuente: 'la entrevista con el CEO' }
    case 's03':
      return { grupos: gruposDgs(), fuente: 'las entrevistas con los DGs' }
    case 's04':
      return { grupos: gruposConsolidado(v), fuente: 'el consolidado de evidencia' }
    case 's05':
      return { grupos: gruposPropuesta(v), fuente: 'la Propuesta de Valor' }
    case 's06':
      return { grupos: gruposImperativos(v), fuente: 'los imperativos estratégicos' }
    case 's07':
      return { grupos: gruposConductas(v), fuente: 'la cuadrícula de comportamientos' }
    case 's08':
      return { grupos: gruposPracticas(v), fuente: 'prácticas y mecanismos' }
    case 's09':
      return { grupos: gruposEstandares(v), fuente: 'estándares e indicadores' }
    case 's10':
      return { grupos: gruposProcesos(v), fuente: 'procesos y políticas' }
    case 's11':
      return { grupos: gruposOffsite(v), fuente: 'las definiciones del Off-Site' }
    case 's12':
      // la pantalla de cierre revisa los nueve bloques del Excel de corrido
      return {
        grupos: [
          ...gruposPropuesta(v),
          ...gruposImperativos(v),
          ...gruposConductas(v),
          ...gruposPracticas(v),
          ...gruposEstandares(v),
          ...gruposProcesos(v),
        ],
        fuente: 'toda la arquitectura',
      }
    default:
      return { grupos: [], fuente: 'esta pantalla' }
  }
}
