import type { Destinatario } from './pdfEntrevista'
import { BUCKET, haySupabase, supa } from './supabase'

/**
 * Los entregables de cada DG viven en Supabase Storage, no en el navegador:
 * el store solo guarda la ficha del archivo (nombre, peso, tipo y su ruta),
 * que es lo que pesa poco y lo que lee la revisión.
 *
 * La ruta se arma con la unidad y la casilla — unidad-3/2-plan-2027.pdf — para
 * que el bucket se pueda leer de corrido en el panel de Supabase sin tener que
 * cruzarlo contra el JSON de la app.
 */

const MAX_BYTES = 25 * 1024 * 1024

/** Nombre de archivo seguro para una ruta de Storage: sin acentos ni espacios. */
function limpia(nombre: string): string {
  return (
    nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 80) || 'archivo'
  )
}

/**
 * Ruta única dentro del bucket. Lleva el índice de la casilla al frente para
 * que los cinco entregables de una unidad salgan ordenados como se piden, y
 * un sufijo de tiempo para que resubir el mismo nombre no pise al anterior.
 */
export function rutaDe(dg: number, casilla: number, nombre: string, ts: number): string {
  return `unidad-${dg}/${casilla}-${ts}-${limpia(nombre)}`
}

export interface ResultadoSubida {
  ok: boolean
  ruta?: string
  /** mensaje listo para mostrar en pantalla cuando algo falló */
  error?: string
}

export async function subirArchivo(dg: number, casilla: number, file: File): Promise<ResultadoSubida> {
  if (!haySupabase()) {
    return { ok: false, error: 'Supabase no está configurado: se guardó solo el nombre del archivo.' }
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: 'El archivo pasa de 25 MB. Súbelo comprimido o mándalo por otra vía.' }
  }

  const ruta = rutaDe(dg, casilla, file.name, Date.now())
  const { error } = await supa()!
    .storage.from(BUCKET)
    .upload(ruta, file, { contentType: file.type || 'application/octet-stream', upsert: false })

  if (error) return { ok: false, error: `No se pudo subir: ${error.message}` }
  return { ok: true, ruta }
}

/**
 * El bucket es privado, así que para abrir un archivo hay que pedir una URL
 * firmada. Dura una hora: suficiente para revisarlo, no para repartirla.
 */
export async function urlDeArchivo(ruta: string): Promise<string | null> {
  if (!haySupabase() || !ruta) return null
  const { data, error } = await supa()!.storage.from(BUCKET).createSignedUrl(ruta, 60 * 60)
  return error ? null : (data?.signedUrl ?? null)
}

/** Borra el archivo del bucket. Silencioso: quitar la ficha no debe fallar por esto. */
export async function borrarArchivo(ruta: string): Promise<void> {
  if (!haySupabase() || !ruta) return
  await supa()!.storage.from(BUCKET).remove([ruta])
}


/* ------------------------------------------------------------------ *
 * Entrevistas contestadas
 * ------------------------------------------------------------------ */

/**
 * El PDF que regresa contestado también se guarda: hasta ahora se leían sus
 * respuestas y el archivo se tiraba, así que no quedaba el original de lo que
 * cada quien firmó. Va aparte de los entregables, en su propia carpeta.
 */
export function rutaEntrevista(dest: Destinatario, nombre: string, ts: number): string {
  const carpeta = dest.tipo === 'ceo' ? 'ceo' : `unidad-${dest.id}`
  return `entrevistas/${carpeta}/${ts}-${limpia(nombre)}`
}

export async function subirEntrevista(dest: Destinatario, file: File): Promise<ResultadoSubida> {
  if (!haySupabase()) {
    return { ok: false, error: 'Supabase no está configurado: el PDF no se guardó.' }
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: `${file.name}: pasa de 25 MB y no se guardó.` }
  }

  const ruta = rutaEntrevista(dest, file.name, Date.now())
  const { error } = await supa()!
    .storage.from(BUCKET)
    .upload(ruta, file, { contentType: 'application/pdf', upsert: false })

  if (error) return { ok: false, error: `${file.name}: no se pudo guardar (${error.message}).` }
  return { ok: true, ruta }
}
