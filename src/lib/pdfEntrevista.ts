import type { PDFDocument, PDFFont, PDFPage } from 'pdf-lib'
import { BLOQUES_CEO, BLOQUE_UNIDAD, BLOQUES_DG } from '../data/content'
import { K, unidadDe } from './model'
import type { Values } from '../types'

/**
 * Entrevista en PDF editable: la vía para cuando no hay 1:1.
 *
 * El PDF lleva un campo de formulario por pregunta y cada campo se llama como
 * la llave del store (`dg.3.pdv.0`), así que al regresar no hay que adivinar a
 * qué pregunta pertenece cada texto: la respuesta cae en la misma coordenada
 * que si se hubiera capturado aquí. Reordenar o reescribir las preguntas en
 * `content.ts` no rompe nada; renombrar las llaves sí.
 */

export type Destinatario = { tipo: 'ceo' } | { tipo: 'dg'; id: number }

/**
 * pdf-lib pesa más que el resto de la aplicación junta y solo hace falta al
 * apretar un botón: se carga la primera vez que se usa, no al abrir la pantalla.
 */
let libPromesa: Promise<typeof import('pdf-lib')> | null = null
const lib = () => (libPromesa ??= import('pdf-lib'))

/** Prefijo de los campos del formulario. El resto del nombre es la llave. */
const PREFIJO = 'resp__'
/** Los puntos separan jerarquía en los nombres de campo del PDF: van como `_`. */
const aCampo = (clave: string) => PREFIJO + clave.replace(/\./g, '_')
const aClave = (campo: string) => campo.slice(PREFIJO.length).replace(/_/g, '.')

/** Solo se aceptan llaves de entrevista: un PDF ajeno no escribe en otro lado. */
const CLAVE_VALIDA = /^(cec\.[a-z]+\.\d+|dg\.\d+\.(?:[a-z]+\.\d+|unidad|persona))$/

const MARCA = 'upax-arquitectura-entrevista'

interface BloquePdf {
  label: string
  preguntas: { texto: string; clave: string }[]
}

/** El guion que le toca a quien contesta, ya resuelto a llaves del store. */
function guionDe(dest: Destinatario): BloquePdf[] {
  if (dest.tipo === 'ceo') {
    return BLOQUES_CEO.map((b) => ({
      label: b.label,
      preguntas: b.preguntas.map((texto, i) => ({ texto, clave: K.ceo(b.id, i) })),
    }))
  }
  return [...BLOQUES_DG, BLOQUE_UNIDAD].map((b) => ({
    label: b.id === BLOQUE_UNIDAD.id ? `${b.label} (solo de esta unidad)` : b.label,
    preguntas: b.preguntas.map((texto, i) => ({ texto, clave: K.dg(dest.id, b.id, i) })),
  }))
}

const quienEs = (values: Values, dest: Destinatario) =>
  dest.tipo === 'ceo' ? 'CEO' : unidadDe(values, dest.id)

/* ------------------------------------------------------------------ *
 * Generación
 * ------------------------------------------------------------------ */

const A4 = { w: 595.28, h: 841.89 }
const MARGEN = 48
const ANCHO = A4.w - MARGEN * 2
const ALTO_RESPUESTA = 88

/** Los mismos tokens de `globals.css`, en el espacio de color del PDF. */
const TONOS = {
  tinta: [0.08, 0.09, 0.1],
  gris: [0.55, 0.55, 0.59],
  naranja: [1, 0.29, 0.09],
  campoFondo: [0.973, 0.973, 0.98],
  campoLinea: [0.906, 0.906, 0.918],
  bloqueFondo: [0.95, 0.95, 0.96],
} as const

/** Helvetica va en WinAnsi: hay acentos y signos de apertura, no hay guion largo. */
function limpiar(s: string): string {
  return s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-')
}

function envolver(texto: string, font: PDFFont, size: number, ancho: number): string[] {
  const lineas: string[] = []
  let linea = ''
  for (const palabra of limpiar(texto).split(/\s+/)) {
    const tentativa = linea ? `${linea} ${palabra}` : palabra
    if (font.widthOfTextAtSize(tentativa, size) > ancho && linea) {
      lineas.push(linea)
      linea = palabra
    } else {
      linea = tentativa
    }
  }
  if (linea) lineas.push(linea)
  return lineas
}

