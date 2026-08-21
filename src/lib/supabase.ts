import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente de Supabase:
 * - Storage: archivos de los DGs y PDFs de entrevista
 * - Tabla app_state: sesión compartida (opción A) que sincroniza el store
 *   entre dispositivos; localStorage queda como caché local
 *
 * La llave anon es pública por diseño — es la que va en el navegador. Lo que
 * protege el bucket y la tabla son las políticas de RLS de supabase/schema.sql.
 */

const SUPA_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

/** Bucket privado donde se guardan los entregables de cada unidad. */
export const BUCKET = 'dg-archivos'

let cliente: SupabaseClient | null = null

/**
 * Sin variables de entorno la app sigue funcionando igual que antes: se guarda
 * el nombre del archivo y nada más. Así nadie se queda sin poder capturar
 * porque falte configurar Supabase.
 */
export function haySupabase(): boolean {
  return Boolean(SUPA_URL && ANON_KEY)
}

export function supa(): SupabaseClient | null {
  if (!haySupabase()) return null
  if (!cliente) {
    cliente = createClient(SUPA_URL, ANON_KEY, {
      auth: { persistSession: false },
    })
  }
  return cliente
}
