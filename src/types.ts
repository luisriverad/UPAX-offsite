export type TabId =
  | 'metodo'
  | 'manifiesto'
  | 'ceo'
  | 'dgs'
  | 'alineacion'
  | 'consolidado'
  | 'propuesta'
  | 'imperativos'
  | 'cultura'
  | 'negocio'
  | 'final'

/**
 * El proceso son dos módulos: primero se levanta la evidencia (antes del
 * off-site) y después se construye la arquitectura sobre ella.
 */
export type ModuloId = 'pre' | 'off'

export interface Tab {
  id: TabId
  label: string
  modulo: ModuloId
}

/** Una de las 12 pantallas del diseño funcional. */
export interface ScreenMeta {
  id: string
  num: number
  tab: TabId
  title: string
  sub?: string
  /** las cuatro directrices que muestra el panel del asistente */
  copi: string[]
  /** oculta el panel del asistente y deja la pantalla a todo lo ancho */
  sinAsistente?: boolean
}

/** Estado visual de un bloque del Excel. */
export type Estado = 'vacio' | 'borrador' | 'revisar' | 'aprobado'

/** Fila de la matriz maestra (pantallas 01 y 12). */
export interface MatrixRow {
  /** encabezado de sección; vacío cuando la fila cuelga de la anterior */
  sec: string
  label: string
  /** clave del bloque en el modelo de avance */
  key: BlockKey
  /** etiqueta cuando el bloque está en cero */
  empty: string
}

export type BlockKey =
  | 'pdv'
  | 'imp'
  | 'cul.cond'
  | 'cul.prac'
  | 'cul.mec'
  | 'neg.est'
  | 'neg.ind'
  | 'neg.proc'
  | 'neg.pol'

export interface Conteo {
  filled: number
  total: number
}

export type Values = Record<string, string>

/** Entrada del historial de versiones (pantalla 12). */
export interface HistEntry {
  ts: number
  bloque: string
  texto: string
}
