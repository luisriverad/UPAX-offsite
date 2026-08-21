import {
  ARCHIVOS_DG,
  BLOQUES_CEO,
  CAMPOS_PROPUESTA,
  DGS,
  GUION_DG,
  MATRIZ_BLOQUES,
  UNIDADES,
  VISTAS_CONSOLIDADO,
} from '../data/content'
import type { BlockKey, Conteo, Estado, TabId, Values } from '../types'

/* ------------------------------------------------------------------ *
 * Claves del store
 * ------------------------------------------------------------------ */

export const K = {
  impCount: 'imp.count',
  impNombre: (i: number) => `imp.${i}.nombre`,
  impCorto: (i: number) => `imp.${i}.corto`,
  /** marcado = este imperativo es de los que se quedan */
  impSel: (i: number) => `imp.${i}.sel`,

  condRows: 'cul.cond.rows',
  cond: (col: number, row: number) => `cul.cond.${col}.${row}`,
  prac: (col: number) => `cul.prac.${col}`,
  mec: (col: number) => `cul.mec.${col}`,

  est: (col: number) => `neg.est.${col}`,
  // procesos y políticas se capturan renglón por renglón, como los indicadores
  proc: (col: number, r: number) => `neg.proc.${col}.${r}`,
  procCount: (col: number) => `neg.proc.${col}.count`,
  pol: (col: number, r: number) => `neg.pol.${col}.${r}`,
  polCount: (col: number) => `neg.pol.${col}.count`,
  // los indicadores cuelgan de su imperativo: cada uno tiene los suyos
  indCount: (col: number) => `neg.ind.${col}.count`,
  ind: (col: number, r: number, campo: 'nombre' | 'actual' | 'meta' | 'fuente') => `neg.ind.${col}.${r}.${campo}`,

  // el prefijo `cec.` se conserva para no perder lo ya capturado
  ceo: (bloque: string, q: number) => `cec.${bloque}.${q}`,
  // los DGs siguen el mismo guion que el CEO, así que su clave lleva bloque igual
  dg: (n: number, bloque: string, q: number) => `dg.${n}.${bloque}.${q}`,
  dgArch: (n: number, a: number) => `dg.${n}.arch.${a}`,
  dgUnidad: (n: number) => `dg.${n}.unidad`,
  dgPersona: (n: number) => `dg.${n}.persona`,
  /** ficha del PDF de entrevista contestado que se subió, con su ruta en Supabase */
  dgPdf: (n: number) => `dg.${n}.pdf`,
  ceoPdf: 'cec.pdf',

  cons: (vista: string, tema: string) => `cons.${vista}.${tema}`,

  pdv: (campo: string) => `pdv.${campo}`,
  pdvEstado: (campo: string) => `pdv.${campo}.estado`,
  pdvAlt: (campo: string) => `pdv.${campo}.alt`,
} as const

/** La mesa de imperativos es siempre de diez: es lo que el modelo propone. */
export const IMP_DEFAULT = 10
export const COND_ROWS_DEFAULT = 3
export const IND_DEFAULT = 3
/** renglones que arrancan visibles en procesos críticos y políticas */
export const LISTA_DEFAULT = 3

const g = (v: Values, k: string) => (v[k] ?? '').trim()
const int = (v: Values, k: string, def: number) => {
  const n = parseInt(v[k] ?? '', 10)
  return Number.isFinite(n) ? n : def
}

/* ------------------------------------------------------------------ *
 * Imperativos: definidos en la 06, usados como columnas en 07-10
 * ------------------------------------------------------------------ */

export interface Imperativo {
  i: number
  nombre: string
  corto: string
  /** marcado en la 06 como uno de los que se quedan */
  elegido: boolean
}

/** Todos los candidatos de la mesa de trabajo, elegidos o no. */
export function imperativos(v: Values): Imperativo[] {
  const n = int(v, K.impCount, IMP_DEFAULT)
  return Array.from({ length: n }, (_, i) => ({
    i,
    nombre: g(v, K.impNombre(i)),
    corto: g(v, K.impCorto(i)),
    elegido: g(v, K.impSel(i)) === '1',
  }))
}

/**
 * Los que se quedan: solo los marcados en la 06. Sin marcar nada no hay columnas
 * que construir, y eso es correcto — Cultura y Negocio cuelgan de la decisión,
 * no de la mesa de trabajo.
 *
 * El índice es el original, así que lo capturado en Cultura y Negocio sigue
 * colgando del mismo imperativo aunque se deseleccionen otros y vuelva a
 * aparecer intacto si se remarca.
 */
