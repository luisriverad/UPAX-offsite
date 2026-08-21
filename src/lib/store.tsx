import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { cargarAppState, guardarAppState, sembrarAppState, suscribirAppState } from './appState'
import type { AppStateRow } from './appState'
import { normalizaPdv } from './redaccionPdv'
import { haySupabase } from './supabase'
import type { HistEntry, Values } from '../types'

const KEY = 'upax_arquitectura_v2'
const NUBE_DEBOUNCE_MS = 700

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
  /** fuerza la escritura local (+ nube si hay Supabase); false si falló lo local */
  guardar: () => boolean
  /** cuando se escribió por última vez, para poder decirlo en pantalla */
  guardadoEn: number | null
  /** true cuando la sesión se sincroniza con Supabase (opción A) */
  nube: boolean
  /** true mientras se carga o se alinea la sesión remota al arrancar */
  sincronizando: boolean
  /** todo lo capturado, como texto, para bajarlo a un archivo de respaldo */
  exportar: () => string
  /** carga un respaldo encima de lo actual; false si el archivo no sirve */
  importar: (json: string) => boolean
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

function aplicaNormaliza(v: Values): Values {
  return { ...v, ...normalizaPdv(v) }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<Values>(() => readLocal())
  const [guardadoEn, setGuardadoEn] = useState<number | null>(null)
  const [sincronizando, setSincronizando] = useState(() => haySupabase())
  const nube = haySupabase()

  // versión remota conocida; evita pisar updates de otro dispositivo
  const versionRef = useRef(0)
  // solo empujar a la nube cuando el cambio nace aquí (no al aplicar Realtime)
  const dirtyRef = useRef(false)
  // true tras el bootstrap inicial; el debounce de nube solo corre después
  const listoRef = useRef(!haySupabase())
  const valuesRef = useRef(values)
  valuesRef.current = values

  const escribirLocal = useCallback((v: Values) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(v))
      setGuardadoEn(Date.now())
      return true
    } catch {
      return false
    }
  }, [])

  const aplicarRemoto = useCallback(
    (row: AppStateRow) => {
      if (row.version < versionRef.current) return
      versionRef.current = row.version
      dirtyRef.current = false
      const next = aplicaNormaliza(row.values)
      setValues(next)
      escribirLocal(next)
    },
    [escribirLocal],
  )

  // Arranque: alinear con la sesión compartida (o sembrar si la nube está vacía)
  useEffect(() => {
    if (!haySupabase()) return

    let cancelado = false
    ;(async () => {
      setSincronizando(true)
      const remoto = await cargarAppState()
      if (cancelado) return

      const local = valuesRef.current
      const remotoVacio = !remoto || (remoto.version === 0 && Object.keys(remoto.values).length === 0)

      if (remotoVacio && Object.keys(local).length > 0) {
        const sembrado = await sembrarAppState(local)
        if (cancelado) return
        if (sembrado) {
          versionRef.current = sembrado.version
          setGuardadoEn(sembrado.updatedAt)
        }
      } else if (remoto && Object.keys(remoto.values).length > 0) {
        aplicarRemoto(remoto)
      } else if (remoto) {
        versionRef.current = remoto.version
      }

      listoRef.current = true
      setSincronizando(false)
    })()

    return () => {
      cancelado = true
    }
  }, [aplicarRemoto])

  // Realtime: otro dispositivo escribió
  useEffect(() => {
    if (!haySupabase()) return
    return suscribirAppState((row) => {
      if (row.version <= versionRef.current) return
      aplicarRemoto(row)
    })
  }, [aplicarRemoto])

  // Autoguardado local (siempre)
  useEffect(() => {
    const t = setTimeout(() => escribirLocal(values), 350)
    return () => clearTimeout(t)
  }, [values, escribirLocal])

  // Autoguardado en la nube (debounce), solo tras bootstrap y si hay cambios locales
  useEffect(() => {
    if (!haySupabase() || !listoRef.current || !dirtyRef.current) return

    const t = setTimeout(() => {
      if (!dirtyRef.current) return
      const ver = versionRef.current
      const snapshot = valuesRef.current
      void (async () => {
        const r = await guardarAppState(snapshot, ver)
        if (r.ok && r.row) {
          versionRef.current = r.row.version
          dirtyRef.current = false
          setGuardadoEn(r.row.updatedAt)
        } else if (r.row) {
          // conflicto: alineamos con lo remoto
          aplicarRemoto(r.row)
        }
      })()
    }, NUBE_DEBOUNCE_MS)

    return () => clearTimeout(t)
  }, [values, aplicarRemoto])

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
      dirtyRef.current = true
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
      dirtyRef.current = true
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
      dirtyRef.current = true
      const entry: HistEntry = { ts: Date.now(), bloque, texto }
      return { ...prev, [HIST_KEY]: JSON.stringify([entry, ...prevHist].slice(0, 60)) }
    })
  }, [])

  const replaceAll = useCallback((v: Values) => {
    dirtyRef.current = true
    setValues(v || {})
  }, [])

  const reset = useCallback(() => {
    dirtyRef.current = true
    setValues({})
  }, [])

  const guardar = useCallback(() => {
    const okLocal = escribirLocal(values)
    if (!okLocal) return false
    if (!haySupabase() || !listoRef.current) return true

    dirtyRef.current = true
    const ver = versionRef.current
    void (async () => {
      const r = await guardarAppState(values, ver)
      if (r.ok && r.row) {
        versionRef.current = r.row.version
        dirtyRef.current = false
        setGuardadoEn(r.row.updatedAt)
      } else if (r.row) {
        aplicarRemoto(r.row)
      }
    })()
    return true
  }, [escribirLocal, values, aplicarRemoto])

  const exportar = useCallback(() => JSON.stringify({ app: KEY, ts: Date.now(), values }, null, 2), [values])

  const importar = useCallback(
    (json: string) => {
      try {
        const leido = JSON.parse(json) as { app?: string; values?: Values } | Values
        const v = (leido as { values?: Values }).values ?? (leido as Values)
        if (!v || typeof v !== 'object' || Array.isArray(v)) return false
        const limpio = Object.fromEntries(
          Object.entries(v).filter(([, valor]) => typeof valor === 'string'),
        ) as Values
        if (Object.keys(limpio).length === 0) return false
        dirtyRef.current = true
        setValues(limpio)
        escribirLocal(limpio)
        return true
      } catch {
        return false
      }
    },
    [escribirLocal],
  )

  const api = useMemo(
    () => ({
      values,
      get,
      num,
      set,
      setMany,
      hist,
      logVersion,
      replaceAll,
      reset,
      guardar,
      guardadoEn,
      nube,
      sincronizando,
      exportar,
      importar,
    }),
    [
      values,
      get,
      num,
      set,
      setMany,
      hist,
      logVersion,
      replaceAll,
      reset,
      guardar,
      guardadoEn,
      nube,
      sincronizando,
      exportar,
      importar,
    ],
  )
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useStore(): StoreCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useStore debe usarse dentro de StoreProvider')
  return c
}
