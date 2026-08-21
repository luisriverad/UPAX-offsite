import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente de Supabase para el almacenamiento de los archivos que entregan los
 * DGs. Solo se usa la parte de Storage: el estado de la app sigue viviendo en
 * el store y en localStorage.
 *
 * La llave anon es pública por diseño — es la que va en el navegador. Lo que
 * protege el bucket son las políticas de RLS de supabase/schema.sql, no el
 * secreto de esta llave.
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
