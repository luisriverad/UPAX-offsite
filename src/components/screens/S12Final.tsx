import { useState } from 'react'
import { avanceTotal, descargar, matrizCsv } from '../../lib/model'
import { useStore } from '../../lib/store'
import { Chip, Foot, Panel } from '../ui'
import Matriz from './Matriz'
import type { ScreenProps } from './tipos'
import { PANTALLA_DE_BLOQUE } from './tipos'

export default function S12Final({ screen, onGo }: ScreenProps) {
  const { values, hist } = useStore()
  const [verHist, setVerHist] = useState(false)
  const avance = avanceTotal(values)

  return (
    <Panel
      title="ARQUITECTURA UPAX · VERSIÓN FINAL"
      right={<Chip tone={avance === 100 ? 'verde' : 'ambar'}>{avance}% COMPLETO</Chip>}
    >
      <Matriz onIr={(key) => onGo(PANTALLA_DE_BLOQUE[key] ?? 0)} />

      <div className="final-acciones">
        <button type="button" className="btn btn-dark" onClick={() => window.print()}>
          Exportar PDF
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
