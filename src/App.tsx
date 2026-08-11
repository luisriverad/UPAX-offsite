import { useCallback, useEffect, useRef, useState } from 'react'
import Asistente from './components/Asistente'
import Modal from './components/Modal'
import type { ModalMode } from './components/Modal'
import Ejemplos from './components/Ejemplos'
import { PANTALLAS } from './components/screens'
import { MODULOS, SCREENS, firstOfModulo, firstOfTab, moduloDeTab, tabsDeModulo } from './data/screens'
import { avancePreEvento, avanceTotal, herenciaOffsite } from './lib/model'
import { useStore } from './lib/store'

export default function App() {
  const [actual, setActual] = useState(0)
  const [modal, setModal] = useState<ModalMode>(null)
  const [verEjemplos, setVerEjemplos] = useState(false)
  const { values, reset, setMany } = useStore()
  const main = useRef<HTMLDivElement>(null)

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

  // el módulo al que se pasa con "Siguiente", cuando la siguiente pantalla cambia de bloque
  const proxima = SCREENS[actual + 1]
  const cruce = proxima && moduloDeTab(proxima.tab) !== modulo ? MODULOS.find((m) => m.id === moduloDeTab(proxima.tab)) : null

  return (
    <div className="app">
      <header className="topbar">
        <span className="marca">
          UPAX OFF-SITE · <b>ARQUITECTURA DE CULTURA</b>
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
          {/* la referencia va arriba, a la mano desde cualquier pantalla */}
          <button type="button" className="mini mini-ejemplos" onClick={() => setVerEjemplos(true)}>
            Ver ejemplos
          </button>
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
            {tabsDeModulo(modulo).map((t) => (
              <button
                key={t.id}
                type="button"
                className={`tab ${t.id === screen.tab ? 'on' : ''}`}
                onClick={() => ir(firstOfTab(t.id))}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className={`cols ${screen.sinAsistente ? 'sola' : ''}`}>
            <Pantalla screen={screen} onGo={ir} />
            {!screen.sinAsistente && <Asistente screen={screen} />}
          </div>

          <footer className="pie">
            <div className="pager">
              <button type="button" className="btn btn-ghost" disabled={actual === 0} onClick={() => ir(actual - 1)}>
                ← Anterior
              </button>
              <button
                type="button"
                className="btn btn-dark"
                disabled={actual === SCREENS.length - 1}
                onClick={() => ir(actual + 1)}
              >
                {/* pasar de un módulo al otro no es un paso más: se anuncia */}
                {cruce ? `Empezar ${cruce.label} →` : 'Siguiente →'}
              </button>
            </div>
            <span className="folio">
              {screen.num} / {SCREENS.length}
            </span>
          </footer>
        </div>
      </div>

      <Ejemplos abierto={verEjemplos} onClose={() => setVerEjemplos(false)} />

      <Modal
        mode={modal}
        onClose={() => setModal(null)}
        onConfirmar={() => {
          reset()
          setModal(null)
        }}
      />
    </div>
  )
}
