import { useState } from 'react'
import { COND_ROWS_DEFAULT, K, columnas } from '../../lib/model'
import { useStore } from '../../lib/store'
import { Field } from '../ui'

export default function S07Conductas() {
  const { values, get, num, set } = useStore()
  const [vista, setVista] = useState<'grid' | 'lista'>('grid')

  const cols = columnas(values)
  const filas = num(K.condRows, COND_ROWS_DEFAULT)
  const agregarFila = () => set(K.condRows, String(filas + 1))

  /** Mueve una conducta a otro imperativo, al primer renglón libre. */
  function reasignar(desdeCol: number, fila: number, haciaCol: number) {
    if (desdeCol === haciaCol) return
    const texto = get(K.cond(desdeCol, fila))
    let destino = -1
    for (let r = 0; r < filas; r++) {
      if (!get(K.cond(haciaCol, r))) {
        destino = r
        break
      }
    }
    if (destino < 0) {
      destino = filas
      set(K.condRows, String(filas + 1))
    }
    set(K.cond(desdeCol, fila), '')
    set(K.cond(haciaCol, destino), texto)
  }

  const conductas = cols.flatMap((c) =>
    Array.from({ length: filas }, (_, r) => ({ col: c.i, fila: r, texto: get(K.cond(c.i, r)) })).filter((x) => x.texto),
  )

  return (
    <section className="panel">
      {vista === 'grid' ? (
        <div className="cuadricula" style={{ gridTemplateColumns: `220px repeat(${cols.length}, minmax(0,1fr))` }}>
          <div className="cuad-eje">CÓMO PENSAMOS, DECIDIMOS Y ACTUAMOS</div>
          {cols.map((c) => (
            <div key={c.i} className={`cuad-col ${c.i === 0 ? 'primera' : ''}`}>
              {c.label}
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
      ) : (
        <ul className="lista-conductas">
          {conductas.length === 0 && <li className="muted">Todavía no hay comportamientos capturados.</li>}
          {conductas.map((c) => (
            <li key={`${c.col}-${c.fila}`}>
              <Field k={K.cond(c.col, c.fila)} placeholder="Escribe / edita…" />
              <select
                className="select"
                value={c.col}
                onChange={(e) => reasignar(c.col, c.fila, Number(e.target.value))}
              >
                {cols.map((col) => (
                  <option key={col.i} value={col.i}>
                    {col.label}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}

      <div className="barra-vista">
        <span>
          {vista === 'grid'
            ? 'Vista alternativa: listar todos los comportamientos y luego asignarlos a un imperativo.'
            : 'Cada comportamiento queda asignado a un imperativo. Vuelve a la cuadrícula para capturar en bloque.'}
        </span>
        <button type="button" className="btn btn-ghost" onClick={() => setVista(vista === 'grid' ? 'lista' : 'grid')}>
          Cambiar vista
        </button>
      </div>
    </section>
  )
}