export function seleccionados(v: Values): Imperativo[] {
  return imperativos(v).filter((im) => im.elegido)
}

export interface Columna {
  i: number
  /** el ordinal, que se queda aunque el imperativo no tenga nombre */
  ordinal: string
  /** lo que se capturó en la 06, para colgarlo del ordinal */
  texto: string
  /** una sola cadena que identifica la columna: para exportar y para el asistente */
  label: string
  nombrado: boolean
}

/**
 * Columnas de Cultura y Negocio: una por imperativo ELEGIDO en la 06, con lo
 * que se haya escrito allá. Sin nombres todavía se muestran igual, numeradas.
 */
export function columnas(v: Values): Columna[] {
  return seleccionados(v).map((im) => {
    const ordinal = `IMPERATIVO ${im.i + 1}`
    // el corto es el que cabe en un encabezado; el nombre completo manda al exportar
    const texto = im.corto || im.nombre
    return { i: im.i, ordinal, texto, label: im.nombre || im.corto || ordinal, nombrado: Boolean(texto) }
  })
}

export interface Indicador {
  r: number
  nombre: string
  actual: string
  meta: string
  fuente: string
}

/** Los indicadores de un imperativo, en orden. `soloConNombre` deja fuera los renglones vacíos. */
export function indicadoresDe(v: Values, col: number, soloConNombre = false): Indicador[] {
  const n = int(v, K.indCount(col), IND_DEFAULT)
  const filas = Array.from({ length: n }, (_, r) => ({
    r,
    nombre: g(v, K.ind(col, r, 'nombre')),
    actual: g(v, K.ind(col, r, 'actual')),
    meta: g(v, K.ind(col, r, 'meta')),
    fuente: g(v, K.ind(col, r, 'fuente')),
  }))
  return soloConNombre ? filas.filter((x) => x.nombre) : filas
}

/** Etiqueta por defecto de un indicador: A, B, C… dentro de su imperativo. */
export const letraIndicador = (r: number) => String.fromCharCode(65 + (r % 26))

export interface Renglon {
  r: number
  texto: string
}

/** Procesos críticos o políticas de un imperativo, como lista de renglones. */
export function listaDe(v: Values, cual: 'proc' | 'pol', col: number, soloConTexto = false): Renglon[] {
  const n = int(v, cual === 'proc' ? K.procCount(col) : K.polCount(col), LISTA_DEFAULT)
  const clave = cual === 'proc' ? K.proc : K.pol
  const filas = Array.from({ length: n }, (_, r) => ({ r, texto: g(v, clave(col, r)) }))
  return soloConTexto ? filas.filter((x) => x.texto) : filas
}

/** Lo capturado en una lista, de corrido: para el documento y el CSV. */
export const listaTexto = (v: Values, cual: 'proc' | 'pol', col: number) =>
  listaDe(v, cual, col, true)
    .map((x) => x.texto)
    .join(' · ')

/* ------------------------------------------------------------------ *
 * Avance por bloque del Excel
 * ------------------------------------------------------------------ */

function contarCols(v: Values, key: (col: number) => string): Conteo {
  const cols = columnas(v)
  return { filled: cols.filter((c) => g(v, key(c.i))).length, total: cols.length }
}

function contarLista(v: Values, cual: 'proc' | 'pol'): Conteo {
  const cols = columnas(v)
  return { filled: cols.filter((c) => listaDe(v, cual, c.i, true).length > 0).length, total: cols.length }
}