export async function generarPdfEntrevista(values: Values, dest: Destinatario): Promise<Uint8Array> {
  const { PDFBool, PDFDocument, PDFName, StandardFonts, rgb } = await lib()
  const color = (t: readonly [number, number, number]) => rgb(t[0], t[1], t[2])
  const TINTA = color(TONOS.tinta)
  const GRIS = color(TONOS.gris)
  const NARANJA = color(TONOS.naranja)
  const CAMPO_FONDO = color(TONOS.campoFondo)
  const CAMPO_LINEA = color(TONOS.campoLinea)

  const doc = await PDFDocument.create()
  const form = doc.getForm()
  const helv = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const quien = quienEs(values, dest)
  const bloques = guionDe(dest)

  let page: PDFPage = doc.addPage([A4.w, A4.h])
  let y = A4.h - MARGEN

  const nuevaPagina = () => {
    page = doc.addPage([A4.w, A4.h])
    y = A4.h - MARGEN
  }
  /** Reserva vertical: si no cabe el bloque completo, se pasa de página. */
  const asegurar = (alto: number) => {
    if (y - alto < MARGEN) nuevaPagina()
  }

  const texto = (s: string, size: number, font: PDFFont, color = TINTA, sangria = 0) => {
    for (const l of envolver(s, font, size, ANCHO - sangria)) {
      y -= size + 3
      page.drawText(l, { x: MARGEN + sangria, y, size, font, color })
    }
  }

  /* Portada del documento: quién contesta y cómo se regresa. */
  y -= 4
  page.drawText('UPAX  ·  ARQUITECTURA DE CULTURA', { x: MARGEN, y, size: 9, font: bold, color: NARANJA })
  y -= 26
  page.drawText(limpiar(`Entrevista — ${quien}`), { x: MARGEN, y, size: 20, font: bold, color: TINTA })
  y -= 8
  texto(
    'Contesta directamente sobre este PDF y guárdalo antes de regresarlo. Los campos son editables: ' +
      'ábrelo con Acrobat, Vista Previa de Mac o Chrome. No lo imprimas ni lo re-exportes como imagen, ' +
      'porque se pierden las respuestas.',
    9.5,
    helv,
    GRIS,
  )
  y -= 10

  /* Identidad de la unidad: el CEO no la necesita. */
  if (dest.tipo === 'dg') {
    for (const [etiqueta, clave] of [
      ['Unidad de negocio', K.dgUnidad(dest.id)],
      ['Nombre y puesto de quien contesta', K.dgPersona(dest.id)],
    ] as const) {
      y -= 22
      page.drawText(limpiar(etiqueta), { x: MARGEN, y, size: 8.5, font: bold, color: GRIS })
      y -= 22
      const campo = form.createTextField(aCampo(clave))
      campo.setText(values[clave] ?? (clave.endsWith('unidad') ? quien : ''))
      campo.addToPage(page, {
        x: MARGEN,
        y,
        width: ANCHO,
        height: 20,
        borderWidth: 1,
        borderColor: CAMPO_LINEA,
        backgroundColor: CAMPO_FONDO,
      })
      campo.setFontSize(11)
    }
    y -= 8
  }

  /* Un bloque por pestaña de la plataforma, en el mismo orden. */
  for (const bloque of bloques) {
    asegurar(70)
    y -= 30
    page.drawRectangle({ x: MARGEN, y: y - 4, width: ANCHO, height: 22, color: color(TONOS.bloqueFondo) })
    page.drawText(limpiar(bloque.label.toUpperCase()), {
      x: MARGEN + 10,
      y: y + 2,
      size: 9,
      font: bold,
      color: TINTA,
    })
    y -= 12

    bloque.preguntas.forEach((p, i) => {
      const lineas = envolver(`${i + 1}.  ${p.texto}`, helv, 10.5, ANCHO)
      asegurar(lineas.length * 13.5 + ALTO_RESPUESTA + 26)

      y -= 18
      for (const l of lineas) {
        page.drawText(l, { x: MARGEN, y, size: 10.5, font: helv, color: TINTA })
        y -= 13.5
      }

      y -= ALTO_RESPUESTA - 4
      const campo = form.createTextField(aCampo(p.clave))
      campo.enableMultiline()
      campo.setText(values[p.clave] ?? '')
      campo.addToPage(page, {
        x: MARGEN,
        y,
        width: ANCHO,
        height: ALTO_RESPUESTA,
        borderWidth: 1,
        borderColor: CAMPO_LINEA,
        backgroundColor: CAMPO_FONDO,
      })
      // el tamaño va después de colocarlo: antes no existe la apariencia por
      // defecto (/DA) sobre la que se escribe, y pdf-lib lanza
      campo.setFontSize(10)
    })
  }

  /* Metadatos: de quién es el documento, para no depender de su nombre de archivo. */
  const meta = { marca: MARCA, v: 1, tipo: dest.tipo, id: dest.tipo === 'dg' ? dest.id : null, quien }
  doc.setTitle(limpiar(`UPAX · Entrevista — ${quien}`))
  doc.setSubject(JSON.stringify(meta))
  doc.setCreator('UPAX · Arquitectura de Cultura')

  form.updateFieldAppearances(helv)
  // que el visor regenere la apariencia al escribir: sin esto, algunos lectores
  // muestran el texto tecleado con la fuente equivocada o no lo muestran
  try {
    form.acroForm.dict.set(PDFName.of('NeedAppearances'), PDFBool.True)
  } catch {
    /* si el visor no lo respeta, el formulario sigue siendo válido */
  }

  return doc.save()
}

