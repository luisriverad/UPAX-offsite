import { useEffect, useMemo, useState } from 'react'
import { analizar, cuestionar } from '../lib/asistenteEntrevista'
import type { AnalisisGrupo, ResultadoCuestionar } from '../lib/asistenteEntrevista'
import { asistenteDePantalla } from '../lib/asistentePantalla'
import { ErrorIA, hayEvidencia, repreguntar, sintetizar } from '../lib/ia'
import { useStore } from '../lib/store'
import type { ScreenMeta } from '../types'
import { Chip } from './ui'

type Modo = 'cuestionar' | 'analizar' | null

/**
 * Panel derecho de todas las pantallas. Trabaja en dos tiempos: el motor local
 * responde al instante sobre lo capturado, y si hay llave configurada el modelo
 * reescribe encima con una síntesis de toda la evidencia. Si el modelo falla,
 * lo local se queda en pantalla y el aviso explica por qué.
 */
export default function Asistente({ screen }: { screen: ScreenMeta }) {
  const { values, set } = useStore()
  const [modo, setModo] = useState<Modo>(null)
  const [dudas, setDudas] = useState<ResultadoCuestionar | null>(null)
  const [analisis, setAnalisis] = useState<AnalisisGrupo[]>([])
  const [insertados, setInsertados] = useState<string[]>([])
  const [pensando, setPensando] = useState(false)
  const [avisoIA, setAvisoIA] = useState('')
  const [conIA, setConIA] = useState(false)
  const [omitidos, setOmitidos] = useState(0)
  const [seg, setSeg] = useState(0)

  // la llamada tarda decenas de segundos: sin contador el panel parece colgado
  useEffect(() => {
    if (!pensando) return
    setSeg(0)
    const t = setInterval(() => setSeg((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [pensando])

  const { grupos, fuente } = useMemo(() => asistenteDePantalla(screen.id, values), [screen.id, values])

  // cada pantalla arranca con el panel limpio
  useEffect(() => {
    setModo(null)
    setDudas(null)
    setAnalisis([])
    setInsertados([])
    setPensando(false)
    setAvisoIA('')
    setConIA(false)
  }, [screen.id])

  function limpiar() {
    setAvisoIA('')
    setConIA(false)
    setOmitidos(0)
    setInsertados([])
  }

  async function correrAnalizar() {
    const local = analizar(values, grupos)
    setAnalisis(local)
    setModo('analizar')
    limpiar()
    if (!hayEvidencia(values)) return

    setPensando(true)
    try {
      const { campos, omitidos } = await sintetizar(values, screen.title, local)
      if (campos.size === 0) throw new ErrorIA('El modelo no devolvió ninguna síntesis utilizable.')
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

  async function correrCuestionar() {
    const local = cuestionar(values, grupos)
    setDudas(local)
    setModo('cuestionar')
    limpiar()
    if (!local.dudas.length || !hayEvidencia(values)) return

    setPensando(true)
    try {
      const ia = await repreguntar(values, screen.title, local.dudas)
      if (ia.size === 0) throw new ErrorIA('El modelo no devolvió repreguntas utilizables.')
      setDudas({
        ...local,
        dudas: local.dudas.map((d) => ({ ...d, repreguntas: ia.get(d.clave) ?? d.repreguntas })),
      })
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
      <p className="asis-sub">Trabaja sobre lo que se capturó en {fuente}.</p>

      <div className="asis-btns">
        <button type="button" className="btn btn-ghost" disabled={pensando} onClick={correrCuestionar}>
          Cuestionar
        </button>
        <button type="button" className="btn btn-orange" disabled={pensando} onClick={correrAnalizar}>
          {pensando ? 'Analizando…' : 'Analizar'}
        </button>
      </div>

      {/* de dónde salió lo que se está viendo: importa para saber cuánto confiar */}
      {modo && (pensando || conIA || avisoIA) && (
        <p className={`asis-origen ${avisoIA ? 'err' : conIA ? 'ia' : ''}`}>
          {pensando
            ? `Leyendo toda la evidencia del CEO y los DGs… ${seg}s`
            : conIA
              ? `Redactado por el modelo sobre toda la evidencia.${
                  omitidos > 0 ? ` No alcanzó para ${omitidos} campos: vuelve a pulsar Analizar para los que falten.` : ''
                }`
              : `${avisoIA} Se muestra el análisis local.`}
        </p>
      )}

      {modo === 'cuestionar' && dudas && (
        <div className="asis-out">
          {dudas.revisadas === 0 ? (
            <p className="asis-motivo">Todavía no hay ninguna respuesta que revisar.</p>
          ) : dudas.dudas.length === 0 ? (
            <p className="asis-ok">Lo capturado está completo y concreto. No hay nada que repreguntar.</p>
          ) : (
            <>
              <p className="asis-lead">
                {dudas.dudas.length} {dudas.dudas.length === 1 ? 'respuesta necesita' : 'respuestas necesitan'} otra
                vuelta.
              </p>
              {dudas.dudas.map((d) => (
                <section key={d.clave} className="asis-item">
                  <h5>
                    {d.grupoLabel} · pregunta {d.numero}
                  </h5>
                  <p className={d.respuesta ? 'asis-cita' : 'asis-motivo'}>
                    {d.respuesta ? `“${d.respuesta}”` : 'Sin responder'}
                  </p>
                  <ul>
                    {d.repreguntas.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </>
          )}
          {dudas.sinEmpezar.length > 0 && (
            <p className="asis-nota-pie">Sin empezar: {dudas.sinEmpezar.join(', ')}.</p>
          )}
        </div>
      )}

      {modo === 'analizar' && (
        <div className="asis-out">
          {analisis.map((b) => (
            <section key={b.id} className="asis-item">
              <h5>
                {b.label} · {b.respondidas}/{b.total}
              </h5>

              {b.items.map((it) => {
                const yaEsta = Boolean(it.propuesta) && it.propuesta === it.actual
                return (
                  <div key={it.clave} className="asis-falta">
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
                              disabled={insertados.includes(it.clave)}
                              onClick={() => {
                                set(it.clave, it.propuesta)
                                setInsertados((prev) => [...prev, it.clave])
                              }}
                            >
                              {insertados.includes(it.clave)
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
    </aside>
  )
}