export function conteo(v: Values, key: BlockKey): Conteo {
  switch (key) {
    case 'pdv':
      return {
        filled: CAMPOS_PROPUESTA.filter((c) => g(v, K.pdv(c.id))).length,
        total: CAMPOS_PROPUESTA.length,
      }
    case 'imp': {
      const imps = imperativos(v)
      return { filled: imps.filter((i) => i.nombre).length, total: imps.length }
    }
    case 'cul.cond': {
      const cols = columnas(v)
      const rows = int(v, K.condRows, COND_ROWS_DEFAULT)
      const filled = cols.filter((c) =>
        Array.from({ length: rows }, (_, r) => g(v, K.cond(c.i, r))).some(Boolean),
      ).length
      return { filled, total: cols.length }
    }
    case 'cul.prac':
      return contarCols(v, K.prac)
    case 'cul.mec':
      return contarCols(v, K.mec)
    case 'neg.est':
      return contarCols(v, K.est)
    // un imperativo cuenta como cubierto en cuanto tiene un renglón escrito
    case 'neg.proc':
      return contarLista(v, 'proc')
    case 'neg.pol':
      return contarLista(v, 'pol')
    case 'neg.ind': {
      let filled = 0
      let total = 0
      columnas(v).forEach((c) => {
        const n = int(v, K.indCount(c.i), IND_DEFAULT)
        total += n
        for (let r = 0; r < n; r++) {
          if (g(v, K.ind(c.i, r, 'nombre')) && g(v, K.ind(c.i, r, 'meta'))) filled++
        }
      })
      return { filled, total }
    }
  }
}

/**
 * La Propuesta de Valor solo llega a APROBADO cuando los tres campos se
 * aprobaron en el Off-Site; el resto se aprueba al quedar completo.
 */
export function estadoBloque(v: Values, key: BlockKey): Estado {
  const { filled, total } = conteo(v, key)
  if (filled === 0) return 'vacio'
  if (key === 'pdv') {
    const aprobados = CAMPOS_PROPUESTA.filter((c) => g(v, K.pdvEstado(c.id)) === 'aprobado').length
    if (aprobados === total) return 'aprobado'
    return filled === total ? 'revisar' : 'borrador'
  }
  return filled === total ? 'aprobado' : 'borrador'
}

/** Todos los bloques del Excel, en el orden de la matriz maestra. */
export const BLOQUES: BlockKey[] = ['pdv', 'imp', ...MATRIZ_BLOQUES.map((r) => r.key)]

export function avanceTotal(v: Values): number {
  let filled = 0
  let total = 0
  BLOQUES.forEach((key) => {
    const c = conteo(v, key)
    filled += c.filled
    total += c.total
  })
  return total === 0 ? 0 : Math.round((filled / total) * 100)
}

/* ------------------------------------------------------------------ *
 * Filas de la matriz maestra (pantallas 01 y 12)
 * ------------------------------------------------------------------ */

export interface FilaMatriz {
  id: string
  /** encabezado de sección; vacío cuando la fila cuelga de la anterior */
  sec: string
  label: string
  /** bloque al que pertenece, para saber a qué pantalla saltar */
  key: BlockKey
  estado: Estado
  vacio: string
  /** solo en bloques que agrupan una celda por imperativo */
  conteo?: Conteo
}

/** Un campo de la propuesta se aprueba uno por uno en el Off-Site. */
function estadoCampoPdv(v: Values, id: string): Estado {
  if (!g(v, K.pdv(id))) return 'vacio'
  return g(v, K.pdvEstado(id)) === 'aprobado' ? 'aprobado' : 'borrador'
}

/** Un imperativo queda listo cuando tiene enunciado y nombre corto. */
function estadoImperativo(im: Imperativo): Estado {
  if (!im.nombre) return 'vacio'
  return im.corto ? 'aprobado' : 'revisar'
}

/**
 * La matriz abre Propuesta de Valor e Imperativos en un renglón por tema:
 * cada uno se define y se aprueba por separado, así que lleva su propio estado.
 */
export function filasMatriz(v: Values): FilaMatriz[] {
  const filas: FilaMatriz[] = []

  CAMPOS_PROPUESTA.forEach((c, i) => {
    filas.push({
      id: `pdv-${c.id}`,
      sec: i === 0 ? 'PROPUESTA DE VALOR' : '',
      label: c.tag.charAt(0) + c.tag.slice(1).toLowerCase(),
      key: 'pdv',
      estado: estadoCampoPdv(v, c.id),
      vacio: 'SIN DEFINIR',
    })
  })

  imperativos(v).forEach((im, i) => {
    filas.push({
      id: `imp-${im.i}`,
      sec: i === 0 ? 'IMPERATIVOS ESTRATÉGICOS' : '',
      label: im.nombre || `Imperativo ${im.i + 1}`,
      key: 'imp',
      estado: estadoImperativo(im),
      vacio: 'SIN DEFINIR',
    })
  })

  MATRIZ_BLOQUES.forEach((row) => {
    filas.push({
      id: row.key,
      sec: row.sec,
      label: row.label,
      key: row.key,
      estado: estadoBloque(v, row.key),
      vacio: row.empty,
      conteo: conteo(v, row.key),
    })
  })

  return filas
}

