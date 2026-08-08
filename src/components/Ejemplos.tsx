import { useEffect, useState } from 'react'
import { PillTabs } from './ui'

/**
 * Las tres arquitecturas de referencia. Sirven para desatorar la sesión: cuando
 * el grupo no sabe qué escribir en un bloque, ver ese mismo bloque resuelto por
 * otra empresa da el nivel de concreción que se espera.
 */
const EJEMPLOS = [
  { id: 'walmart', label: 'Walmart', src: '/ejemplos/UPAX_Ejemplo_Walmart_OnePage.jpg' },
  { id: 'toyota', label: 'Toyota', src: '/ejemplos/UPAX_Ejemplo_Toyota_OnePage.jpg' },
  { id: 'wpp', label: 'WPP', src: '/ejemplos/UPAX_Ejemplo_WPP_OnePage.jpg' },
] as const

export default function Ejemplos({ abierto, onClose }: { abierto: boolean; onClose: () => void }) {
  const [cual, setCual] = useState<string>(EJEMPLOS[0].id)
  const ejemplo = EJEMPLOS.find((e) => e.id === cual) ?? EJEMPLOS[0]

  useEffect(() => {
    if (!abierto) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [abierto, onClose])

  if (!abierto) return null

  return (
    <div className="mask" onClick={onClose}>
      <div className="modal ejemplos" onClick={(e) => e.stopPropagation()}>
        <header className="ejemplos-h">
          <div>
            <h3>Cómo lo resolvieron otras empresas</h3>
            <p>La misma arquitectura —propuesta, imperativos, cultura y negocio— llena de punta a punta.</p>
          </div>
          <PillTabs items={EJEMPLOS.map((e) => ({ id: e.id, label: e.label }))} value={cual} onChange={setCual} />
        </header>

        {/* la lámina es de 2800px: aquí se ve completa y se abre aparte para leer el detalle */}
        <div className="ejemplos-lienzo">
          <img src={ejemplo.src} alt={`Arquitectura de cultura de ${ejemplo.label}, ejemplo ilustrativo`} />
        </div>

        <div className="modal-btns">
          <span className="ejemplos-nota">
            Ejemplos ilustrativos con fines de referencia. No son documentos internos de estas empresas.
          </span>
          <a className="btn btn-ghost" href={ejemplo.src} target="_blank" rel="noreferrer">
            Abrir en grande
          </a>
          <button type="button" className="btn btn-dark" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
