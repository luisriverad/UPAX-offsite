import { useRef, useState } from 'react'
import { subirEntrevista, urlDeArchivo } from '../lib/archivosRemotos'
import { K } from '../lib/model'
import { descargarPdf, generarPdfEntrevista, leerPdfEntrevista, nombrePdf, PdfInvalido } from '../lib/pdfEntrevista'
import type { Destinatario } from '../lib/pdfEntrevista'
import { guardarAdjunto, leerAdjunto, pesoLegible } from '../lib/revisionArchivos'
import { useStore } from '../lib/store'
import { haySupabase } from '../lib/supabase'

/** La ficha del PDF contestado se guarda en la llave de quien contestó. */
const claveDe = (dest: Destinatario) => (dest.tipo === 'ceo' ? K.ceoPdf : K.dgPdf(dest.id))

/**
 * Entrevista a distancia: bajar el guion como PDF editable, mandarlo, y subir
 * de regreso el archivo contestado. Lo que llega se mezcla con lo capturado —
 * nunca reemplaza la sesión completa — y solo pisa las respuestas que el PDF
 * trae con texto, así que subir dos veces el mismo archivo es inofensivo.
 *
 * La zona de subida acepta varios PDFs a la vez: cada uno sabe de qué unidad
 * es, así que se pueden soltar todos juntos sin ordenarlos.
 */
export default function PdfEntrevista({ dest }: { dest: Destinatario }) {
  const { values, get, set } = useStore()
  const input = useRef<HTMLInputElement>(null)
  const [encima, setEncima] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState<{ tono: 'ok' | 'error'; texto: string } | null>(null)

  // el último PDF contestado que quedó archivado para este entrevistado
  const archivado = leerAdjunto(get(claveDe(dest)))

  const bajar = async () => {
    setOcupado(true)
    setAviso(null)
    try {
      descargarPdf(nombrePdf(values, dest), await generarPdfEntrevista(values, dest))
    } catch {
      setAviso({ tono: 'error', texto: 'No se pudo generar el PDF.' })
    } finally {
      setOcupado(false)
    }
  }

  /** Sube el PDF a Storage y deja su ficha en el store. false si no quedó guardado. */
  const guardarPdf = async (suyo: Destinatario, file: File): Promise<boolean> => {
    if (!haySupabase()) return false
    const r = await subirEntrevista(suyo, file)
    if (!r.ok) return false
    set(claveDe(suyo), guardarAdjunto({ nombre: file.name, bytes: file.size, tipo: 'application/pdf', ruta: r.ruta }))
    return true
  }

  const abrirGuardado = async () => {
    if (!archivado?.ruta) return
    const url = await urlDeArchivo(archivado.ruta)
    if (url) window.open(url, '_blank', 'noopener')
    else setAviso({ tono: 'error', texto: 'No se pudo abrir el PDF guardado.' })
  }

  const subir = async (files: FileList | null) => {
    const lista = Array.from(files ?? []).filter((f) => /\.pdf$/i.test(f.name) || f.type === 'application/pdf')
    if (!lista.length) {
      setAviso({ tono: 'error', texto: 'Suelta un PDF de entrevista.' })
      return
    }

    setOcupado(true)
    setAviso(null)
    const bien: string[] = []
    const mal: string[] = []

    for (const file of lista) {
      try {
        const lectura = await leerPdfEntrevista(file)
        // se aplica llave por llave: lo que el PDF no traiga, se queda como está
        for (const [clave, texto] of Object.entries(lectura.respuestas)) set(clave, texto)
        const n = Object.keys(lectura.respuestas).length

        // el archivo se archiva bajo la unidad que declara el propio PDF, no la
        // pestaña abierta: aquí se pueden soltar varios de unidades distintas
        const suyo = lectura.dest ?? dest
        const guardado = await guardarPdf(suyo, file)
        bien.push(`${lectura.quien}: ${n} de ${lectura.campos} respondidas${guardado ? '' : ' (sin archivar)'}`)
        if (!guardado && haySupabase()) mal.push(`${file.name}: se leyó, pero no se pudo guardar el archivo.`)
      } catch (e) {
        mal.push(e instanceof PdfInvalido ? e.message : `${file.name}: no se pudo leer.`)
      }
    }

    setOcupado(false)
    setAviso(
      mal.length
        ? { tono: 'error', texto: [...mal, ...bien].join(' · ') }
        : { tono: 'ok', texto: `Cargado — ${bien.join(' · ')}` },
    )
  }

  return (
    <div className="pdfent">
      <div className="pdfent-h">
        <span className="panel-t">ENTREVISTA A DISTANCIA</span>
        <button type="button" className="btn btn-dark" onClick={bajar} disabled={ocupado}>
          Descargar PDF editable
        </button>
      </div>

      <div
        className={`pdfent-zona ${encima ? 'encima' : ''} ${ocupado ? 'ocupado' : ''}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setEncima(true)
        }}
        onDragLeave={() => setEncima(false)}
        onDrop={(e) => {
          e.preventDefault()
          setEncima(false)
          void subir(e.dataTransfer.files)
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') input.current?.click()
        }}
      >
        <b>{ocupado ? 'Leyendo…' : 'Subir PDF contestado'}</b>
        <em>Arrastra aquí el archivo que te regresaron, o haz clic para buscarlo. Puedes soltar varios.</em>
      </div>

      {archivado?.ruta && (
        <p className="pdfent-guardado">
          Archivado:{' '}
          <button type="button" className="enlace" onClick={() => void abrirGuardado()}>
            {archivado.nombre}
            {archivado.bytes ? ` · ${pesoLegible(archivado.bytes)}` : ''}
          </button>
        </p>
      )}

      {aviso && <p className={`pdfent-aviso ${aviso.tono}`}>{aviso.texto}</p>}

      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        hidden
        onChange={(e) => {
          void subir(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
