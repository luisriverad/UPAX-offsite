import { useState } from 'react'
import { BLOQUES_OFFSITE, DGS } from '../../data/content'
import { K, archivosCargados, avancePorFamilia, fraseCeo, recorta, unidadDe } from '../../lib/model'
import { useStore } from '../../lib/store'
import { Chip, Field, PillTabs } from '../ui'

/** Pregunta del guion de DGs que alimenta la promesa del grupo. */
const PREGUNTA_PROMESA_DG = 2

export default function S11Offsite() {
  const { values, get, set, logVersion } = useStore()
  const [bloqueId, setBloque] = useState(BLOQUES_OFFSITE[0].id)
  const [editando, setEditando] = useState(false)

  const bloque = BLOQUES_OFFSITE.find((b) => b.id === bloqueId) ?? BLOQUES_OFFSITE[0]
  const texto = get(bloque.src)
  const estado = get(`${bloque.src}.estado`)

  const ceo = fraseCeo(values, 'pdv')
  const dg = DGS.find((d) => get(K.dg(d, PREGUNTA_PROMESA_DG)))
  const fuentes = [ceo, dg ? get(K.dg(dg, PREGUNTA_PROMESA_DG)) : '', String(archivosCargados(values) || '')].filter(
    Boolean,
  ).length

  return (
    <section className="panel">
      <header className="panel-h">
        <span className="panel-right">
          <Chip tone="naranja">BLOQUE ACTUAL</Chip>
          <PillTabs
            size="sm"
            items={BLOQUES_OFFSITE.map((b) => ({ id: b.id, label: b.label }))}
            value={bloqueId}
            onChange={(id) => {
              setBloque(id)
              setEditando(false)
            }}
          />
        </span>
        <Chip tone="azul">{fuentes} FUENTES CLAVE</Chip>
      </header>

      <div className="offsite">
        <div className="caja preliminar">
          <span className="prelim-t">VERSIÓN PRELIMINAR</span>
          {editando ? (
            <Field k={bloque.src} placeholder="Escribe la versión que se está trabajando…" rows={3} />
          ) : (
            <blockquote className={texto ? '' : 'vacia'}>
              {texto ? `“${texto}”` : 'Sin versión preliminar todavía.'}
            </blockquote>
          )}
          <p className="prelim-sub">Basada en entrevistas + evidencia cargada</p>

          <div className="prelim-btns">
            <button type="button" className="btn btn-ghost" onClick={() => setEditando(!editando)}>
              {editando ? 'Listo' : 'Editar'}
            </button>
            <button
              type="button"
              className={`btn ${estado === 'aprobado' ? 'btn-orange' : 'btn-dark'}`}
              disabled={!texto}
              onClick={() => {
                set(`${bloque.src}.estado`, 'aprobado')
                logVersion(bloque.label, texto)
                setEditando(false)
              }}
            >
              {estado === 'aprobado' ? 'Aprobada ✓' : 'Aprobar'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => set(`${bloque.src}.estado`, '')}>
              Pendiente
            </button>
          </div>
        </div>

        <div className="caja">
          <span className="panel-t">ALTERNATIVAS / EVIDENCIA</span>

          <div className="ev-fila">
            <Chip tone="gris">Opción B</Chip>
            <Field k={K.pdvAlt(bloque.id)} placeholder="Redacción alternativa…" />
          </div>
          <div className="ev-fila">
            <Chip tone="azul">CEO</Chip>
            <p className="ev-txt">{ceo ? recorta(ceo, 90) : <span className="muted">sin captura en la pantalla 02</span>}</p>
          </div>
          <div className="ev-fila">
            <Chip tone="azul">{dg ? unidadDe(values, dg) : 'DGs'}</Chip>
            <p className="ev-txt">
              {dg ? (
                recorta(get(K.dg(dg, PREGUNTA_PROMESA_DG)), 90)
              ) : (
                <span className="muted">sin captura en la pantalla 03</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="contadores">
        {avancePorFamilia(values).map((f) => (
          <div key={f.label} className="cont">
            <span>{f.label}</span>
            <Chip tone={f.c.filled === 0 ? 'ambar' : f.c.filled === f.c.total ? 'verde' : 'azul'}>
              {f.c.filled}/{f.c.total}
            </Chip>
          </div>
        ))}
      </div>
    </section>
  )
}
