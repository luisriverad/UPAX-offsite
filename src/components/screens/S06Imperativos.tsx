import { BLOQUES_CEO, DGS } from '../../data/content'
import { IMP_DEFAULT, K, imperativos } from '../../lib/model'
import { useStore } from '../../lib/store'
import { Chip, Foot, Line, Panel } from '../ui'
import type { ScreenProps } from './tipos'

/** Índice de la pregunta sobre imperativos en el guion de los DGs. */
const PREGUNTA_IMP_DG = 3

export default function S06Imperativos({ screen }: ScreenProps) {
  const { values, get, num, set } = useStore()
  const imps = imperativos(values)
  const n = num(K.impCount, IMP_DEFAULT)

  const bloqueImp = BLOQUES_CEO.find((b) => b.id === 'imp')
  const fuentes =
    (bloqueImp?.preguntas.filter((_, q) => get(K.ceo('imp', q))).length ?? 0) +
    DGS.filter((d) => get(K.dg(d, PREGUNTA_IMP_DG))).length

  return (
    <Panel
      title="IMPERATIVOS DE TRABAJO"
      right={
        <span className="panel-right">
          <button type="button" className="btn btn-ghost" disabled={n <= 1} onClick={() => set(K.impCount, String(n - 1))}>
            − Quitar
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => set(K.impCount, String(n + 1))}>
            + Agregar
          </button>
        </span>
      }
    >
      <ol className="imps">
        {imps.map((im) => {
          const completo = Boolean(im.nombre && im.corto)
          return (
            <li key={im.i} className={`imp ${im.nombre ? 'activo' : ''}`}>
              <span className="imp-n">{String(im.i + 1).padStart(2, '0')}</span>
              <Line k={K.impNombre(im.i)} placeholder={`Imperativo ${im.i + 1}`} className="imp-nombre" />
              <Line k={K.impCorto(im.i)} placeholder="Nombre corto" className="imp-corto" />
              <span className="imp-ev muted">Evidencia: {fuentes} fuentes</span>
              {completo ? (
                <Chip tone="verde">APROBADO</Chip>
              ) : im.nombre ? (
                <Chip tone="ambar">REVISAR</Chip>
              ) : (
                <Chip tone="rojo">SIN DEFINIR</Chip>
              )}
            </li>
          )
        })}
      </ol>

      <Foot>{screen.foot}</Foot>
    </Panel>
  )
}
