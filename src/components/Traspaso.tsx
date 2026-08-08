import { useState } from 'react'
import Ejemplos from './Ejemplos'
import { entregaPreEvento } from '../lib/model'
import { useStore } from '../lib/store'
import type { ModuloId, TabId } from '../types'

/**
 * La costura entre los dos módulos. Muestra los mismos cuatro insumos en ambos
 * lados: en Pre-evento como lo que hay que dejar listo, en Off-Site como el
 * material con el que se está trabajando. Cada insumo salta a donde se captura.
 */
export default function Traspaso({ modulo, onIr }: { modulo: ModuloId; onIr: (tab: TabId) => void }) {
  const { values } = useStore()
  const [verEjemplos, setVerEjemplos] = useState(false)
  const items = entregaPreEvento(values)
  const listos = items.filter((i) => i.hecho >= i.total).length
  const vacios = items.filter((i) => i.hecho === 0).length

  return (
    <section className={`traspaso ${modulo}`}>
      <div className="traspaso-h">
        <span className="traspaso-t">
          {modulo === 'pre' ? 'Esto es lo que el Off-Site va a usar' : 'Trabajando con lo levantado en Pre-evento'}
        </span>
        <span className="traspaso-sub">
          {vacios === items.length
            ? 'Todavía no hay nada levantado.'
            : listos === items.length
              ? 'Evidencia completa.'
              : `${listos} de ${items.length} insumos completos.`}
        </span>
      </div>

      <div className="traspaso-items">
        {items.map((i) => {
          const estado = i.hecho === 0 ? 'falta' : i.hecho >= i.total ? 'ok' : 'parcial'
          return (
            <button
              key={i.id}
              type="button"
              className={`tr-item ${estado}`}
              onClick={() => onIr(i.tab)}
              title={`Ir a ${i.label}`}
            >
              <span className="tr-pt" />
              <span className="tr-label">{i.label}</span>
              <b>
                {i.hecho}/{i.total}
              </b>
            </button>
          )
        })}
      </div>

      {/* referencia a la mano en todas las pantallas: para desatorar la sesión */}
      <button type="button" className="btn btn-dark tr-ejemplos" onClick={() => setVerEjemplos(true)}>
        Ver ejemplos
      </button>

      <Ejemplos abierto={verEjemplos} onClose={() => setVerEjemplos(false)} />
    </section>
  )
}
