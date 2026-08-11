import { useEffect } from 'react'
import type { AnalisisGrupo } from '../lib/asistenteEntrevista'
import { Chip } from './ui'

/**
 * La reescritura se ve enfrentada al original, no en la columna estrecha del
 * panel. El valor de esta pantalla está en la comparación —qué decía y cómo
 * queda—, y eso solo se aprecia si las dos versiones caben una junto a otra.
 */
export default function RedaccionFinal({
  abierto,
  bloques,
  pensando,
  aviso,
  progreso,
  insertados,
  onAplicar,
  onAplicarTodo,
  onClose,
}: {
  abierto: boolean
  bloques: AnalisisGrupo[]
  pensando: boolean
  aviso: string
  progreso: string
  insertados: string[]
  onAplicar: (clave: string, texto: string) => void
  onAplicarTodo: () => void
  onClose: () => void
}) {
  useEffect(() => {
    if (!abierto) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [abierto, onClose])

  if (!abierto) return null

  const items = bloques.flatMap((b) => b.items.map((it) => ({ ...it, bloque: b.label })))
  // solo cuenta lo que el modelo cambió de verdad
  const nuevos = items.filter((it) => it.propuesta && it.propuesta !== it.actual)
  const pendientes = nuevos.filter((it) => !insertados.includes(it.clave))

  return (
    <div className="mask" onClick={onClose}>
      <div className="modal redaccion" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="red-h">
          <div>
            <h3>Redacción final</h3>
            <p>
              {pensando
                ? progreso
                : aviso
                  ? aviso
                  : nuevos.length === 0
                    ? 'Nada por cambiar: los textos ya están al nivel que se pide.'
                    : `${nuevos.length} de ${items.length} textos se reescribieron. Compara y decide cuáles se quedan.`}
            </p>
          </div>
          <div className="red-h-btns">
            {pendientes.length > 1 && !pensando && (
              <button type="button" className="btn btn-dark" onClick={onAplicarTodo}>
                Usar las {pendientes.length}
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </header>

        <div className="red-body">
          {items.length === 0 && <p className="asis-motivo">Todavía no hay nada escrito en la arquitectura.</p>}

          {items.map((it) => {
            const cambio = Boolean(it.propuesta) && it.propuesta !== it.actual
            const aplicado = insertados.includes(it.clave)
            return (
              // mientras el modelo escribe nada está "sin cambio" todavía: no se atenúa
              <article key={it.clave} className={`red-item ${!pensando && !cambio ? 'igual' : ''}`}>
                <header className="red-item-h">
                  <span className="red-bloque">{it.bloque}</span>
                  <span className="red-campo">{it.pregunta}</span>
                </header>

                <div className="red-par">
                  <div className="red-lado antes">
                    <Chip tone="gris">ANTES</Chip>
                    <p>{it.actual}</p>
                  </div>
                  <div className="red-lado ahora">
                    <Chip tone={pensando ? 'gris' : cambio ? 'naranja' : 'verde'}>
                      {pensando || cambio ? 'AHORA' : 'SIN CAMBIO'}
                    </Chip>
                    {pensando ? (
                      <p className="red-esperando">Reescribiendo…</p>
                    ) : cambio ? (
                      <p>{it.propuesta}</p>
                    ) : (
                      <p className="muted">Ya estaba al nivel que se pide.</p>
                    )}
                  </div>
                </div>

                {cambio && !pensando && (
                  <footer className="red-item-f">
                    {it.base && <span className="red-porque">Qué se elevó: {it.base}</span>}
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={aplicado}
                      onClick={() => onAplicar(it.clave, it.propuesta)}
                    >
                      {aplicado ? 'Listo ✓' : 'Usar esta versión'}
                    </button>
                  </footer>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
