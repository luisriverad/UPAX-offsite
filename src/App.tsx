import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import Asistente from './components/Asistente'
import Modal from './components/Modal'
import type { ModalMode } from './components/Modal'
import Ejemplos from './components/Ejemplos'
import { PANTALLAS } from './components/screens'
import { MODULOS, SCREENS, firstOfModulo, firstOfTab, moduloDeTab, tabsDeModulo } from './data/screens'
import { avancePreEvento, avanceTotal, descargar, herenciaOffsite } from './lib/model'
import { useStore } from './lib/store'

export default function App() {
  const [actual, setActual] = useState(0)
  const [modal, setModal] = useState<ModalMode>(null)
  const [verEjemplos, setVerEjemplos] = useState(false)
  const { values, reset, setMany, guardar, guardadoEn, exportar, importar } = useStore()
  const main = useRef<HTMLDivElement>(null)
  // qué dice el botón de guardar ahora mismo: 'guardado' | 'error' | null
  const [avisoGuardado, setAvisoGuardado] = useState<'guardado' | 'error' | null>(null)

  const ir = useCallback((i: number) => {
    if (i < 0 || i >= SCREENS.length) return
    setActual(i)
    main.current?.scrollTo({ top: 0 })
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null
      if (el?.closest('input, textarea, select')) return
      if (e.key === 'ArrowRight') ir(actual + 1)
      if (e.key === 'ArrowLeft') ir(actual - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [actual, ir])

  const screen = SCREENS[actual]
  const Pantalla = PANTALLAS[screen.id]
  const modulo = moduloDeTab(screen.tab)
  const moduloActual = MODULOS.find((m) => m.id === modulo) ?? MODULOS[0]

  // el Off-Site no arranca en blanco: al entrar hereda lo que quedó en el Consolidado.
  // Se lee por referencia y solo al cambiar de módulo, para no repoblar un campo
  // que alguien acaba de borrar a propósito durante la sesión.
  const valuesRef = useRef(values)
  valuesRef.current = values
  useEffect(() => {
    if (modulo !== 'off') return
    const herencia = herenciaOffsite(valuesRef.current)
    if (Object.keys(herencia).length > 0) setMany(herencia)
  }, [modulo, setMany])

  // cada módulo se mide con lo suyo: el previo por evidencia levantada, el off-site por la matriz
  const avance = { pre: avancePreEvento(values), off: avanceTotal(values) }

  /**
   * El trabajo ya se autoguarda, pero en un proceso de varias sesiones eso no
   * basta: hay que poder confirmarlo a voluntad y ver la hora del último
   * guardado. El botón fuerza la escritura y dice si funcionó.
   */
  const onGuardar = useCallback(() => {
    setAvisoGuardado(guardar() ? 'guardado' : 'error')
    setTimeout(() => setAvisoGuardado(null), 2200)
  }, [guardar])

  // Cmd/Ctrl+S: el reflejo de todo el mundo para guardar
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        onGuardar()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onGuardar])

  // 24 h a propósito: "21:24" cabe en el botón, "09:24 p.m." lo desborda
  const horaGuardado = guardadoEn
    ? new Date(guardadoEn).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null

  return (
    <div className="app">
      <header className="topbar">
        <span className="marca">
          <img className="marca-logo" src="/logo-upax.png" alt="Grupo UPAX" />
          <span className="marca-txt">
            OFF-SITE · <b>ARQUITECTURA DE CULTURA</b>
          </span>
        </span>

        {/* el nombre del método, al centro: las iniciales resaltadas explican el acrónimo */}
        <div className="vibe">
          <span className="vibe-n">
            VIBE <em>Framework</em>
          </span>
          <span className="vibe-s">
            <b>V</b>alue · <b>I</b>mperatives · <b>B</b>ehavior · <b>E</b>conomics
          </span>
        </div>
        <div className="topbar-r">
          <span className="avance">
            Pre-evento {avance.pre}% · Off-Site {avance.off}%
          </span>

          {/* Guardar es lo primero: el resto de la barra son salidas, no el trabajo.
              Va como control partido —guardar aquí, respaldo al lado— porque dos
              botones sueltos ya no caben en una fila de 1512px y la parten en dos. */}
          <span className="mini-par">
            <button
              type="button"
              className={`mini mini-guardar ${avisoGuardado ?? ''}`}
              onClick={onGuardar}
              title={
                horaGuardado
                  ? `Último guardado a las ${horaGuardado}, en este navegador (⌘S)`
                  : 'Guardar en este navegador (⌘S)'
              }
            >
              {avisoGuardado === 'guardado' ? 'Guardado ✓' : avisoGuardado === 'error' ? 'No se guardó' : 'Guardar'}
            </button>
            <button
              type="button"
              className="mini mini-respaldo"
              onClick={() => setModal('respaldo')}
              title="Respaldo: descargar el trabajo o restaurarlo desde un archivo"
              aria-label="Respaldo"
            >
              ⋯
            </button>
          </span>

          <button type="button" className="mini" onClick={() => window.print()}>
            Exportar a PDF
          </button>
          <button type="button" className="mini" onClick={() => setModal('limpiar')}>
            Limpiar
          </button>
        </div>
      </header>

      {/* los dos módulos del proceso, siempre a la vista */}
      <nav className="modulos">
        {MODULOS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`modulo m-${m.id} ${m.id === modulo ? 'on' : ''}`}
            onClick={() => ir(firstOfModulo(m.id))}
          >
            <span className="modulo-n">{m.num}</span>
            <span className="modulo-txt">
              <span className="modulo-l">{m.label}</span>
              <span className="modulo-s">{tabsDeModulo(m.id).map((t) => t.label).join(' · ')}</span>
            </span>
            <span className="modulo-p">{avance[m.id]}%</span>
          </button>
        ))}
      </nav>

      <div className="scroll" ref={main}>
        <div className="hoja">
          <p className={`eyebrow e-${modulo}`}>
            {moduloActual.label} · Pantalla {String(screen.num).padStart(2, '0')} de {SCREENS.length}
          </p>
          <h1>{screen.title}</h1>

          <nav className="tabs">
            {tabsDeModulo(modulo).map((t, i) => (
              <Fragment key={t.id}>
                <button
                  type="button"
                  className={`tab ${t.id === screen.tab ? 'on' : ''}`}
                  onClick={() => ir(firstOfTab(t.id))}
                >
                  {t.label}
                </button>

                {/* La referencia va pegada a la primera pestaña del módulo, no al
                    final: se consulta antes de trabajar, no después. No es una
                    pantalla más —abre el panel lateral— y por eso va en amarillo. */}
                {i === 0 && (
                  <button type="button" className="tab tab-ejemplos" onClick={() => setVerEjemplos(true)}>
                    Ver ejemplos
                  </button>
                )}
              </Fragment>
            ))}
          </nav>

          <div className={`cols ${screen.sinAsistente ? 'sola' : ''}`}>
            <Pantalla screen={screen} onGo={ir} />
            {!screen.sinAsistente && <Asistente screen={screen} />}
          </div>

          <footer className="pie">
            <span className="folio">
              {screen.num} / {SCREENS.length}
            </span>
          </footer>
        </div>
      </div>

      <Ejemplos abierto={verEjemplos} onClose={() => setVerEjemplos(false)} />

      <Modal
        mode={modal}
        guardadoEn={guardadoEn}
        onClose={() => setModal(null)}
        onConfirmar={() => {
          reset()
          setModal(null)
        }}
        onDescargar={() => {
          const hoy = new Date().toISOString().slice(0, 10)
          descargar(`upax-arquitectura-${hoy}.json`, exportar(), 'application/json')
        }}
        onRestaurar={importar}
      />
    </div>
  )
}
