import { useEffect, useState } from 'react'
import { UNIDADES } from '../../data/content'
import { sinAtribucion } from '../../lib/atribucion'
import { ErrorIA, calificarDiamante } from '../../lib/ia'
import { K } from '../../lib/model'
import { useStore } from '../../lib/store'
import type { Values } from '../../types'

/**
 * Diamante de Alineación: cuatro fuerzas —estrategia, oferta, gente y
 * procesos— calificadas de 0 a 10. La figura es el diagnóstico: pareja
 * significa que la empresa jala hacia el mismo lado; chueca enseña por dónde
 * se fuga el resultado. Se califica evidencia, no intención.
 */

export const EJES = [
  {
    id: 'est',
    dir: 'Arriba',
    name: 'Estrategia',
    q: '¿Hay un rumbo claro, decidido y vigente? ¿La dirección sabe a qué le dice que no?',
  },
  {
    id: 'ofe',
    dir: 'Derecha',
    name: 'Oferta',
    q: '¿Los productos y servicios resuelven algo que el cliente sí valora y paga? ¿Se diferencian?',
  },
  {
    id: 'gen',
    dir: 'Abajo',
    name: 'Gente (equipo de trabajo)',
    q: '¿El equipo tiene la capacidad, la información y las ganas para ejecutar lo que se decidió?',
  },
  {
    id: 'pro',
    dir: 'Izquierda',
    name: 'Procesos',
    q: '¿La operación entrega con consistencia, sin depender del héroe de turno? ¿Está documentada y medida?',
  },
] as const

type EjeId = (typeof EJES)[number]['id']
type Puntajes = Record<EjeId, number>

/** centro del plano, y cuántos píxeles vale un punto de la escala */
const CX = 310
const CY = 250
const UNIT = 16

/** de dónde cuelga la cifra de cada punta, para que no pise la figura */
const VOFF: Record<EjeId, [number, number]> = {
  est: [13, -2],
  gen: [13, 12],
  ofe: [5, -13],
  pro: [-5, -13],
}

const TICKS = [2, 4, 6, 8, 10]
const tono = (v: number) => (v >= 8 ? 'good' : v >= 5 ? 'warn' : 'crit')

export interface Hallazgo {
  tono: 'good' | 'warn' | 'crit'
  titulo: string
  detalle: string
}

const REMEDIOS: Record<string, string> = {
  Estrategia: 'Define en una página: a quién sí, a quién no, y las tres apuestas del año.',
  Oferta: 'Revisa margen y diferenciación producto por producto, y concentra el esfuerzo en lo que gana o posiciona.',
  Gente: 'Aclara responsabilidades y métricas por puesto, y cubre la brecha de capacidad con capacitación o con un ajuste de equipo.',
  Procesos: 'Documenta y mide el proceso que toca al cliente, que es donde el estado de resultados alcanza a ver la diferencia.',
}

/**
 * La lectura del diamante no es el promedio: son los desniveles. Un eje alto
 * frente a su opuesto es una fuga con nombre, y por eso cada brecha de 3 o más
 * puntos tiene su propio diagnóstico.
 */
