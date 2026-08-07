import { IND_DEFAULT, K, columnas } from '../../lib/model'
import { useStore } from '../../lib/store'
import { Chip, FilaImperativo, Line } from '../ui'

export default function S09Estandares() {
  const { values, num, set } = useStore()
  const cols = columnas(values)
  const n = num(K.indCount, IND_DEFAULT)

  return (
    <section className="panel">
      <div className="dos">
        <div className="caja">
          <Chip tone="oscuro">ESTÁNDARES</Chip>
          <div className="caja-body">
            {cols.map((c) => (
              <FilaImperativo key={c.i} label={c.label} k={K.est(c.i)} placeholder="Estándar concreto…" />
            ))}
          </div>
        </div>

        <div className="caja">
          <Chip tone="naranja">INDICADORES CRÍTICOS</Chip>
          <table className="tabla ind">
            <thead>
              <tr>
                <th>Indicador</th>
                <th className="w-num">Actual</th>
                <th className="w-num">2027</th>
                <th>Fuente</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: n }, (_, r) => (
                <tr key={r}>
                  <td>
                    <Line k={K.ind(r, 'nombre')} placeholder={`Indicador ${String.fromCharCode(65 + r)}`} />
                  </td>
                  <td>
                    <Line k={K.ind(r, 'actual')} placeholder="—" align="center" className="num actual" />
                  </td>
                  <td>
                    <Line k={K.ind(r, 'meta')} placeholder="—" align="center" className="num meta" />
                  </td>
                  <td>
                    <Line k={K.ind(r, 'fuente')} placeholder="Pendiente" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="caja-acciones">
            <button type="button" className="btn btn-ghost" disabled={n <= 1} onClick={() => set(K.indCount, String(n - 1))}>
              − Quitar
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => set(K.indCount, String(n + 1))}>
              + Agregar indicador
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