/** Contadores del pie de la pantalla 11. */
export function avancePorFamilia(v: Values): { label: string; c: Conteo }[] {
  const suma = (keys: BlockKey[]): Conteo =>
    keys.reduce(
      (acc, k) => {
        const c = conteo(v, k)
        return { filled: acc.filled + c.filled, total: acc.total + c.total }
      },
      { filled: 0, total: 0 },
    )
  return [
    { label: 'Propuesta de Valor', c: conteo(v, 'pdv') },
    { label: 'Imperativos', c: conteo(v, 'imp') },
    { label: 'Cultura', c: suma(['cul.cond', 'cul.prac', 'cul.mec']) },
    { label: 'Negocio', c: suma(['neg.est', 'neg.ind', 'neg.proc', 'neg.pol']) },
  ]
}

/* ------------------------------------------------------------------ *
 * Documento vivo: cómo va quedando redactado
 * ------------------------------------------------------------------ */

export interface ItemDoc {
  id: string
  label: string
  texto: string
}

export interface SeccionDoc {
  id: string
  titulo: string
  key: BlockKey
  items: ItemDoc[]
}

/**
 * Junta el texto capturado en todas las pantallas y lo devuelve como
 * documento, para leer de corrido cómo va quedando la arquitectura.
 */
export function documento(v: Values): SeccionDoc[] {
  const cols = columnas(v)
  const porColumna = (key: (col: number) => string): ItemDoc[] =>
    cols.map((c) => ({ id: `c${c.i}`, label: c.label, texto: g(v, key(c.i)) }))

  const rowsCond = int(v, K.condRows, COND_ROWS_DEFAULT)

  return [
    {
      id: 'pdv',
      titulo: 'PROPUESTA DE VALOR',
      key: 'pdv',
      items: CAMPOS_PROPUESTA.map((c) => ({
        id: c.id,
        label: c.tag.charAt(0) + c.tag.slice(1).toLowerCase(),
        texto: g(v, K.pdv(c.id)),
      })),
    },
    {
      id: 'imp',
      titulo: 'IMPERATIVOS ESTRATÉGICOS',
      key: 'imp',
      items: imperativos(v).map((im) => ({
        id: `i${im.i}`,
        label: `Imperativo ${im.i + 1}`,
        texto: im.nombre && im.corto ? `${im.nombre} · ${im.corto}` : im.nombre,
      })),
    },
    {
      id: 'cond',
      titulo: 'CULTURA · Cómo pensamos, decidimos y actuamos',
      key: 'cul.cond',
      items: cols.map((c) => ({
        id: `c${c.i}`,
        label: c.label,
        texto: Array.from({ length: rowsCond }, (_, r) => g(v, K.cond(c.i, r)))
          .filter(Boolean)
          .join(' · '),
      })),
    },
    { id: 'prac', titulo: 'CULTURA · Prácticas corporativas', key: 'cul.prac', items: porColumna(K.prac) },
    { id: 'mec', titulo: 'CULTURA · Mecanismos de refuerzo', key: 'cul.mec', items: porColumna(K.mec) },
    { id: 'est', titulo: 'NEGOCIO · Estándares', key: 'neg.est', items: porColumna(K.est) },
    {
      id: 'ind',
      titulo: 'NEGOCIO · Indicadores críticos',
      key: 'neg.ind',
      // cada indicador se lee bajo su imperativo: sin eso no se sabe qué mide
      items: cols.flatMap((c) =>
        indicadoresDe(v, c.i).map((x) => {
          const partes = [
            x.actual || x.meta ? `actual ${x.actual || '—'} → 2027 ${x.meta || '—'}` : '',
            x.fuente ? `fuente: ${x.fuente}` : '',
          ].filter(Boolean)
          return {
            id: `c${c.i}r${x.r}`,
            label: `${c.label} · ${x.nombre || `Indicador ${letraIndicador(x.r)}`}`,
            texto: x.nombre ? partes.join(' · ') : '',
          }
        }),
      ),
    },
    {
      id: 'proc',
      titulo: 'NEGOCIO · Procesos críticos',
      key: 'neg.proc',
      items: cols.map((c) => ({ id: `c${c.i}`, label: c.label, texto: listaTexto(v, 'proc', c.i) })),
    },
    {
      id: 'pol',
      titulo: 'NEGOCIO · Políticas',
      key: 'neg.pol',
      items: cols.map((c) => ({ id: `c${c.i}`, label: c.label, texto: listaTexto(v, 'pol', c.i) })),
    },
  ]
}

