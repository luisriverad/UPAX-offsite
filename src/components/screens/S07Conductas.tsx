import { COND_ROWS_DEFAULT, K, columnas } from '../../lib/model'
import { useStore } from '../../lib/store'
import { Field } from '../ui'

export default function S07Conductas() {
  const { values, num, set } = useStore()

  const cols = columnas(values)
  const filas = num(K.condRows, COND_ROWS_DEFAULT)
  const agregarFila = () => set(K.condRows, String(filas + 1))

  return (
    <section className="panel">
      <div className="cuadricula" style={{ gridTemplateColumns: `170px repeat(${cols.length}, minmax(0,1fr))` }}>
        <div className="cuad-eje">CÓMO PENSAMOS, DECIDIMOS Y ACTUAMOS</div>
        {cols.map((c) => (
          <div key={c.i} className={`cuad-col ${c.i === 0 ? 'primera' : ''}`}>
            <span className="cuad-col-n">{c.ordinal}</span>
            {c.texto && <span className="cuad-col-t">{c.texto}</span>}
          </div>
        ))}

        {Array.from({ length: filas }, (_, r) => (
          <div key={r} className="contents">
            <div className="cuad-fila">{String(r + 1).padStart(2, '0')}</div>
            {cols.map((c) => (
              <div key={c.i} className="celda">
                <Field k={K.cond(c.i, r)} placeholder="Escribe / edita…" />
                <button type="button" className="mas celda-mas" title="Agregar otra conducta" onClick={agregarFila}>
                  +
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
