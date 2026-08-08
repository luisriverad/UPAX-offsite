import { useRef, useState } from 'react'
import { ARCHIVOS_DG, BLOQUE_UNIDAD, BLOQUES_DG, DGS } from '../../data/content'
import { K, respuestasDeDG, unidadDe } from '../../lib/model'
import { guardarAdjunto, leerAdjunto, pesoLegible, revisarArchivos } from '../../lib/revisionArchivos'
import type { Revision } from '../../lib/revisionArchivos'
import { useStore } from '../../lib/store'
import { Field, Line, PillTabs } from '../ui'

export default function S03Dgs() {
  const { values, get, set } = useStore()
  const [dg, setDg] = useState(1)
  const [bloqueId, setBloque] = useState(BLOQUES_DG[0].id)
  const [revision, setRevision] = useState<Revision | null>(null)

  // mismo guion que el CEO: cuatro bloques, y se captura uno a la vez
  const bloque = BLOQUES_DG.find((b) => b.id === bloqueId) ?? BLOQUES_DG[0]

  // la pestaña lleva el nombre de la unidad, del catálogo o del campo
  const etiqueta = (d: number) => {
    const u = unidadDe(values, d)
    return u.length > 18 ? `${u.slice(0, 17)}…` : u
  }

  return (
    <section className="panel">
      <header className="panel-h">
        <PillTabs
          label="DGs"
          size="sm"
          items={DGS.map((d) => ({ id: String(d), label: etiqueta(d) }))}
          value={String(dg)}
          onChange={(id) => {
            setDg(Number(id))
            setRevision(null)
          }}
        />
      </header>

      <div className="identidad">
        <label>
          <span>Unidad de negocio</span>
          <Line k={K.dgUnidad(dg)} placeholder={unidadDe(values, dg)} />
        </label>
        <label>
          <span>Entrevistado</span>
          <Line k={K.dgPersona(dg)} placeholder="Nombre y puesto de quien contesta" />
        </label>
      </div>

      <div className="tres dgs">
        <div className="caja">
          <header className="caja-h">
            <span className="panel-t">MISMO GUION QUE EL CEO</span>
            <span className="muted">
              {respuestasDeDG(values, dg, bloque.id)} de {bloque.preguntas.length} respondidas
            </span>
          </header>

          <PillTabs
            size="sm"
            items={BLOQUES_DG.map((b) => ({ id: b.id, label: b.label }))}
            value={bloqueId}
            onChange={setBloque}
          />

          <ol className="preguntas num">
            {bloque.preguntas.map((p, i) => (
              <li key={p}>
                <div className="preg-row">
                  <span className="preg-n plano">{i + 1}.</span>
                  <span className="preg-t">{p}</span>
                </div>
                <Field k={K.dg(dg, bloque.id, i)} placeholder="Respuesta / notas…" />
              </li>
            ))}
          </ol>
        </div>

        {/* lo que solo el DG puede contestar: el CEO no responde este bloque */}
        <div className="caja">
          <header className="caja-h">
            <span className="panel-t">SOLO DE ESTA UNIDAD</span>
            <span className="muted">
              {respuestasDeDG(values, dg, BLOQUE_UNIDAD.id)} de {BLOQUE_UNIDAD.preguntas.length} respondidas
            </span>
          </header>

          <ol className="preguntas num">
            {BLOQUE_UNIDAD.preguntas.map((p, i) => (
              <li key={p}>
                <div className="preg-row">
                  <span className="preg-n plano">{i + 1}.</span>
                  <span className="preg-t">{p}</span>
                </div>
                <Field k={K.dg(dg, BLOQUE_UNIDAD.id, i)} placeholder="Respuesta / notas…" />
              </li>
            ))}
          </ol>
        </div>

        <div className="caja">
          <span className="panel-t">ARCHIVOS A PEDIR</span>
          <ul className="archivos">
            {ARCHIVOS_DG.map((pedido, i) => (
              <FilaArchivo
                key={pedido.nombre}
                nombre={pedido.nombre}
                detalle={pedido.detalle}
                bruto={get(K.dgArch(dg, i))}
                onCambio={(valor) => {
                  set(K.dgArch(dg, i), valor)
                  setRevision(null)
                }}
              />
            ))}
          </ul>

          <div className="archivos-foot">
            <button type="button" className="btn btn-dark" onClick={() => setRevision(revisarArchivos(values, dg))}>
              Revisar archivos
            </button>
          </div>

          {revision && <Diagnostico revision={revision} />}
        </div>
      </div>
    </section>
  )
}

function Diagnostico({ revision }: { revision: Revision }) {
  const faltan = revision.avisos.filter((a) => a.nivel === 'falta')
  const revisar = revision.avisos.filter((a) => a.nivel === 'revisar')
  const bien = revision.avisos.filter((a) => a.nivel === 'ok')

  return (
    <div className="diag">
      <p className="diag-lead">
        {revision.entregados} de {revision.total} archivos entregados
        {faltan.length + revisar.length === 0 && ' · todo en orden'}
      </p>

      {[...faltan, ...revisar, ...bien].map((a) => (
        <div key={`${a.nivel}-${a.titulo}`} className={`diag-fila ${a.nivel}`}>
          <span className="diag-marca" aria-hidden="true" />
          <div>
            <b>{a.titulo}</b>
            <p>{a.detalle}</p>
          </div>
        </div>
      ))}

      {revision.sinEntregar.length > 0 && (
        <p className="diag-otros">Sin un solo archivo: {revision.sinEntregar.join(', ')}.</p>
      )}

      <p className="diag-nota">
        La revisión mira nombre, formato y peso del archivo, no su contenido. Sirve para cachar huecos y archivos mal
        colocados; leer lo que dicen adentro sigue siendo trabajo humano.
      </p>
    </div>
  )
}

function FilaArchivo({
  nombre,
  detalle,
  bruto,
  onCambio,
}: {
  nombre: string
  detalle: string
  bruto: string
  onCambio: (valor: string) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const adjunto = leerAdjunto(bruto)

  return (
    <li className={`archivo ${adjunto ? 'ok' : ''}`}>
      <button
        type="button"
        className="mas"
        onClick={() => (adjunto ? onCambio('') : input.current?.click())}
        title={adjunto ? 'Quitar archivo' : 'Adjuntar archivo'}
      >
        {adjunto ? '×' : '+'}
      </button>
      <span className="archivo-t">
        {nombre}
        <em className="archivo-d">{detalle}</em>
        {adjunto && (
          <em className="archivo-n">
            {adjunto.nombre}
            {adjunto.bytes ? ` · ${pesoLegible(adjunto.bytes)}` : ''}
          </em>
        )}
      </span>
      <input
        ref={input}
        type="file"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onCambio(guardarAdjunto({ nombre: f.name, bytes: f.size, tipo: f.type }))
          e.target.value = ''
        }}
      />
    </li>
  )
}
