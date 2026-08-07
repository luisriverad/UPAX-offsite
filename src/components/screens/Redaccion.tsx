import { useState } from 'react'
import { documento } from '../../lib/model'
import { useStore } from '../../lib/store'
import { Panel } from '../ui'
import { PANTALLA_DE_BLOQUE } from './tipos'

/**
 * Lo que se va escribiendo en las demás pestañas, leído de corrido. No captura
 * nada: es el espejo del texto para ver cómo va quedando la redacción.
 */
export default function Redaccion({ onGo }: { onGo: (i: number) => void }) {
  const { values } = useStore()
  const [soloEscrito, setSoloEscrito] = useState(false)

  const secciones = documento(values)
  const escritos = secciones.reduce((n, s) => n + s.items.filter((i) => i.texto).length, 0)
  const totales = secciones.reduce((n, s) => n + s.items.length, 0)

  const visibles = soloEscrito
    ? secciones.map((s) => ({ ...s, items: s.items.filter((i) => i.texto) })).filter((s) => s.items.length > 0)
    : secciones

  return (
    <Panel
      title="CÓMO VA QUEDANDO REDACTADO"
      right={
        <span className="panel-right">
          <span className="muted">
            {escritos} de {totales} textos escritos
          </span>
          <button type="button" className="btn btn-ghost" onClick={() => setSoloEscrito(!soloEscrito)}>
            {soloEscrito ? 'Ver todo' : 'Solo lo escrito'}
          </button>
        </span>
      }
      className="doc-panel"
    >
      <div className="doc-body">
        {visibles.length === 0 && (
          <p className="doc-nada">Todavía no hay nada escrito. Empieza por la Propuesta de Valor.</p>
        )}

        {visibles.map((s) => (
          <section key={s.id} className="doc-sec">
            <header className="doc-h">
              <h4>{s.titulo}</h4>
              <button type="button" className="doc-link" onClick={() => onGo(PANTALLA_DE_BLOQUE[s.key] ?? 0)}>
                editar →
              </button>
            </header>
            <dl className="doc-items">
              {s.items.map((it) => (
                <div key={it.id} className={`doc-item ${it.texto ? '' : 'vacio'}`}>
                  <dt>{it.label}</dt>
                  <dd>{it.texto || 'pendiente'}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Panel>
  )
}