export function hallazgos(s: Puntajes): Hallazgo[] {
  const { est: e, ofe: o, gen: g, pro: p } = s
  const out: Hallazgo[] = []
  const vert = e - g
  const horz = o - p

  if (vert >= 3)
    out.push({
      tono: 'crit',
      titulo: 'Estrategia que todavía no baja al piso',
      detalle: `Arriba hay claridad (${e}) que el equipo todavía no alcanza (${g}), así que el plan se queda en la mesa de dirección y abajo se resuelve sobre la marcha. Traducir la estrategia a metas por persona es el paso que falta antes de decidir algo nuevo.`,
    })
  if (vert <= -3)
    out.push({
      tono: 'warn',
      titulo: 'Equipo esperando rumbo',
      detalle: `Hay gente capaz (${g}) sin una estrategia que la ordene (${e}), así que se trabaja mucho y se avanza menos de lo que se podría porque cada quien elige su prioridad. Lo que destraba esto es una decisión de dirección, no más talento.`,
    })
  if (horz >= 3)
    out.push({
      tono: 'crit',
      titulo: 'Promesa por delante de la operación',
      detalle: `La oferta vale (${o}) y los procesos todavía no la sostienen (${p}), de manera que se vende mejor de lo que hoy se entrega y ahí aparecen los reprocesos y el margen que se queda en el camino. Cerrar esa distancia antes de crecer sale más barato que cerrarla después.`,
    })
  if (horz <= -3)
    out.push({
      tono: 'warn',
      titulo: 'Orden operativo sin diferencia clara',
      detalle: `Se opera con orden (${p}) una oferta que todavía no destaca (${o}), y con esa combinación la competencia termina siendo por precio. La palanca está en el producto y su propuesta de valor, no en más eficiencia.`,
    })

  const arr: [string, number][] = [
    ['Estrategia', e],
    ['Oferta', o],
    ['Gente', g],
    ['Procesos', p],
  ]
  const min = [...arr].sort((a, b) => a[1] - b[1])[0]
  const max = [...arr].sort((a, b) => b[1] - a[1])[0]
  out.push({
    tono: tono(min[1]),
    titulo: `El eje que más limita hoy: ${min[0]} (${min[1]})`,
    detalle: `La figura se cierra por aquí, y ningún eje rinde más que el más bajo, así que ${max[0]} en ${max[1]} no compensa a ${min[0]} en ${min[1]}. ${REMEDIOS[min[0]]}`,
  })

  if (Math.abs(vert) <= 2 && Math.abs(horz) <= 2 && min[1] >= 7)
    out.push({
      tono: 'good',
      titulo: 'Diamante parejo y alto',
      detalle:
        'Los cuatro ejes se sostienen entre sí. El riesgo aquí ya no es la alineación sino la complacencia: define la siguiente ambición antes de que la figura se acomode sola.',
    })

  return out
}

/** Superficie del diamante contra el máximo posible, en porcentaje. */
export function nivelAlineacion(s: Puntajes): number {
  const { est: e, ofe: o, gen: g, pro: p } = s
  return Math.round((0.5 * (e * o + o * g + g * p + p * e)) / 2) // el máximo son 200
}

/**
 * Los nombres de las unidades tal como se llaman hoy. Se leen del mismo lugar
 * que el resto de la captura para poder taparlos en el texto que ya se guardó
 * antes de que existiera la regla de atribución.
 */
function nombresUnidad(get: (k: string) => string): string[] {
  return UNIDADES.map((u) => get(K.dgUnidad(u.id)) || u.nombre)
}

export function puntajes(get: (k: string) => string): Puntajes {
  const leer = (id: EjeId) => {
    const v = parseInt(get(K.dia(id)), 10)
    return Number.isFinite(v) ? Math.min(10, Math.max(0, v)) : 5
  }
  return {
    est: leer('est'),
    ofe: leer('ofe'),
    gen: leer('gen'),
    pro: leer('pro'),
  }
}

/** El mismo diagnóstico en texto plano, para pegarlo en una minuta o un correo. */
export function resumenDiamante(get: (k: string) => string): string {
  const s = puntajes(get)
  const nombres = nombresUnidad(get)
  const generico = (t: string) => sinAtribucion(t, nombres)
  const promedio = ((s.est + s.ofe + s.gen + s.pro) / 4).toFixed(1)
  const desbalance = Math.max(s.est, s.ofe, s.gen, s.pro) - Math.min(s.est, s.ofe, s.gen, s.pro)
  const lineas = [
    'DIAMANTE DE ALINEACIÓN',
    '',
    ...EJES.map((a) => {
      const sustento = generico(get(K.diaSustento(a.id)))
      return `${a.name} (${a.dir.toLowerCase()}): ${s[a.id]}/10${sustento ? ` — ${sustento}` : ''}`
    }),
    '',
    `Nivel de alineación: ${nivelAlineacion(s)}%   |   Promedio: ${promedio}   |   Desbalance: ${desbalance}`,
    '',
  ]
  const lectura = generico(get(K.diaLectura))
  if (lectura) lineas.push(lectura, '')
  hallazgos(s).forEach((h) => lineas.push(`• ${h.titulo} — ${h.detalle}`))
  return lineas.join('\n')
}

