import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import type { Values } from '../types'

export type ModalMode = 'export' | 'import' | null

export default function Modal({ mode, onClose }: { mode: ModalMode; onClose: () => void }) {
  const { values, replaceAll } = useStore()
  const [texto, setTexto] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    setTexto(mode === 'export' ? JSON.stringify(values, null, 2) : '')
  }, [mode, values])

  if (!mode) return null

  function importar() {
    try {
      const parsed = JSON.parse(texto) as Values
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('formato')
      replaceAll(parsed)
      onClose()
    } catch {
      setError('El JSON no es válido. Pega el contenido exportado tal cual.')
    }
  }

  return (
    <div className="mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === 'export' ? 'Exportar sesión' : 'Importar sesión'}</h3>
        <p>
          {mode === 'export'
            ? 'Copia este JSON para respaldar o compartir todo lo capturado.'
            : 'Pega un JSON exportado. Reemplaza todo lo que hay ahora.'}
        </p>
        <textarea
          value={texto}
          readOnly={mode === 'export'}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={mode === 'import' ? '{ … }' : undefined}
        />
        {error && <p className="modal-err">{error}</p>}
        <div className="modal-btns">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cerrar
          </button>
          {mode === 'export' ? (
            <button
              type="button"
              className="btn btn-dark"
              onClick={() => navigator.clipboard?.writeText(texto).catch(() => undefined)}
            >
              Copiar
            </button>
          ) : (
            <button type="button" className="btn btn-dark" onClick={importar}>
              Importar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