/* ------------------------------------------------------------------ *
 * Evidencia acumulada
 * ------------------------------------------------------------------ */

export function respuestasCeo(v: Values, bloque?: string): number {
  return BLOQUES_CEO.filter((b) => !bloque || b.id === bloque).reduce(
    (n, b) => n + b.preguntas.filter((_, q) => g(v, K.ceo(b.id, q))).length,
    0,
  )
}

export function respuestasDG(v: Values): number {
  return DGS.reduce((n, d) => n + GUION_DG.filter((p) => g(v, K.dg(d, p.bloque, p.q))).length, 0)
}

export function dgsQueRespondieron(v: Values): number {
  return DGS.filter((d) => GUION_DG.some((p) => g(v, K.dg(d, p.bloque, p.q)))).length
}

/** Respuestas de un DG, opcionalmente acotadas a un bloque. */
export function respuestasDeDG(v: Values, d: number, bloque?: string): number {
  return GUION_DG.filter((p) => (!bloque || p.bloque === bloque) && g(v, K.dg(d, p.bloque, p.q))).length
}

export function archivosCargados(v: Values): number {
  return DGS.reduce((n, d) => n + ARCHIVOS_DG.filter((_, a) => g(v, K.dgArch(d, a))).length, 0)
}

/** Nombre de la unidad: lo capturado manda sobre el catálogo. */
export function unidadDe(v: Values, id: number): string {
  return g(v, K.dgUnidad(id)) || UNIDADES.find((u) => u.id === id)?.nombre || `DG ${id}`
}

export function archivosDeDG(v: Values, d: number): number {
  return ARCHIVOS_DG.filter((_, a) => g(v, K.dgArch(d, a))).length
}

/** Primer fragmento de lo que dijo el CEO sobre un bloque. */
export function fraseCeo(v: Values, bloque: string): string {
  const b = BLOQUES_CEO.find((x) => x.id === bloque)
  if (!b) return ''
  for (let q = 0; q < b.preguntas.length; q++) {
    const t = g(v, K.ceo(b.id, q))
    if (t) return t
  }
  return ''
}

export function recorta(t: string, n = 64): string {
  if (!t) return ''
  return t.length <= n ? t : `${t.slice(0, n - 1).trimEnd()}…`
}

/* ------------------------------------------------------------------ *
 * Traspaso: lo que el Pre-evento le entrega al Off-Site
 * ------------------------------------------------------------------ */

/** Un insumo que se levanta antes del off-site y se consume durante. */
export interface ItemEntrega {
  id: string
  label: string
  hecho: number
  total: number
  /** pestaña donde se captura, para poder saltar a completarlo */
  tab: TabId
}

const TOTAL_PREGUNTAS_CEO = BLOQUES_CEO.reduce((n, b) => n + b.preguntas.length, 0)

/** Claves de todas las síntesis del consolidado. */
const CLAVES_CONSOLIDADO = VISTAS_CONSOLIDADO.flatMap((v) => v.temas.map((t) => K.cons(v.id, t.id)))

/**
 * Los cuatro insumos del traspaso. Se muestran en los dos módulos —del lado del
 * Pre-evento como lo que falta entregar, del lado del Off-Site como el material
 * con el que se está trabajando— para que el corte entre ambos no sea un muro.
 */
export function entregaPreEvento(v: Values): ItemEntrega[] {
  return [
    {
      id: 'ceo',
      label: 'Respuestas del CEO',
      hecho: respuestasCeo(v),
      total: TOTAL_PREGUNTAS_CEO,
      tab: 'ceo',
    },
    {
      id: 'dgs',
      label: 'DGs entrevistados',
      hecho: dgsQueRespondieron(v),
      total: DGS.length,
      tab: 'dgs',
    },
    {
      // por DG con al menos un archivo, no por archivo suelto: así el número es comparable
      id: 'arch',
      label: 'DGs con archivos',
      hecho: DGS.filter((d) => archivosDeDG(v, d) > 0).length,
      total: DGS.length,
      tab: 'dgs',
    },
    {
      id: 'cons',
      label: 'Síntesis consolidadas',
      hecho: CLAVES_CONSOLIDADO.filter((k) => g(v, k)).length,
      total: CLAVES_CONSOLIDADO.length,
      tab: 'consolidado',
    },
  ]
}

