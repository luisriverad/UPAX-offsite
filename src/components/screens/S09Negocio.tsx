import { useState } from 'react'
import { IND_DEFAULT, K, LISTA_DEFAULT, columnas, indicadoresDe, letraIndicador, listaDe } from '../../lib/model'
import type { Values } from '../../types'
import { useStore } from '../../lib/store'
import { Chip, Field, Foot, Line, PillTabs } from '../ui'
import type { ScreenProps } from './tipos'

/**
 * Negocio, un imperativo a la vez. Los cuatro bloques del Excel —estándares,
 * indicadores, procesos y políticas— viven juntos porque se leen juntos: un
 * estándar sin indicador que lo mida, o una política sin proceso que la
 * sostenga, solo se ven cuando están en la misma pantalla.
 */

/** Huecos entre los bloques ya capturados del imperativo que se está viendo. */
function huecos(v: Values, get: (k: string) => string, col: number): string[] {
  const avisos: string[] = []
  const procesos = listaDe(v, 'proc', col, true).length
  const politicas = listaDe(v, 'pol', col, true).length
  if (get(K.est(col)) && procesos === 0) avisos.push('Hay estándar, falta el proceso crítico que lo sostenga.')
  if (politicas > 0 && procesos === 0) avisos.push('Hay política, falta el proceso que la aterrice.')
  if (get(K.est(col)) && indicadoresDe(v, col, true).length === 0) {
    avisos.push('Hay estándar, pero ningún indicador que lo mida.')
  }
  indicadoresDe(v, col, true).forEach((x) => {
    if (!x.fuente) avisos.push(`Indicador “${x.nombre}”: sin fuente del dato.`)
    if (!x.meta) avisos.push(`Indicador “${x.nombre}”: sin meta 2027.`)
  })
  return avisos
}

/** Procesos y políticas: misma mecánica que los indicadores, un renglón por punto. */
function BloqueLista({
  cual,
  col,
  tono,
  titulo,
  placeholder,
  agregar,
}: {
  cual: 'proc' | 'pol'
  col: number
  tono: 'azul' | 'violeta'
  titulo: string
  placeholder: string
  agregar: string
}) {
  const { values, num, set } = useStore()
  const claveCount = cual === 'proc' ? K.procCount(col) : K.polCount(col)
  const clave = cual === 'proc' ? K.proc : K.pol
  const n = num(claveCount, LISTA_DEFAULT)
  const filas = listaDe(values, cual, col)
  const escritas = filas.filter((x) => x.texto).length

  return (
    <div className="foco-bloque">
      <span className="foco-bloque-h">
        <Chip tone={tono}>{titulo}</Chip>
        <span className="muted">
          {escritas} de {n} escritos
        </span>
      </span>

      <ol className="lista-renglones">
        {filas.map((x) => (
          <li key={x.r}>
            <span className="renglon-n">{String(x.r + 1).padStart(2, '0')}</span>
            <Line k={clave(col, x.r)} placeholder={placeholder} />
          </li>
        ))}
      </ol>

      <div className="caja-acciones">
        <button type="button" className="btn btn-ghost" disabled={n <= 1} onClick={() => set(claveCount, String(n - 1))}>
          − Quitar
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => set(claveCount, String(n + 1))}>
          {agregar}
        </button>
      </div>
    </div>
  )
}

export default function S09Negocio({ screen }: ScreenProps) {
  const { values, get, num, set } = useStore()
  const cols = columnas(values)
  const [col, setCol] = useState(0)

  // si en la 06 quitan imperativos, el seleccionado puede quedar fuera de rango
  const actual = cols.find((c) => c.i === col) ?? cols[0]
  if (!actual) return null

  const n = num(K.indCount(actual.i), IND_DEFAULT)
  const indicadores = indicadoresDe(values, actual.i)
  const conNombre = indicadores.filter((x) => x.nombre).length
  const avisos = huecos(values, get, actual.i)

  return (
    <section className="panel">
      <header className="panel-h">
        <PillTabs
          label="Imperativo:"
          size="sm"
          items={cols.map((c) => ({ id: String(c.i), label: c.texto ? `${c.i + 1}. ${c.texto}` : c.ordinal }))}
          value={String(actual.i)}
          onChange={(id) => setCol(Number(id))}
        />
      </header>

      <div className="caja imperativo-foco">
        <header className="foco-h">
          <span className="foco-n">{actual.ordinal}</span>
          {actual.texto ? (
            <h3 className="foco-t">{actual.texto}</h3>
          ) : (
            <p className="muted foco-t">Sin nombre todavía: se define en la pantalla de Imperativos.</p>
          )}
        </header>

        <div className="foco-bloque">
          <span className="foco-bloque-h">
            <Chip tone="oscuro">ESTÁNDARES</Chip>
            <span className="muted">uno por renglón</span>
          </span>
          <Field k={K.est(actual.i)} placeholder="Nivel de desempeño obligatorio, con su número…" rows={3} />
        </div>

        <div className="foco-bloque">
          <span className="foco-bloque-h">
            <Chip tone="naranja">INDICADORES CRÍTICOS</Chip>
            <span className="muted">
              {conNombre} de {n} con nombre
            </span>
          </span>

          <table className="tabla ind">
            <thead>
              <tr>
                <th>Indicador</th>
                <th className="w-num">Actual</th>
                <th className="w-num">2027</th>
                <th>Fuente</th>
              </tr>
            </thead>
            <tbody>
              {indicadores.map((x) => (
                <tr key={x.r}>
                  <td>
                    <Line k={K.ind(actual.i, x.r, 'nombre')} placeholder={`Indicador ${letraIndicador(x.r)}`} />
                  </td>
                  <td>
                    <Line k={K.ind(actual.i, x.r, 'actual')} placeholder="—" align="center" className="num actual" />
                  </td>
                  <td>
                    <Line k={K.ind(actual.i, x.r, 'meta')} placeholder="—" align="center" className="num meta" />
                  </td>
                  <td>
                    <Line k={K.ind(actual.i, x.r, 'fuente')} placeholder="Pendiente" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="caja-acciones">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={n <= 1}
              onClick={() => set(K.indCount(actual.i), String(n - 1))}
            >
              − Quitar
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => set(K.indCount(actual.i), String(n + 1))}>
              + Agregar indicador
            </button>
          </div>
        </div>

        <BloqueLista
          cual="proc"
          col={actual.i}
          tono="azul"
          titulo="PROCESOS CRÍTICOS"
          placeholder="Proceso que debe operar de forma excelente…"
          agregar="+ Agregar proceso crítico"
        />

        <BloqueLista
          cual="pol"
          col={actual.i}
          tono="violeta"
          titulo="POLÍTICAS"
          placeholder="Regla de decisión concreta, con su umbral…"
          agregar="+ Agregar política"
        />
      </div>

      <div className="validacion">
        <Chip tone="azul">VALIDACIÓN CRUZADA</Chip>
        {avisos.length === 0 ? (
          <span className="muted">Estándares, indicadores, procesos y políticas de este imperativo no muestran huecos.</span>
        ) : (
          <ul className="avisos">
            {avisos.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}
      </div>

      <Foot>{screen.foot}</Foot>
    </section>
  )
}