export default function DiamanteAlineacion() {
  const { values, get, set, setMany } = useStore()
  const [aviso, setAviso] = useState('')
  const [pensando, setPensando] = useState(false)
  const [seg, setSeg] = useState(0)
  const s = puntajes(get)
  // se tapa al leer, no solo al escribir: lo calificado antes de la regla
  // también circula sin nombres
  const nombres = nombresUnidad(get)
  const generico = (t: string) => sinAtribucion(t, nombres)
  const lectura = generico(get(K.diaLectura))

  function avisar(t: string) {
    setAviso(t)
    setTimeout(() => setAviso((a) => (a === t ? '' : a)), 2600)
  }

  // la llamada tarda decenas de segundos: sin contador la pantalla parece colgada
  useEffect(() => {
    if (!pensando) return
    setSeg(0)
    const t = setInterval(() => setSeg((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [pensando])

  // al exportar, la hoja se aísla del resto de la aplicación; hay que devolverla
  // a su sitio al terminar, se haya impreso o se haya cancelado
  useEffect(() => {
    const limpiar = () => document.body.classList.remove('solo-diamante')
    window.addEventListener('afterprint', limpiar)
    return () => {
      window.removeEventListener('afterprint', limpiar)
      limpiar()
    }
  }, [])

  /** La hoja completa —figura, ejes con su sustento y lectura— en una sola página. */
  function exportarPdf() {
    document.body.classList.add('solo-diamante')
    window.print()
  }

  /**
   * El modelo lee todo lo capturado en la plataforma y mueve los cuatro ejes con
   * su sustento. Es un punto de partida para la mesa, no un veredicto: los
   * deslizadores siguen mandando y cualquiera puede corregir el número.
   */
  async function autoAnalisis() {
    setAviso('')
    setPensando(true)
    try {
      const r = await calificarDiamante(values)
      const patch: Values = { [K.diaLectura]: r.lectura }
      EJES.forEach((a) => {
        patch[K.dia(a.id)] = String(r.ejes[a.id].puntaje)
        patch[K.diaSustento(a.id)] = r.ejes[a.id].sustento
      })
      setMany(patch)
      avisar('Calificado con toda la información de la plataforma.')
    } catch (e) {
      setAviso(e instanceof ErrorIA ? e.message : 'No se pudo consultar al modelo.')
    } finally {
      setPensando(false)
    }
  }

  const P: Record<EjeId, [number, number]> = {
    est: [CX, CY - s.est * UNIT],
    ofe: [CX + s.ofe * UNIT, CY],
    gen: [CX, CY + s.gen * UNIT],
    pro: [CX - s.pro * UNIT, CY],
  }

  const pct = nivelAlineacion(s)
  const promedio = (s.est + s.ofe + s.gen + s.pro) / 4
  const desbalance = Math.max(s.est, s.ofe, s.gen, s.pro) - Math.min(s.est, s.ofe, s.gen, s.pro)

  // el color mantiene la urgencia; las palabras describen una etapa, no dictan
  // una sentencia. Un veredicto que suena a condena se discute como insulto
  const veredicto =
    pct >= 75 && desbalance <= 2
      ? {
          tono: 'verde' as const,
          label: 'Alineada',
          nota: 'Los cuatro ejes se sostienen entre sí. Cuida que no se afloje.',
        }
      : pct >= 55
        ? {
            tono: 'ambar' as const,
            label: 'Alineación parcial',
            nota: 'La operación funciona y hay margen recuperable en las juntas entre un eje y otro.',
          }
        : pct >= 30
          ? {
              tono: 'rojo' as const,
              label: 'Alineación despareja',
              nota: 'Los ejes avanzan a distinto ritmo, y esa diferencia se alcanza a ver en margen, en rotación o en reprocesos.',
            }
          : {
              tono: 'rojo' as const,
              label: 'Alineación por construir',
              nota: 'Hoy el resultado se sostiene más en el esfuerzo de cada quien que en el sistema. Ahí está la palanca más grande.',
            }

  return (
    <div className="dia">
      {/* membrete: solo aparece en el PDF, donde la hoja circula sin la aplicación */}
      <header className="dia-print-h">
        <img className="dia-print-logo" src="/logo-upax.png" alt="Grupo UPAX" />
        <div>
          <h2>Diamante de alineación</h2>
          <p>
            Estrategia · Oferta · Gente · Procesos — {new Date().toLocaleDateString('es-MX', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </header>

      <div className="dia-cols">
        <section className="caja dia-plot">
          <header className="caja-h">
            <span className="panel-t">Figura resultante</span>
          </header>

          <svg className="plot" viewBox="0 0 620 500" role="img" aria-labelledby="diaTitulo">
            <title id="diaTitulo">
              Diamante de alineación: estrategia, oferta, gente y procesos calificados de 0 a 10
            </title>

            {/* anillos: un diamante por cada dos puntos de la escala */}
            <polygon className="ring" points="310,218 342,250 310,282 278,250" />
            <polygon className="ring" points="310,186 374,250 310,314 246,250" />
            <polygon className="ring major" points="310,154 406,250 310,346 214,250" />
            <polygon className="ring" points="310,122 438,250 310,378 182,250" />
            <polygon className="ring major" points="310,90 470,250 310,410 150,250" />

            <line className="ax-line" x1="310" y1="90" x2="310" y2="410" />
            <line className="ax-line" x1="150" y1="250" x2="470" y2="250" />

            <g className="tick-mark">
              {TICKS.map((t) => {
                const d = (t / 2) * 32
                return (
                  <g key={t}>
                    <line x1="305" y1={CY - d} x2="315" y2={CY - d} />
                    <line x1="305" y1={CY + d} x2="315" y2={CY + d} />
                    <line x1={CX + d} y1="245" x2={CX + d} y2="255" />
                    <line x1={CX - d} y1="245" x2={CX - d} y2="255" />
                  </g>
                )
              })}
            </g>

            {/* la escala se numera hacia afuera en los cuatro sentidos */}
            {TICKS.map((t) => {
              const d = (t / 2) * 32
              return (
                <g key={t}>
                  <text className="tick v" x="298" y={CY - d}>
                    {t}
                  </text>
                  <text className="tick v" x="298" y={CY + d}>
                    {t}
                  </text>
                  <text className="tick h" x={CX + d} y="268">
                    {t}
                  </text>
                  <text className="tick h" x={CX - d} y="268">
                    {t}
                  </text>
                </g>
              )
            })}

            <polygon className="kite" points={[P.est, P.ofe, P.gen, P.pro].map((p) => p.join(',')).join(' ')} />
            {EJES.map((a) => (
              <circle key={a.id} className="node" cx={P[a.id][0]} cy={P[a.id][1]} r="5" />
            ))}

            {/* la cifra viaja con su punta, no con el eje */}
            <text className="axis-val v" x={P.est[0] + VOFF.est[0]} y={P.est[1] + VOFF.est[1]}>
              {s.est}
            </text>
            <text className="axis-val v" x={P.gen[0] + VOFF.gen[0]} y={P.gen[1] + VOFF.gen[1]}>
              {s.gen}
            </text>
            <text className="axis-val r" x={P.ofe[0] + VOFF.ofe[0]} y={P.ofe[1] + VOFF.ofe[1]}>
              {s.ofe}
            </text>
            <text className="axis-val l" x={P.pro[0] + VOFF.pro[0]} y={P.pro[1] + VOFF.pro[1]}>
              {s.pro}
            </text>

            <text className="axis-label" x="310" y="46">
              Estrategia
            </text>
            <text className="axis-sub" x="310" y="64">
              rumbo · foco · decisiones
            </text>
            <text className="axis-label" x="310" y="452">
              Gente
            </text>
            <text className="axis-sub" x="310" y="470">
              equipo de trabajo
            </text>
            <text className="axis-label" x="72" y="244">
              Procesos
            </text>
            <text className="axis-sub" x="72" y="262">
              cómo se opera
            </text>
            <text className="axis-label" x="548" y="244">
              Oferta
            </text>
            <text className="axis-sub" x="548" y="262">
              productos y servicios
            </text>
          </svg>

          <div className="dia-legend">
            <span>0 = centro (muy bajo)</span>
            <span>10 = borde (muy alto)</span>
            <span>Figura pareja = alineación</span>
          </div>
        </section>

        <section className={`caja dia-ejes ${pensando ? 'esperando' : ''}`}>
          <header className="caja-h">
            <span className="panel-t">Calificación por eje</span>
            <span className="dia-auto">
              {aviso && <span className="dia-aviso">{aviso}</span>}
              <button type="button" className="btn btn-orange" disabled={pensando} onClick={autoAnalisis}>
                {pensando ? `Analizando… ${seg}s` : 'AUTO-ANÁLISIS'}
              </button>
            </span>
          </header>

          {EJES.map((a) => (
            <div key={a.id} className="dia-eje">
              <div className="dia-eje-h">
                <span className="dia-eje-n">
                  {a.name} <span className="dia-dir">{a.dir}</span>
                </span>
                <span className="dia-score">{s[a.id]}</span>
              </div>
              <p className="dia-q">{a.q}</p>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={s[a.id]}
                aria-label={`${a.name}, de 0 a 10`}
                onChange={(e) => set(K.dia(a.id), e.target.value)}
              />
              {/* el deslizador es de pantalla; en papel el mismo dato va como barra */}
              <div className="dia-barra" aria-hidden="true">
                <i style={{ width: `${s[a.id] * 10}%` }} />
              </div>
              <div className="dia-escala">
                <span>0 · Muy bajo</span>
                <span>5</span>
                <span>10 · Muy alto</span>
              </div>
              {/* por qué ese número: solo aparece cuando el auto-análisis lo escribió */}
              {get(K.diaSustento(a.id)) && <p className="dia-sustento">{generico(get(K.diaSustento(a.id)))}</p>}
            </div>
          ))}
        </section>
      </div>

      <section className="caja dia-lectura">
        <header className="caja-h">
          <span className="panel-t">Lectura del diamante</span>
        </header>

        <div className="dia-stats">
          <div className="dia-stat">
            <span className="k">Nivel de alineación</span>
            <span className="v">
              {pct}
              <em>%</em>
            </span>
            <span className="n">Superficie del diamante contra el máximo posible.</span>
          </div>
          <div className="dia-stat">
            <span className="k">Promedio de los ejes</span>
            <span className="v">{promedio.toFixed(1)}</span>
            <span className="n">Qué tan alto está el conjunto, sin ver el balance.</span>
          </div>
          <div className="dia-stat">
            <span className="k">Desbalance</span>
            <span className="v">{desbalance}</span>
            <span className="n">Distancia entre el eje más fuerte y el más débil.</span>
          </div>
          <div className="dia-stat">
            <span className="k">Diagnóstico</span>
            <span className={`dia-pill t-${veredicto.tono}`}>{veredicto.label}</span>
            <span className="n">{veredicto.nota}</span>
          </div>
        </div>

        {lectura && (
          <p className="dia-veredicto">
            <span className="k">Lectura del auto-análisis</span>
            {lectura}
          </p>
        )}

        <ul className="dia-hallazgos">
          {hallazgos(s).map((h) => (
            <li key={h.titulo} className={`t-${h.tono}`}>
              <span className="bar" />
              <span className="cuerpo">
                <span className="t">{h.titulo}</span>
                <span className="d">{h.detalle}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="dia-acciones">
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => {
              navigator.clipboard?.writeText(resumenDiamante(get)).then(
                () => avisar('Resumen copiado.'),
                () => avisar('No se pudo copiar aquí.'),
              )
            }}
          >
            Copiar resumen
          </button>
          <button type="button" className="btn btn-ghost" onClick={exportarPdf}>
            Exportar a PDF
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setMany({
                ...Object.fromEntries(
                  EJES.flatMap((a) => [
                    [K.dia(a.id), '5'],
                    [K.diaSustento(a.id), ''],
                  ]),
                ),
                [K.diaLectura]: '',
              })
              avisar('Ejes en 5.')
            }}
          >
            Reiniciar en 5
          </button>
          <span className="muted" aria-live="polite">
            {aviso}
          </span>
        </div>
      </section>

      <div className="dia-guias">
        <div>
          <span className="k">Cómo calificar</span>
          <p>
            Califica evidencia, no intención. Un 8 exige que puedas nombrar el hecho que lo sostiene; si solo tienes la
            sensación, es 5.
          </p>
        </div>
        <div>
          <span className="k">Quién califica</span>
          <p>
            Lo más útil es que dirección y equipo lo llenen por separado. La diferencia entre las dos figuras suele ser
            el hallazgo.
          </p>
        </div>
        <div>
          <span className="k">Qué sigue</span>
          <p>
            Trabaja el eje más bajo durante un trimestre. Subir el eje débil mueve la figura más que reforzar el que ya
            es fuerte.
          </p>
        </div>
      </div>
    </div>
  )
}