export function nombrePdf(values: Values, dest: Destinatario): string {
  const base = quienEs(values, dest)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return `upax-entrevista-${base || 'unidad'}.pdf`
}

/** Descarga directa: el PDF es binario y no pasa por `descargar` de model.ts. */
export function descargarPdf(nombre: string, bytes: Uint8Array) {
  const url = URL.createObjectURL(new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}

/* ------------------------------------------------------------------ *
 * Lectura del PDF contestado
 * ------------------------------------------------------------------ */

export interface LecturaPdf {
  archivo: string
  quien: string
  /** solo las llaves que traen texto */
  respuestas: Values
  /** cuántos campos traía el documento, contestados o no */
  campos: number
}

export class PdfInvalido extends Error {}

export async function leerPdfEntrevista(file: File): Promise<LecturaPdf> {
  const { PDFDocument, PDFTextField } = await lib()

  let doc: PDFDocument
  try {
    doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true })
  } catch {
    throw new PdfInvalido(`${file.name}: no se pudo abrir, ¿es un PDF?`)
  }

  let meta: { marca?: string; quien?: string } = {}
  try {
    meta = JSON.parse(doc.getSubject() || '{}')
  } catch {
    /* documento sin metadatos: se decide por los campos */
  }

  const campos = doc.getForm().getFields()
  const respuestas: Values = {}
  let propios = 0

  for (const campo of campos) {
    const nombre = campo.getName()
    if (!nombre.startsWith(PREFIJO)) continue
    const clave = aClave(nombre)
    if (!CLAVE_VALIDA.test(clave)) continue
    // los campos son de texto por construcción; si el PDF viene manipulado, se ignora
    if (!(campo instanceof PDFTextField)) continue
    propios++
    const limpio = (campo.getText() ?? '').trim()
    if (limpio) respuestas[clave] = limpio
  }

  if (propios === 0) {
    throw new PdfInvalido(
      meta.marca === MARCA
        ? `${file.name}: el PDF perdió sus campos editables (se imprimió o se exportó como imagen). Pide que lo llenen sobre el archivo original y lo guarden con Ctrl/Cmd+S.`
        : `${file.name}: no es una entrevista de UPAX o ya no trae campos editables.`,
    )
  }

  return { archivo: file.name, quien: meta.quien || 'entrevista', respuestas, campos: propios }
}
