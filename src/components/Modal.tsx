import { useEffect, useRef, useState } from 'react'
import { DGS } from '../data/content'

export type ModalMode = 'limpiar' | 'respaldo' | null

/**
 * Confirmación de una acción que no se puede deshacer. Va como modal de la
 * aplicación y no como `confirm()` del navegador para poder decir exactamente
 * qué se pierde: un diálogo del sistema no da espacio para eso.
 */
export default function Modal({
  mode,
  guardadoEn,
  onClose,
  onConfirmar,
  onDescargar,
  onRestaurar,
}: {
  mode: ModalMode
  guardadoEn: number | null
  onClose: () => void
  onConfirmar: () => void
  onDescargar: () => void
  onRestaurar: (json: string) => boolean
}) {
  const archivo = useRef<HTMLInputElement>(null)
  const [aviso, setAviso] = useState('')

  // el aviso se limpia al abrir el modal y NO en cada render del padre: si
  // dependiera de `onClose` —que llega como función nueva cada vez— restaurar
  // borraría su propia confirmación antes de que alcance a leerse
  useEffect(() => setAviso(''), [mode])

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

  if (mode === 'respaldo') {
    const hora = guardadoEn ? new Date(guardadoEn).toLocaleString('es-MX') : null
    return (
      <div className="mask" onClick={onClose}>
        <div className="modal respaldo" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <h3>Respaldo del trabajo</h3>
          <p>
            Todo se guarda solo en <b>este navegador y en esta computadora</b>. Si se limpia el historial, se cambia de
            equipo o alguien pulsa Limpiar, se pierde. Baja un archivo de respaldo al terminar cada sesión.
          </p>
          {hora && <p className="respaldo-hora">Último guardado local: {hora}</p>}

          <div className="respaldo-acciones">
            <button type="button" className="btn btn-dark" onClick={onDescargar}>
              Descargar respaldo (.json)
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => archivo.current?.click()}>
              Restaurar desde archivo
            </button>
          </div>

          {/* restaurar pisa lo que haya: se avisa antes, no después */}
          <input
            ref={archivo}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              if (!confirm('Restaurar reemplaza todo lo capturado ahora mismo. ¿Continuar?')) return
              setAviso(onRestaurar(await f.text()) ? 'Respaldo restaurado.' : 'Ese archivo no es un respaldo válido.')
            }}
          />

          {aviso && <p className="respaldo-aviso">{aviso}</p>}

          <div className="modal-btns">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

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
