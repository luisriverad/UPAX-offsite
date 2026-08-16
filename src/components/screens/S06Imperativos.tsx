import { useEffect, useState } from 'react'
import { IMP_DEFAULT, K, imperativos } from '../../lib/model'
import { ErrorIA, proponerImperativos } from '../../lib/ia'
import { useStore } from '../../lib/store'
import { Chip, Line, Panel } from '../ui'
import type { Values } from '../../types'

/**
 * La mesa de trabajo de los imperativos. PROPONER pide los diez al modelo, que
 * lee el Manifiesto, la evidencia levantada y las arquitecturas de referencia.
 * Va a botón y no en automático a propósito: la llamada cuesta, y la pantalla se
 * abre muchas veces durante la sesión.
 *
 * El grupo marca los que se quedan y ajusta a mano el que haga falta. Lo marcado
 * es lo que baja a Cultura y a Negocio: la casilla no es un adorno, es la
 * decisión. Mientras nadie marque nada valen todos, para que la plataforma no
 * aparezca vacía la primera vez que se abre esta pantalla.
 */
export default function S06Imperativos() {
  const { values, set, setMany } = useStore()
  const imps = imperativos(values)
  const elegidos = imps.filter((im) => im.elegido).length
  const hayEscrito = imps.some((im) => im.nombre || im.corto)

  // qué renglón está abierto para ajustar a mano; uno a la vez
  const [editando, setEditando] = useState<number | null>(null)
  const [pensando, setPensando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [seg, setSeg] = useState(0)

  // la llamada tarda decenas de segundos: sin contador la pantalla parece colgada
  useEffect(() => {
    if (!pensando) return
    setSeg(0)
    const t = setInterval(() => setSeg((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [pensando])

  async function proponer() {
    setConfirmando(false)
    setAviso('')
    setPensando(true)
    try {
      const propuestos = await proponerImperativos(values)
      // la propuesta reemplaza la mesa entera, selección incluida: media lista
      // vieja mezclada con media nueva no es algo que se pueda leer
      const patch: Values = { [K.impCount]: String(IMP_DEFAULT) }
      for (let i = 0; i < IMP_DEFAULT; i++) {
        patch[K.impNombre(i)] = propuestos[i]?.nombre ?? ''
        patch[K.impCorto(i)] = propuestos[i]?.corto ?? ''
        patch[K.impSel(i)] = ''
      }
      setMany(patch)
      setEditando(null)
    } catch (e) {
      setAviso(e instanceof ErrorIA ? e.message : 'No se pudo consultar al modelo.')
    } finally {
      setPensando(false)
    }
  }

  return (
    <Panel
      title="IMPERATIVOS DE TRABAJO"
      right={
        <span className="panel-right">
          {elegidos > 0 && (
            <span className="muted imp-cuenta">
              {elegidos} de {IMP_DEFAULT} elegidos
            </span>
          )}

          {confirmando ? (
            <>
              <span className="muted imp-cuenta">¿Reemplazar lo que ya hay?</span>
              <button type="button" className="btn btn-orange" onClick={proponer}>
                Sí, proponer
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmando(false)}>
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-orange"
              disabled={pensando}
              onClick={() => (hayEscrito ? setConfirmando(true) : proponer())}
            >
              {pensando ? `Proponiendo… ${seg}s` : 'PROPONER'}
            </button>
          )}
        </span>
      }
    >
      {aviso && <p className="imp-aviso">{aviso}</p>}

      <ol className={`imps ${pensando ? 'esperando' : ''}`}>
        {imps.map((im) => {
          const abierto = editando === im.i
          const completo = Boolean(im.nombre && im.corto)
          return (
            <li key={im.i} className={`imp ${im.elegido ? 'elegido' : ''} ${im.nombre ? 'activo' : ''}`}>
              <label className="imp-check">
                <input
                  type="checkbox"
                  checked={im.elegido}
                  onChange={(e) => set(K.impSel(im.i), e.target.checked ? '1' : '')}
                  aria-label={`Dejar el imperativo ${im.i + 1}`}
                />
              </label>

              <span className="imp-n">{String(im.i + 1).padStart(2, '0')}</span>

              {abierto ? (
                <>
                  <Line k={K.impNombre(im.i)} placeholder={`Imperativo ${im.i + 1}`} className="imp-nombre" />
                  <Line k={K.impCorto(im.i)} placeholder="Nombre corto" className="imp-corto" />
                </>
              ) : (
                <>
                  <span className={`imp-txt ${im.nombre ? '' : 'vacio'}`}>
                    {im.nombre || `Imperativo ${im.i + 1}`}
                  </span>
                  <span className={`imp-txt corto ${im.corto ? '' : 'vacio'}`}>{im.corto || 'Nombre corto'}</span>
                </>
              )}

              <button
                type="button"
                className="btn btn-ghost imp-editar"
                onClick={() => setEditando(abierto ? null : im.i)}
              >
                {abierto ? 'Listo' : 'Editar'}
              </button>

              {/* un renglón en blanco es la propuesta que todavía no llega, no un
                  hueco que alguien tenga que llenar: no se le cuelga etiqueta */}
              {completo ? (
                <Chip tone="verde">APROBADO</Chip>
              ) : im.nombre ? (
                <Chip tone="ambar">REVISAR</Chip>
              ) : null}
            </li>
          )
        })}
      </ol>
    </Panel>
  )
}
