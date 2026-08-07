import { IND_DEFAULT, K, columnas } from '../../lib/model'
import { useStore } from '../../lib/store'
import { Chip } from '../ui'
import ParPaneles from './ParPaneles'

/** Huecos que la plataforma detecta entre los bloques ya capturados. */
function huecos(
  get: (k: string) => string,
  num: (k: string, d: number) => number,
  cols: { i: number; label: string; nombrado: boolean }[],
) {
  const avisos: string[] = []
  cols.forEach((c) => {
    // las columnas sin imperativo escrito todavía no tienen nada que contrastar
    if (!c.nombrado) return
    if (get(K.prac(c.i)) && !get(K.mec(c.i))) avisos.push(`${c.label}: hay práctica, falta mecanismo de refuerzo.`)
    if (get(K.pol(c.i)) && !get(K.proc(c.i))) avisos.push(`${c.label}: hay política, falta proceso que la sostenga.`)
    if (get(K.est(c.i)) && !get(K.proc(c.i))) avisos.push(`${c.label}: hay estándar, falta proceso crítico.`)
  })
  const n = num(K.indCount, IND_DEFAULT)
  for (let r = 0; r < n; r++) {
    const nombre = get(K.ind(r, 'nombre'))
    if (nombre && !get(K.ind(r, 'fuente'))) avisos.push(`Indicador “${nombre}”: sin fuente.`)
  }
  return avisos
}

export default function S10Procesos() {
  const { values, get, num } = useStore()
  const avisos = huecos(get, num, columnas(values))

  return (
    <ParPaneles
      izq={{ titulo: 'PROCESOS CRÍTICOS', key: K.proc, placeholder: 'Proceso que debe operar de forma excelente…' }}
      der={{ titulo: 'POLÍTICAS', key: K.pol, placeholder: 'Regla de decisión concreta…' }}
      pie={
        <div className="validacion">
          <Chip tone="azul">VALIDACIÓN CRUZADA</Chip>
          {avisos.length === 0 ? (
            <span className="muted">Políticas, procesos, indicadores y prácticas no muestran huecos ni contradicciones.</span>
          ) : (
            <ul className="avisos">
              {avisos.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
        </div>
      }
    />
  )
}
