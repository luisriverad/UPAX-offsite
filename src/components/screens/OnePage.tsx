import { CAMPOS_PROPUESTA } from '../../data/content'
import { COND_ROWS_DEFAULT, K, imperativos, indicadoresDe, listaDe } from '../../lib/model'
import { useStore } from '../../lib/store'

/**
 * La arquitectura de UPAX en la misma plantilla que los ejemplos de Walmart,
 * Toyota y WPP: propuesta de valor arriba, una columna por imperativo con su
 * bloque de cultura y su bloque de negocio, y los indicadores al cierre.
 *
 * Se arma con lo capturado, y lo que falta se declara como hueco en vez de
 * dejarse en blanco: una lámina que aparenta estar completa es peor que una
 * que enseña dónde falta trabajo.
 */

/** Un campo de texto libre puede traer varias ideas: se parten en viñetas. */
function vinetas(t: string): string[] {
  return t
    .split(/\n+|\s+·\s+|\s*;\s*/)
    .map((s) => s.trim().replace(/^[-•·]\s*/, ''))
    .filter(Boolean)
}

function Lista({ titulo, items }: { titulo: string; items: string[] }) {
  return (
    <div className="op-lista">
      <span className="op-mini">{titulo}</span>
      {items.length ? (
        <ul>
          {items.map((t, i) => (
            <li key={`${t}-${i}`}>{t}</li>
          ))}
        </ul>
      ) : (
        <p className="op-falta">Sin definir</p>
      )}
    </div>
  )
}

export default function OnePage() {
  const { values, get, num } = useStore()

  const imps = imperativos(values).filter((im) => im.nombre)
  const filas = num(K.condRows, COND_ROWS_DEFAULT)

  return (
    <article className="onepage">
      <header className="op-h">
        <h2>UPAX</h2>
        <div className="op-h-r">
          <span className="op-vibe">
            VIBE <em>Framework</em>
          </span>
          <span className="op-h-sub">
            <b>V</b>alue · <b>I</b>mperatives · <b>B</b>ehavior · <b>E</b>conomics
          </span>
        </div>
      </header>

      <p className="op-sec">
        <span className="op-letra">V</span> Propuesta de valor
      </p>
      <div className="op-pdv">
        {CAMPOS_PROPUESTA.map((c) => {
          const texto = get(K.pdv(c.id))
          return (
            <div key={c.id} className={`op-card ${c.destacado ? 'destacada' : ''}`}>
              <span className="op-mini">{c.tag}</span>
              {texto ? (
                <p className={c.destacado ? 'op-promesa' : 'op-txt'}>{c.destacado ? `“${texto}”` : texto}</p>
              ) : (
                <p className="op-falta">Sin definir</p>
              )}
            </div>
          )
        })}
      </div>

      <p className="op-sec">
        <span className="op-letra">I</span> Imperativos estratégicos
      </p>
      {imps.length === 0 ? (
        <div className="op-card">
          <p className="op-falta">Todavía no hay imperativos definidos. Sin ellos no hay columnas que construir.</p>
        </div>
      ) : (
        <div className="op-imps">
          {imps.map((im) => {
            const conductas = Array.from({ length: filas }, (_, r) => get(K.cond(im.i, r))).filter(Boolean)
            return (
              <section key={im.i} className="op-imp">
                <header className="op-imp-h">
                  <span className="op-num">{String(im.i + 1).padStart(2, '0')}</span>
                  <h3>{im.nombre}</h3>
                </header>

                <div className="op-card">
                  <span className="op-tag">
                    <span className="op-letra">B</span> Cultura
                  </span>
                  <Lista titulo="Cómo pensamos, decidimos y actuamos" items={conductas} />
                  <div className="op-dos">
                    <Lista titulo="Prácticas corporativas" items={vinetas(get(K.prac(im.i)))} />
                    <Lista titulo="Mecanismos de refuerzo" items={vinetas(get(K.mec(im.i)))} />
                  </div>
                </div>

                <div className="op-card">
                  <span className="op-tag">
                    <span className="op-letra">E</span> Negocio
                  </span>
                  <div className="op-estandar">
                    <span className="op-mini">Estándar</span>
                    {get(K.est(im.i)) ? <b>{get(K.est(im.i))}</b> : <p className="op-falta">Sin definir</p>}
                  </div>
                  <div className="op-dos">
                    <Lista titulo="Procesos críticos" items={listaDe(values, 'proc', im.i, true).map((x) => x.texto)} />
                    <Lista titulo="Políticas" items={listaDe(values, 'pol', im.i, true).map((x) => x.texto)} />
                  </div>

                  {/* los indicadores del imperativo, tal como se capturaron en la 09 */}
                  <div className="op-lista">
                    <span className="op-mini">Indicadores críticos</span>
                    {indicadoresDe(values, im.i, true).length ? (
                      <div className="op-inds">
                        {indicadoresDe(values, im.i, true).map((x) => (
                          <div key={x.r} className="op-ind">
                            <b>{x.nombre}</b>
                            <span className="op-ind-n">
                              {x.actual || '—'} <em>→ 2027</em> {x.meta || '—'}
                            </span>
                            <span className="op-ind-f">{x.fuente || 'sin fuente'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="op-falta">Sin indicadores definidos</p>
                    )}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      )}

      <footer className="op-pie">
        <span>Documento de trabajo · cada campo conserva fuente, autor, versión y decisión final.</span>
        <span className="op-marca">ONE-PAGE</span>
      </footer>
    </article>
  )
}
