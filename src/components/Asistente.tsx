import { useEffect, useMemo, useState } from 'react'
import { analizar } from '../lib/asistenteEntrevista'
import type { AnalisisGrupo } from '../lib/asistenteEntrevista'
import { asistenteDePantalla } from '../lib/asistentePantalla'
import { hayQueCorregir, revisarRedaccion } from '../lib/correccion'
import { UNIDADES } from '../data/content'
import { ErrorIA, corregir, hayEvidencia, sintetizar } from '../lib/ia'
import RedaccionFinal from './RedaccionFinal'
import { useStore } from '../lib/store'
import type { ScreenMeta } from '../types'
import { Chip } from './ui'

/**
 * Panel derecho. Siempre trabaja en dos tiempos —el motor local responde al
 * instante y el modelo reescribe encima si hay llave—, pero hace dos oficios
 * distintos según la pantalla: en Pre-evento sintetiza la evidencia para decidir
 * qué dice el documento; en Final ya no discute contenido y solo corrige cómo
 * está escrito. Son cosas distintas y no comparten ni prompt ni botón.
 */
export default function Asistente({ screen }: { screen: ScreenMeta }) {
  const { values, set } = useStore()
  const [modo, setModo] = useState<'analizar' | null>(null)
  const [analisis, setAnalisis] = useState<AnalisisGrupo[]>([])
  const [insertados, setInsertados] = useState<string[]>([])
  const [pensando, setPensando] = useState(false)
  const [avisoIA, setAvisoIA] = useState('')
  const [conIA, setConIA] = useState(false)
  const [omitidos, setOmitidos] = useState(0)
  const [fallidos, setFallidos] = useState(0)
  const [lotes, setLotes] = useState({ hechos: 0, total: 0 })
  const [seg, setSeg] = useState(0)
  // en Final el resultado no cabe en la columna: se abre enfrentado al original
  const [verRedaccion, setVerRedaccion] = useState(false)

  // la llamada tarda decenas de segundos: sin contador el panel parece colgado
  useEffect(() => {
    if (!pensando) return
    setSeg(0)
    const t = setInterval(() => setSeg((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [pensando])

  const { grupos, fuente, modo: oficio } = useMemo(() => asistenteDePantalla(screen.id, values), [screen.id, values])
  const corrigiendo = oficio === 'redaccion'

  // cada pantalla arranca con el panel limpio
  useEffect(() => {
    setModo(null)
    setAnalisis([])
    setInsertados([])
    setPensando(false)
    setAvisoIA('')
    setConIA(false)
    setVerRedaccion(false)
  }, [screen.id])

  function limpiar() {
    setAvisoIA('')
    setConIA(false)
    setOmitidos(0)
    setFallidos(0)
    setLotes({ hechos: 0, total: 0 })
    setInsertados([])
  }

  /** Pre-evento: leer la evidencia y proponer qué debe decir cada campo. */
  async function correrSintetizar() {
    const local = analizar(values, grupos)
    setAnalisis(local)
    setModo('analizar')
    limpiar()
    if (!hayEvidencia(values)) return

    setPensando(true)
    setLotes({ hechos: 0, total: 0 })
    try {
      const { campos, omitidos, fallidos } = await sintetizar(values, screen.title, local, (hechos, total) =>
        setLotes({ hechos, total }),
      )
      if (campos.size === 0) throw new ErrorIA('El modelo no devolvió ninguna síntesis utilizable.')
      setFallidos(fallidos)
      setAnalisis(
        local.map((b) => ({
          ...b,
          items: b.items.map((it) => {
            const s = campos.get(it.clave)
            return s ? { ...it, propuesta: s.sintesis, base: s.base, tension: s.tension } : it
          }),
        })),
      )
      setOmitidos(omitidos)
      setConIA(true)
    } catch (e) {
      setAvisoIA(e instanceof ErrorIA ? e.message : 'No se pudo consultar al modelo.')
    } finally {
      setPensando(false)
    }
  }

  /** Final: el contenido ya está decidido; solo se revisa cómo está escrito. */
  async function correrCorregir() {
    const local = revisarRedaccion(values, grupos)
    setAnalisis(local)
    setModo('analizar')
    setVerRedaccion(true)
    limpiar()
    if (!hayQueCorregir(local)) return

    setPensando(true)
    setLotes({ hechos: 0, total: 0 })
    try {
      const { campos, omitidos, fallidos } = await corregir(local, (hechos, total) => setLotes({ hechos, total }))
      if (campos.size === 0) throw new ErrorIA('El modelo no devolvió ninguna corrección utilizable.')
      setFallidos(fallidos)
      setAnalisis(
        local.map((b) => ({
          ...b,
          items: b.items.map((it) => {
            const c = campos.get(it.clave)
            return c ? { ...it, propuesta: c.texto, base: c.cambio } : it
          }),
        })),
      )
      setOmitidos(omitidos)
      setConIA(true)
    } catch (e) {
      setAvisoIA(e instanceof ErrorIA ? e.message : 'No se pudo consultar al modelo.')
    } finally {
      setPensando(false)
    }
  }

  return (
    <aside className="asis">
      <Chip tone="violeta">ASISTENTE</Chip>
      {!corrigiendo && <p className="asis-sub">Trabaja sobre lo que se capturó en {fuente}.</p>}

      <div className="asis-btns">
        <button
          type="button"
          className="btn btn-orange"
          disabled={pensando}
          onClick={corrigiendo ? correrCorregir : correrSintetizar}
        >
          {pensando ? (corrigiendo ? 'Reescribiendo…' : 'Analizando…') : corrigiendo ? 'REDACCIÓN FINAL' : 'Analizar'}
        </button>
      </div>

      {corrigiendo && modo && !verRedaccion && (
        <button type="button" className="btn btn-ghost asis-reabrir" onClick={() => setVerRedaccion(true)}>
          Ver la comparación
        </button>
      )}

      {/* de dónde salió lo que se está viendo: importa para saber cuánto confiar */}
      {!corrigiendo && modo && (pensando || conIA || avisoIA) && (
        <p className={`asis-origen ${avisoIA ? 'err' : conIA ? 'ia' : ''}`}>
          {pensando
            ? `${corrigiendo ? 'Texto actual abajo. El redactor lo está reescribiendo a nivel ejecutivo' : `Borrador local abajo. El consultor lee la evidencia del CEO y las ${UNIDADES.length} unidades`}… ${
                lotes.total > 0 ? `${lotes.hechos} de ${lotes.total} bloques · ` : ''
              }${seg}s`
            : conIA
              ? `${corrigiendo ? 'Reescrito a nivel ejecutivo, con la misma idea.' : 'Redactado por el modelo sobre toda la evidencia.'}${
                  fallidos > 0 ? ` ${fallidos} ${fallidos === 1 ? 'bloque falló' : 'bloques fallaron'} y quedaron sin reescribir.` : ''
                }${omitidos > 0 ? ` No alcanzó para ${omitidos} campos: vuelve a pulsar el botón para los que falten.` : ''}`
              : `${avisoIA} ${corrigiendo ? 'Sin el modelo no hay reescritura: abajo va el texto tal como está.' : 'Se muestra el análisis local.'}`}
        </p>
      )}

      {modo === 'analizar' && !corrigiendo && (
        <div className="asis-out">
          {analisis.map((b) => (
            <section key={b.id} className="asis-item">
              <h5>
                {b.label} · {b.respondidas}/{b.total}
              </h5>

              {b.items.map((it) => {
                const yaEsta = Boolean(it.propuesta) && it.propuesta === it.actual
                return (
                  // mientras el modelo redacta, lo que se ve es el borrador local:
                  // se marca y no se deja guardar, para no comprometer un provisional
                  <div key={it.clave} className={`asis-falta ${pensando ? 'provisional' : ''}`}>
                    <p className="asis-preg">
                      {it.numero}. {it.pregunta}
                    </p>

                    {it.propuesta ? (
                      <>
                        {/* este bloque es exactamente el texto que se guarda al pulsar el botón */}
                        <p className="asis-borrador">{it.propuesta}</p>
                        {it.base && <p className="asis-meta">Base: {it.base}</p>}
                        {it.tension && <p className="asis-meta tension">Tensión: {it.tension}</p>}
                        {yaEsta ? (
                          <p className="asis-ok">Ya es lo que está en el campo.</p>
                        ) : (
                          <>
                            {it.actual && <p className="asis-actual">Hoy el campo dice: “{it.actual}”</p>}
                            <button
                              type="button"
                              className="btn btn-ghost"
                              disabled={pensando || insertados.includes(it.clave)}
                              onClick={() => {
                                set(it.clave, it.propuesta)
                                setInsertados((prev) => [...prev, it.clave])
                              }}
                            >
                              {pensando
                                ? 'Esperando al modelo…'
                                : insertados.includes(it.clave)
                                  ? 'Listo ✓'
                                  : it.actual
                                    ? 'Reemplazar con esto'
                                    : 'Completar'}
                            </button>
                          </>
                        )}
                      </>
                    ) : it.actual ? (
                      <p className="asis-cita">{it.actual}</p>
                    ) : (
                      <p className="asis-motivo">Sin evidencia todavía para construir esto.</p>
                    )}
                  </div>
                )
              })}
            </section>
          ))}
        </div>
      )}
      <RedaccionFinal
        abierto={corrigiendo && verRedaccion}
        bloques={analisis}
        pensando={pensando}
        aviso={avisoIA && `${avisoIA} Sin el modelo no hay reescritura: abajo va el texto tal como está.`}
        progreso={`Reescribiendo a nivel ejecutivo… ${
          lotes.total > 0 ? `${lotes.hechos} de ${lotes.total} bloques · ` : ''
        }${seg}s`}
        insertados={insertados}
        onAplicar={(clave, texto) => {
          set(clave, texto)
          setInsertados((prev) => [...prev, clave])
        }}
        onAplicarTodo={() => {
          const nuevos = analisis
            .flatMap((b) => b.items)
            .filter((it) => it.propuesta && it.propuesta !== it.actual && !insertados.includes(it.clave))
          nuevos.forEach((it) => set(it.clave, it.propuesta))
          setInsertados((prev) => [...prev, ...nuevos.map((it) => it.clave)])
        }}
        onClose={() => setVerRedaccion(false)}
      />
    </aside>
  )
}
