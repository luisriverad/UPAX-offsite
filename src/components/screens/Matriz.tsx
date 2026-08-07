import { filasMatriz } from '../../lib/model'
import { useStore } from '../../lib/store'
import { EstadoChip } from '../ui'

/**
 * La matriz maestra. Es la misma tabla en la pantalla 01 y en la 12; los
 * estados se derivan de la captura real, tema por tema.
 */
export default function Matriz({ onIr }: { onIr?: (key: string) => void }) {
  const { values } = useStore()
  const filas = filasMatriz(values)

  return (
    <table className="matriz">
      <tbody>
        {filas.map((f) => (
          <tr
            key={f.id}
            className={`${f.sec ? 'grupo' : ''} ${onIr ? 'clic' : ''}`}
            onClick={() => onIr?.(f.key)}
          >
            <th scope="row">{f.sec}</th>
            <td className="m-label">{f.label}</td>
            <td className="m-count">{f.conteo && `${f.conteo.filled}/${f.conteo.total}`}</td>
            <td className="m-estado">
              <EstadoChip estado={f.estado} vacio={f.vacio} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
