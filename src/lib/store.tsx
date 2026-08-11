import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { normalizaPdv } from './redaccionPdv'
import type { HistEntry, Values } from '../types'

const KEY = 'upax_arquitectura_v2'

interface StoreCtx {
  values: Values
  get: (k: string) => string
  /** entero guardado en el store; util para contadores de filas */
  num: (k: string, def: number) => number
  set: (k: string, v: string) => void
  /** escribe varias claves en una sola actualizacion */
  setMany: (patch: Values) => void
  /** registra una decision aprobada en el historial de versiones */
  logVersion: (bloque: string, texto: string) => void
  hist: HistEntry[]
  replaceAll: (v: Values) => void
  reset: () => void
}

const Ctx = createContext<StoreCtx | null>(null)
const HIST_KEY = '__hist'

function readLocal(): Values {
  try {
    const raw = localStorage.getItem(KEY)
    const v = raw ? (JSON.parse(raw) as Values) : {}
    // la Propuesta de Valor tiene arranque obligatorio: lo guardado antes de la
    // regla se corrige al abrir, no solo lo que se sintetice de aquí en adelante
    return { ...v, ...normalizaPdv(v) }
  } catch {
    return {}
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<Values>(() => readLocal())

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(values))
      } catch {
        /* almacenamiento no disponible */
      }
    }, 350)
    return () => clearTimeout(t)
  }, [values])

  const get = useCallback((k: string) => values[k] ?? '', [values])

  const num = useCallback(
    (k: string, def: number) => {
      const n = parseInt(values[k] ?? '', 10)
      return Number.isFinite(n) ? n : def
    },
    [values],
  )

  const set = useCallback((k: string, v: string) => {
    setValues((prev) => {
      if ((prev[k] ?? '') === v) return prev
      const next = { ...prev }
      if (v) next[k] = v
      else delete next[k]
      return next
    })
  }, [])

  const setMany = useCallback((patch: Values) => {
    setValues((prev) => {
      const entradas = Object.entries(patch).filter(([k, v]) => v && prev[k] !== v)
      if (entradas.length === 0) return prev
      return { ...prev, ...Object.fromEntries(entradas) }
    })
  }, [])

  const hist = useMemo<HistEntry[]>(() => {
    try {
      return values[HIST_KEY] ? (JSON.parse(values[HIST_KEY]) as HistEntry[]) : []
    } catch {
      return []
    }
  }, [values])

  const logVersion = useCallback((bloque: string, texto: string) => {
    setValues((prev) => {
      let prevHist: HistEntry[] = []
      try {
        prevHist = prev[HIST_KEY] ? (JSON.parse(prev[HIST_KEY]) as HistEntry[]) : []
      } catch {
        prevHist = []
      }
      const entry: HistEntry = { ts: Date.now(), bloque, texto }
      return { ...prev, [HIST_KEY]: JSON.stringify([entry, ...prevHist].slice(0, 60)) }
    })
  }, [])

  const replaceAll = useCallback((v: Values) => setValues(v || {}), [])
  const reset = useCallback(() => setValues({}), [])

  const api = useMemo(
    () => ({ values, get, num, set, setMany, hist, logVersion, replaceAll, reset }),
    [values, get, num, set, setMany, hist, logVersion, replaceAll, reset],
  )
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useStore(): StoreCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useStore debe usarse dentro de StoreProvider')
  return c
}
