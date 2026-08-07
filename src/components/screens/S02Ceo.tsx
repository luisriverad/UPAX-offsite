import { useState } from 'react'
import { BLOQUES_CEO } from '../../data/content'
import { K, respuestasCeo } from '../../lib/model'
import { useStore } from '../../lib/store'
import { Chip, Field, Panel, SideTabs } from '../ui'

export default function S02Ceo() {
  const { values, get } = useStore()
  const [bloqueId, setBloque] = useState(BLOQUES_CEO[0].id)
  const [guardado, setGuardado] = useState(false)

  const bloque = BLOQUES_CEO.find((b) => b.id === bloqueId) ?? BLOQUES_CEO[0]
  const respondidas = respuestasCeo(values, bloque.id)

  return (
    <Panel
      title="ENTREVISTA"
      tone="naranja"
      right={
        <span className="panel-right">
          <b className="entrevistado">CEO</b>
          <Chip tone="verde">AUTOGUARDADO</Chip>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setGuardado(true)
              setTimeout(() => setGuardado(false), 1600)
            }}
          >
            {guardado ? 'Guardado' : 'Guardar avance'}
          </button>
        </span>
      }
    >
      <div className="cec">
        <SideTabs
          items={BLOQUES_CEO.map((b) => ({ id: b.id, label: b.label }))}
          value={bloqueId}
          onChange={setBloque}
        />

        <div className="caja">
          <header className="caja-h">
            <span className="panel-t">PREGUNTAS DEL BLOQUE</span>
            <span className="muted">
              {respondidas} de {bloque.preguntas.length} respondidas
            </span>
          </header>

          {/* cada pregunta lleva su respuesta abierta, para releer la entrevista */}
          <ol className="preguntas abiertas">
            {bloque.preguntas.map((p, i) => {
              const clave = K.ceo(bloque.id, i)
              return (
                <li key={p} className={get(clave) ? 'ok' : ''}>
                  <div className="preg-row">
                    <span className="preg-n">{i + 1}</span>
                    <span className="preg-t">{p}</span>
                    {get(clave) && <span className="preg-ok" aria-label="respondida" />}
                  </div>
                  <Field k={clave} placeholder="Respuesta / notas / audio / transcripción" />
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </Panel>
  )
}
