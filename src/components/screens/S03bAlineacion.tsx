import { Fragment, useState } from 'react'
import { BLOQUES_CEO, DGS } from '../../data/content'
import { K, recorta, unidadDe } from '../../lib/model'
import { useStore } from '../../lib/store'
import type { ChipTone } from '../ui'
import { Chip, Field, PillTabs } from '../ui'
import DiamanteAlineacion from './DiamanteAlineacion'

/** Las tres lecturas posibles de una pregunta, del acuerdo al desacuerdo. */
const GRADOS: { id: string; label: string; tone: ChipTone }[] = [
  { id: 'alineado', label: 'Alineado', tone: 'verde' },
  { id: 'parcial', label: 'Parcial', tone: 'ambar' },
  { id: 'divergente', label: 'Divergente', tone: 'rojo' },
]

/** Las dos maneras de mirar la alineación: la figura del grupo y el cruce fino. */
const VISTAS = [
  { id: 'diamante', label: 'Diamante de alineación' },
  { id: 'cruce', label: 'CEO ↔ DGs, pregunta por pregunta' },
] as const

/**
 * El paso que faltaba entre levantar la evidencia y consolidarla. Primero la
 * figura: cuatro fuerzas calificadas de 0 a 10 enseñan por dónde se fuga el
 * resultado. Después el detalle: CEO y DGs contestan el mismo guion, así que se
 * compara respuesta contra respuesta y cada pregunta queda marcada con su grado
 * de alineación.
 */
export default function S03bAlineacion() {
  const { values, get, set } = useStore()
  const [vista, setVista] = useState<(typeof VISTAS)[number]['id']>('diamante')
  const [bloqueId, setBloque] = useState(BLOQUES_CEO[0].id)
  const [abierta, setAbierta] = useState<number | null>(null)

  const bloque = BLOQUES_CEO.find((b) => b.id === bloqueId) ?? BLOQUES_CEO[0]

  return (
    <section className="panel">
      <header className="panel-h">
        <PillTabs items={VISTAS.map((v) => ({ id: v.id, label: v.label }))} value={vista} onChange={setVista} />
      </header>

      {vista === 'diamante' ? (
        <DiamanteAlineacion />
      ) : (
        <>
          <header className="panel-h">
            <PillTabs
              label="Bloque:"
              items={BLOQUES_CEO.map((b) => ({ id: b.id, label: b.label }))}
              value={bloqueId}
              onChange={(id) => {
                setBloque(id)
                setAbierta(null)
              }}
            />
          </header>

          <table className="tabla">
            <thead>
              <tr>
                <th>Pregunta del guion</th>
                <th>CEO</th>
                <th>DGs</th>
                <th className="w-sintesis">Lectura de alineación</th>
              </tr>
            </thead>
            <tbody>
              {bloque.preguntas.map((pregunta, q) => {
                const ceo = get(K.ceo(bloque.id, q))
                const respuestas = DGS.map((d) => ({
                  d,
                  texto: get(K.dg(d, bloque.id, q)),
                })).filter((r) => r.texto)
                const grado = get(K.alinGrado(bloque.id, q))
                // solo se puede leer la alineación cuando hay las dos partes que comparar
                const comparable = Boolean(ceo) && respuestas.length > 0
                const activa = abierta === q

                return (
                  <Fragment key={q}>
                    <tr className={comparable && !grado ? 'alerta' : ''}>
                      <th scope="row">{pregunta}</th>
                      <td>{ceo ? recorta(ceo, 90) : <span className="muted">sin respuesta</span>}</td>
                      <td>
                        {respuestas.length > 0 ? (
                          <span className="alin-dgs">
                            <span className="dg-mix">
                              <b>{respuestas.length}</b> de {DGS.length}
                            </span>
                            <button type="button" className="btn" onClick={() => setAbierta(activa ? null : q)}>
                              {activa ? 'Ocultar' : 'Ver respuestas'}
                            </button>
                          </span>
                        ) : (
                          <span className="muted">sin respuestas</span>
                        )}
                      </td>
                      <td>
                        <div className="alin-lectura">
                          <div className="pills pills-sm">
                            {GRADOS.map((gr) => (
                              <button
                                key={gr.id}
                                type="button"
                                className={`pill-btn ${gr.id === grado ? 'on' : ''}`}
                                // volver a pulsar el grado marcado lo quita: marcar de más
                                // es tan fácil como marcar, y no debe costar deshacerlo
                                onClick={() => set(K.alinGrado(bloque.id, q), gr.id === grado ? '' : gr.id)}
                              >
                                {gr.label}
                              </button>
                            ))}
                            {!grado &&
                              (comparable ? <Chip tone="ambar">REVISAR</Chip> : <Chip tone="gris">PENDIENTE</Chip>)}
                          </div>
                          <Field
                            k={K.alinNota(bloque.id, q)}
                            placeholder="Dónde coinciden, dónde no y qué hay que resolver…"
                            rows={activa ? 3 : 1}
                          />
                        </div>
                      </td>
                    </tr>

                    {/* el detalle vive debajo de su pregunta: comparar exige leer el texto
                    completo de cada DG, no el recorte que cabe en la celda */}
                    {activa && (
                      <tr className="alin-detalle">
                        <td colSpan={4}>
                          <div className="alin-cruce">
                            <div className="alin-voz alin-voz-ceo">
                              <span className="alin-quien">CEO</span>
                              <p>{ceo || 'Sin respuesta capturada.'}</p>
                            </div>
                            {respuestas.map((r) => (
                              <div key={r.d} className="alin-voz">
                                <span className="alin-quien">{unidadDe(values, r.d)}</span>
                                <p>{r.texto}</p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </>
      )}
    </section>
  )
}
