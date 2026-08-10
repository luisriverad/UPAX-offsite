import { useRef, useState } from 'react'
import { descargarPdf, generarPdfEntrevista, leerPdfEntrevista, nombrePdf, PdfInvalido } from '../lib/pdfEntrevista'
import type { Destinatario } from '../lib/pdfEntrevista'
import { useStore } from '../lib/store'

/**
 * Entrevista a distancia: bajar el guion como PDF editable, mandarlo, y subir
 * de regreso el archivo contestado. Lo que llega se mezcla con lo capturado —
 * nunca reemplaza la sesión completa — y solo pisa las respuestas que el PDF
 * trae con texto, así que subir dos veces el mismo archivo es inofensivo.
 *
 * La zona de subida acepta varios PDFs a la vez: cada uno sabe de qué unidad
 * es, así que se pueden soltar los ocho juntos sin ordenarlos.
 */
export default function PdfEntrevista({ dest }: { dest: Destinatario }) {
  const { values, set } = useStore()
  const input = useRef<HTMLInputElement>(null)
  const [encima, setEncima] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState<{ tono: 'ok' | 'error'; texto: string } | null>(null)

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
        bien.push(`${lectura.quien}: ${n} de ${lectura.campos} respondidas`)
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
