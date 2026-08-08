import { useEffect, useState } from 'react'
import { avanceTotal, descargar, matrizCsv } from '../../lib/model'
import { useStore } from '../../lib/store'
import { Chip, Foot, Panel } from '../ui'
import OnePage from './OnePage'
import type { ScreenProps } from './tipos'

export default function S12Final({ screen }: ScreenProps) {
  const { values, hist } = useStore()
  const [verHist, setVerHist] = useState(false)
  const avance = avanceTotal(values)

  // al imprimir la lámina se aísla del resto de la aplicación; hay que
  // devolverla a su sitio al terminar, se haya impreso o se haya cancelado
  useEffect(() => {
    const limpiar = () => document.body.classList.remove('solo-onepage')
    window.addEventListener('afterprint', limpiar)
    return () => {
      window.removeEventListener('afterprint', limpiar)
      limpiar()
    }
  }, [])

  function exportarOnePage() {
    document.body.classList.add('solo-onepage')
    window.print()
  }

  return (
    <Panel
      title="ARQUITECTURA UPAX · VERSIÓN FINAL"
      right={<Chip tone={avance === 100 ? 'verde' : 'ambar'}>{avance}% COMPLETO</Chip>}
    >
      <OnePage />

      <div className="final-acciones">
        <button type="button" className="btn btn-dark" onClick={exportarOnePage}>
          Exportar one-page
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => descargar('arquitectura-upax.csv', matrizCsv(values), 'text/csv;charset=utf-8')}
        >
          Exportar Excel
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setVerHist(!verHist)}>
          Historial de versiones {hist.length > 0 && `(${hist.length})`}
        </button>
        <Foot>{screen.foot}</Foot>
      </div>

      {verHist && (
        <ul className="historial">
          {hist.length === 0 && <li className="muted">Todavía no se aprueba ninguna definición en el Off-Site.</li>}
          {hist.map((h) => (
            <li key={h.ts}>
              <span className="hist-fecha">{new Date(h.ts).toLocaleString('es-MX')}</span>
              <span className="hist-bloque">{h.bloque}</span>
              <span className="hist-texto">{h.texto}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
