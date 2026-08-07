import { ARCHIVOS_DG, DGS } from '../data/content'
import { K, unidadDe } from './model'
import type { Values } from '../types'

/**
 * Revisión de los archivos que entrega cada DG. Inspecciona los metadatos del
 * archivo — nombre, extensión y peso —, no su contenido: el navegador no abre
 * un pptx ni un xlsx. Sirve para detectar huecos y archivos mal colocados
 * antes de que alguien los abra uno por uno.
 */

const normaliza = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export interface Adjunto {
  nombre: string
  bytes: number
  tipo: string
}

/** Lee un adjunto del store; tolera el formato viejo, que era sólo el nombre. */
export function leerAdjunto(bruto: string): Adjunto | null {
  const t = (bruto ?? '').trim()
  if (!t) return null
  try {
    const j = JSON.parse(t) as Partial<Adjunto>
    if (j && typeof j.nombre === 'string') {
      return { nombre: j.nombre, bytes: Number(j.bytes) || 0, tipo: String(j.tipo ?? '') }
    }
  } catch {
    /* formato viejo */
  }
  return { nombre: t, bytes: 0, tipo: '' }
}

export function guardarAdjunto(a: Adjunto): string {
  return JSON.stringify(a)
}

export function pesoLegible(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const extension = (nombre: string) => normaliza(nombre).split('.').pop() ?? ''

/** Debajo de esto un documento de trabajo casi siempre está incompleto. */
const MINIMO_BYTES = 15 * 1024

export type Nivel = 'falta' | 'revisar' | 'ok'

export interface Aviso {
  nivel: Nivel
  titulo: string
  detalle: string
}

export interface Revision {
  entregados: number
  total: number
  avisos: Aviso[]
  /** unidades que no han entregado ni un archivo */
  sinEntregar: string[]
}

export function revisarArchivos(v: Values, dg: number): Revision {
  const g = (k: string) => (v[k] ?? '').trim()
  const avisos: Aviso[] = []

  const persona = g(K.dgPersona(dg))
  if (!persona) {
    avisos.push({
      nivel: 'falta',
      titulo: 'Sin entrevistado',
      detalle: 'Falta con quién se hizo la entrevista.',
    })
  }

  const adjuntos = ARCHIVOS_DG.map((_, i) => leerAdjunto(g(K.dgArch(dg, i))))
  const entregados = adjuntos.filter(Boolean).length

  ARCHIVOS_DG.forEach((pedido, i) => {
    const a = adjuntos[i]
    if (!a) {
      avisos.push({ nivel: 'falta', titulo: pedido.nombre, detalle: 'No se ha entregado.' })
      return
    }

    const problemas: string[] = []
    const ext = extension(a.nombre)

    if (ext && !pedido.formatos.includes(ext)) {
      problemas.push(`llegó como .${ext} y se esperaba ${pedido.formatos.slice(0, 3).join(', ')}`)
    }

    const n = normaliza(a.nombre)
    if (!pedido.pistas.some((p) => n.includes(p))) {
      problemas.push('el nombre del archivo no se parece a lo que se pidió; verifica que no esté en la casilla equivocada')
    }

    if (a.bytes && a.bytes < MINIMO_BYTES) {
      problemas.push(`pesa ${pesoLegible(a.bytes)}, probablemente esté incompleto o sea un acceso directo`)
    }

    // el mismo archivo colocado en dos casillas distintas
    const repetido = adjuntos.findIndex((o, j) => j !== i && o && normaliza(o.nombre) === n)
    if (repetido > i) {
      problemas.push(`es el mismo archivo que entregaste en “${ARCHIVOS_DG[repetido].nombre}”`)
    }

    avisos.push(
      problemas.length
        ? { nivel: 'revisar', titulo: pedido.nombre, detalle: `${a.nombre}: ${problemas.join('; ')}.` }
        : { nivel: 'ok', titulo: pedido.nombre, detalle: a.nombre },
    )
  })

  const sinEntregar = DGS.filter((d) => d !== dg && ARCHIVOS_DG.every((_, i) => !g(K.dgArch(d, i)))).map((d) =>
    unidadDe(v, d),
  )

  return { entregados, total: ARCHIVOS_DG.length, avisos, sinEntregar }
}
