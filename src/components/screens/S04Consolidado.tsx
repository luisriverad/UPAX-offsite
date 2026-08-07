import { useState } from 'react'
import { DGS, VISTAS_CONSOLIDADO } from '../../data/content'
import { K, archivosCargados, dgsQueRespondieron, fraseCeo, recorta, respuestasCeo } from '../../lib/model'
import { useStore } from '../../lib/store'
import { Chip, Field, Foot, PillTabs } from '../ui'
import type { ScreenProps } from './tipos'

export default function S04Consolidado({ screen }: ScreenProps) {
  const { values, get } = useStore()
  const [vistaId, setVista] = useState(VISTAS_CONSOLIDADO[0].id)
  const [editando, setEditando] = useState<string | null>(null)
  const vista = VISTAS_CONSOLIDADO.find((v) => v.id === vistaId) ?? VISTAS_CONSOLIDADO[0]

  const dgsCon = dgsQueRespondieron(values)
  const fuentes = archivosCargados(values)

  return (
    <section className="panel">
      <header className="panel-h">
        <PillTabs
          label="Vista por:"
          items={VISTAS_CONSOLIDADO.map((v) => ({ id: v.id, label: v.label }))}
          value={vistaId}
          onChange={setVista}
        />
      </header>

      <table className="tabla">
        <thead>
          <tr>
            <th>Tema</th>
            <th>CEO</th>
            <th>DGs</th>
            <th>Evidencia</th>
            <th className="w-sintesis">Síntesis</th>
          </tr>
        </thead>
        <tbody>
          {vista.temas.map((t) => {
            const ceo = fraseCeo(values, t.bloque)
            const sintesis = get(K.cons(vista.id, t.id))
            const hayEvidencia = Boolean(ceo) || dgsCon > 0 || fuentes > 0
            return (
              <tr key={t.id} className={!sintesis && hayEvidencia ? 'alerta' : ''}>
                <th scope="row">{t.label}</th>
                <td className="celda-cec" title={ceo}>
                  {ceo ? `“${recorta(ceo, 48)}”` : <span className="muted">sin captura</span>}
                </td>
                <td>
                  {dgsCon > 0 ? (
                    <span className="dg-mix">
                      <b>{dgsCon}</b> de {DGS.length} respondieron
                    </span>
                  ) : (
                    <span className="muted">sin respuestas</span>
                  )}
                </td>
                <td className="muted">{fuentes} fuentes</td>
                <td>
                  {/* con síntesis se lee de corrido y se edita a propósito; sin ella, se captura directo */}
                  {sintesis && editando !== t.id ? (
                    <div className="sintesis lista">
                      <p className="sintesis-txt">{sintesis}</p>
                      <button type="button" className="btn btn-ghost" onClick={() => setEditando(t.id)}>
                        Editar
                      </button>
                    </div>
                  ) : (
                    <div className="sintesis">
                      <Field
                        k={K.cons(vista.id, t.id)}
                        placeholder="Síntesis editable…"
                        rows={editando === t.id ? 4 : 1}
                      />
                      {editando === t.id ? (
                        <button type="button" className="btn btn-ghost" onClick={() => setEditando(null)}>
                          Listo
                        </button>
                      ) : hayEvidencia ? (
                        <Chip tone="ambar">REVISAR</Chip>
                      ) : (
                        <Chip tone="gris">PENDIENTE</Chip>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <Foot>
        {screen.foot} · {respuestasCeo(values)} respuestas del CEO cargadas.
      </Foot>
    </section>
  )
}
