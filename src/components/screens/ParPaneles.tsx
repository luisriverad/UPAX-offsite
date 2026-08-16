import { columnas } from '../../lib/model'
import { useStore } from '../../lib/store'
import { FilaImperativo, SinImperativos } from '../ui'

export interface Lado {
  titulo: string
  key: (col: number) => string
  placeholder: string
}

/**
 * Dos bloques del Excel puestos lado a lado, cada uno con una fila por
 * imperativo. Es la forma de las pantallas 08 y 10.
 */
export default function ParPaneles({ izq, der }: { izq: Lado; der: Lado }) {
  const { values } = useStore()
  const cols = columnas(values)

  if (cols.length === 0) return <SinImperativos />

  return (
    <section className="panel">
      <div className="dos">
        {[izq, der].map((lado) => (
          <div key={lado.titulo} className="caja">
            <span className="panel-t">{lado.titulo}</span>
            {cols.map((c) => (
              <FilaImperativo key={c.i} label={c.label} k={lado.key(c.i)} placeholder={lado.placeholder} />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