/** Avance del Pre-evento: qué tanto de la evidencia ya está levantada. */
export function avancePreEvento(v: Values): number {
  const items = entregaPreEvento(v)
  const total = items.reduce((n, i) => n + i.total, 0)
  return total === 0 ? 0 : Math.round((items.reduce((n, i) => n + i.hecho, 0) / total) * 100)
}

/* ------------------------------------------------------------------ *
 * Herencia Pre-evento → Off-Site
 * ------------------------------------------------------------------ */

/** Una síntesis escrita como lista, un renglón por punto. */
function comoLista(texto: string): string[] {
  return texto
    .split(/\r?\n|;/)
    .map((l) => l.replace(/^\s*(?:\d+[.)]|[•·\-–])\s*/, '').trim())
    .filter(Boolean)
}

/**
 * El Off-Site no arranca en blanco: hereda lo que quedó escrito en el
 * Consolidado. Devuelve solo las claves que hay que sembrar, así nunca pisa
 * algo ya capturado ni una definición aprobada en la sesión.
 */
export function herenciaOffsite(v: Values): Values {
  const nuevo: Values = {}

  // Propuesta de Valor: los tres campos comparten id con los temas del consolidado
  for (const c of CAMPOS_PROPUESTA) {
    const sintesis = g(v, K.cons('pdv', c.id))
    if (sintesis && !g(v, K.pdv(c.id))) nuevo[K.pdv(c.id)] = sintesis
  }

  // Imperativos: solo si la síntesis de candidatos viene como lista; un párrafo
  // suelto no se parte a la fuerza, se queda para que alguien lo redacte
  const candidatos = comoLista(g(v, K.cons('imp', 'candidatos')))
  if (candidatos.length > 1) {
    const n = int(v, K.impCount, IMP_DEFAULT)
    if (candidatos.length > n) nuevo[K.impCount] = String(candidatos.length)
    candidatos.forEach((nombre, i) => {
      if (!g(v, K.impNombre(i))) nuevo[K.impNombre(i)] = nombre
    })
  }

  return nuevo
}

/* ------------------------------------------------------------------ *
 * Exportacion
 * ------------------------------------------------------------------ */

function csvCell(s: string): string {
  return `"${(s || '').replace(/"/g, '""')}"`
}

/** Vuelca la arquitectura completa a CSV, con la misma estructura del Excel. */
export function matrizCsv(v: Values): string {
  const rows: string[][] = [['BLOQUE', 'SUBBLOQUE', 'CONTENIDO', 'ESTADO']]
  const cols = columnas(v)

  CAMPOS_PROPUESTA.forEach((c) => {
    rows.push(['PROPUESTA DE VALOR', c.tag, g(v, K.pdv(c.id)), g(v, K.pdvEstado(c.id)) || 'borrador'])
  })
  imperativos(v).forEach((im) => {
    rows.push(['IMPERATIVOS ESTRATÉGICOS', `Imperativo ${im.i + 1}`, im.nombre, im.corto])
  })
  const rowsCond = int(v, K.condRows, COND_ROWS_DEFAULT)
  cols.forEach((c) => {
    for (let r = 0; r < rowsCond; r++) {
      const t = g(v, K.cond(c.i, r))
      if (t) rows.push(['CULTURA · Cómo pensamos, decidimos y actuamos', c.label, t, ''])
    }
    rows.push(['CULTURA · Prácticas corporativas', c.label, g(v, K.prac(c.i)), ''])
    rows.push(['CULTURA · Mecanismos de refuerzo', c.label, g(v, K.mec(c.i)), ''])
    rows.push(['NEGOCIO · Estándares', c.label, g(v, K.est(c.i)), ''])
    rows.push(['NEGOCIO · Procesos críticos', c.label, listaTexto(v, 'proc', c.i), ''])
    rows.push(['NEGOCIO · Políticas', c.label, listaTexto(v, 'pol', c.i), ''])
    indicadoresDe(v, c.i, true).forEach((x) => {
      rows.push([
        'NEGOCIO · Indicadores críticos',
        `${c.label} · ${x.nombre}`,
        `actual ${x.actual || '—'} · 2027 ${x.meta || '—'}`,
        x.fuente,
      ])
    })
  })
  return rows.map((r) => r.map(csvCell).join(',')).join('\n')
}

export function descargar(nombre: string, contenido: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}
