import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Values } from '../types'
import { haySupabase, supa } from './supabase'

/** Una sola fila: todos los clientes leen y escriben la misma sesión. */
export const APP_STATE_ID = 'default'

export interface AppStateRow {
  values: Values
  version: number
  updatedAt: number
}

function limpiaValues(raw: unknown): Values {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).filter(([, v]) => typeof v === 'string'),
  ) as Values
}

function filaDe(data: { values?: unknown; version?: number; updated_at?: string } | null): AppStateRow | null {
  if (!data) return null
  return {
    values: limpiaValues(data.values),
    version: Number(data.version) || 0,
    updatedAt: data.updated_at ? Date.parse(data.updated_at) : Date.now(),
  }
}

/** Carga la sesión compartida. null si no hay Supabase o falló la red. */
export async function cargarAppState(): Promise<AppStateRow | null> {
  if (!haySupabase()) return null
  const { data, error } = await supa()!
    .from('app_state')
    .select('values, version, updated_at')
    .eq('id', APP_STATE_ID)
    .maybeSingle()

  if (error) {
    console.warn('[app_state] no se pudo cargar:', error.message)
    return null
  }
  return filaDe(data)
}

/**
 * Escribe el store completo en la nube.
 * Usa version para no pisar un update más nuevo (optimistic lock).
 * Si el remoto avanzó, devuelve la fila remota para que el store se alinee.
 */
export async function guardarAppState(
  values: Values,
  versionEsperada: number,
): Promise<{ ok: boolean; row?: AppStateRow; error?: string }> {
  if (!haySupabase()) return { ok: false, error: 'Supabase no configurado' }

  const { data, error } = await supa()!
    .from('app_state')
    .update({
      values,
      version: versionEsperada + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', APP_STATE_ID)
    .eq('version', versionEsperada)
    .select('values, version, updated_at')
    .maybeSingle()

  if (error) {
    console.warn('[app_state] no se pudo guardar:', error.message)
    return { ok: false, error: error.message }
  }

  // nadie tenía esa versión: alguien más escribió primero
  if (!data) {
    const remoto = await cargarAppState()
    return { ok: false, row: remoto ?? undefined, error: 'conflicto' }
  }

  return { ok: true, row: filaDe(data)! }
}

/**
 * Primera siembra: la nube está vacía (version 0) y este navegador ya tiene captura.
 */
export async function sembrarAppState(values: Values): Promise<AppStateRow | null> {
  if (!haySupabase()) return null
  if (Object.keys(values).length === 0) return null

  const { data, error } = await supa()!
    .from('app_state')
    .update({
      values,
      version: 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', APP_STATE_ID)
    .eq('version', 0)
    .select('values, version, updated_at')
    .maybeSingle()

  if (error) {
    console.warn('[app_state] no se pudo sembrar:', error.message)
    return null
  }
  return filaDe(data)
}

/** Suscripción Realtime a la fila compartida. */
export function suscribirAppState(onChange: (row: AppStateRow) => void): () => void {
  if (!haySupabase()) return () => {}

  const canal: RealtimeChannel = supa()!
    .channel('app_state_default')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'app_state',
        filter: `id=eq.${APP_STATE_ID}`,
      },
      (payload) => {
        const row = filaDe(payload.new as { values?: unknown; version?: number; updated_at?: string })
        if (row) onChange(row)
      },
    )
    .subscribe()

  return () => {
    void supa()?.removeChannel(canal)
  }
}
