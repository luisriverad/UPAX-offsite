import { useEffect } from 'react'
import { DGS } from '../data/content'

export type ModalMode = 'limpiar' | null

/**
 * Confirmación de una acción que no se puede deshacer. Va como modal de la
 * aplicación y no como `confirm()` del navegador para poder decir exactamente
 * qué se pierde: un diálogo del sistema no da espacio para eso.
 */
export default function Modal({
  mode,
  onClose,
  onConfirmar,
}: {
  mode: ModalMode
  onClose: () => void
  onConfirmar: () => void
}) {
  // salir con Escape: es la vía de escape que todo el mundo intenta primero
  useEffect(() => {
    if (!mode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, onClose])

  if (!mode) return null

  return (
    <div className="mask" onClick={onClose}>
      <div className="modal confirmar" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>¿Seguro quieres borrar todo?</h3>
        <p>
          Se borra toda la captura del proceso: la entrevista con el CEO, las de las {DGS.length} unidades, los archivos
          marcados y la arquitectura construida en el Off-Site. <b>No se puede deshacer.</b>
        </p>
        <div className="modal-btns">
          <button type="button" className="btn btn-ghost" onClick={onClose} autoFocus>
            Cancelar
          </button>
          <button type="button" className="btn btn-peligro" onClick={onConfirmar}>
            Sí, borrar todo
          </button>
        </div>
      </div>
    </div>
  )
}
