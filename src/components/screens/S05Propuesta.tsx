import { useState } from 'react'
import { CAMPOS_PROPUESTA } from '../../data/content'
import { K, archivosCargados, respuestasCeo, respuestasDG } from '../../lib/model'
import { MOLDES_PDV } from '../../lib/redaccionPdv'
import { useStore } from '../../lib/store'
import { Chip, Field, Foot } from '../ui'
import type { ScreenProps } from './tipos'

export default function S05Propuesta({ screen }: ScreenProps) {
  const { values, get } = useStore()
  const [abierto, setAbierto] = useState<string | null>(null)

  const respuestas = respuestasCeo(values) + respuestasDG(values)
  const archivos = archivosCargados(values)

  return (
    <section className="panel">
      <div className="tres">
        {CAMPOS_PROPUESTA.map((c) => {
          const texto = get(K.pdv(c.id))
          const estado = get(K.pdvEstado(c.id))
          const editando = abierto === c.id
          // mientras nadie lo toque, lo que se ve es la síntesis que dejó el Pre-evento
          const heredado = Boolean(texto) && texto === get(K.cons('pdv', c.id))
          return (
            <article key={c.id} className={`tarjeta ${c.destacado ? 'destacada' : ''}`}>
              <Chip tone={c.destacado ? 'naranja' : 'gris'}>{c.tag}</Chip>

              <h3 className={texto ? 'lleno' : ''}>{texto || c.titulo}</h3>
              <p className="tarjeta-hint">{c.hint}</p>

              <hr />

              <p className="tarjeta-meta">
                {respuestas} respuestas · {archivos} archivos
              </p>
              <p className={`tarjeta-estado ${c.destacado ? 'naranja' : ''}`}>
                {estado === 'aprobado'
                  ? 'Aprobada en Off-Site'
                  : heredado
                    ? 'Heredado del Consolidado · editable'
                    : 'Borrador editable'}
              </p>

              {editando && (
                <Field k={K.pdv(c.id)} placeholder={MOLDES_PDV[c.id]?.placeholder ?? 'Escribe la definición…'} rows={3} />
              )}

              <button type="button" className="btn btn-ghost" onClick={() => setAbierto(editando ? null : c.id)}>
                {editando ? 'Cerrar' : 'Abrir y editar'}
              </button>
            </article>
          )
        })}
      </div>

      <Foot>{screen.foot}</Foot>
    </section>
  )
}
