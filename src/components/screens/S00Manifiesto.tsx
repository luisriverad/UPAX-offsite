import { IMPERATIVOS_MANIFIESTO, PDV_MANIFIESTO } from '../../data/manifiesto'

/**
 * El modelo VIBE de UPAX, ya trabajado, en la misma plantilla que los one-page
 * de referencia: propuesta de valor arriba y una columna por imperativo con su
 * bloque de cultura y su bloque de negocio.
 *
 * Es pantalla de lectura: no lleva un solo control. Lo que hace es enseñar cómo
 * lo que el grupo ya decidió baja al modelo, campo por campo.
 */

function Lista({ titulo, items }: { titulo: string; items: string[] }) {
  return (
    <div className="op-lista">
      <span className="op-mini">{titulo}</span>
      <ul>
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  )
}

export default function S00Manifiesto() {
  return (
    <article className="manifiesto">
      <header className="op-h">
        <img className="op-logo" src="/logo-upax.png" alt="Grupo UPAX" />
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
        {PDV_MANIFIESTO.map((c) => (
          <div key={c.tag} className={`op-card ${c.destacado ? 'destacada' : ''}`}>
            <span className="op-mini">{c.tag}</span>
            <p className={c.destacado ? 'op-promesa' : 'op-txt'}>{c.destacado ? `“${c.texto}”` : c.texto}</p>
          </div>
        ))}
      </div>

      <p className="op-sec">
        <span className="op-letra">I</span> Imperativos estratégicos
      </p>
      <div className="op-imps">
        {IMPERATIVOS_MANIFIESTO.map((im) => (
          <section key={im.num} className="op-imp">
            <header className="op-imp-h">
              <span className="op-num">{im.num}</span>
              <div className="mf-imp-t">
                <h3>{im.nombre}</h3>
                <span className="mf-bajada">{im.bajada}</span>
              </div>
            </header>

            <div className="op-card">
              <span className="op-tag">
                <span className="op-letra">B</span> Cultura
              </span>

              <span className="op-mini">Cómo pensamos, decidimos y actuamos</span>
              <p className="mf-entrada">{im.cultura.entrada}</p>
              <dl className="mf-rasgos">
                {im.cultura.rasgos.map((r) => (
                  <div key={r.nombre} className="mf-rasgo">
                    <dt>{r.nombre}</dt>
                    <dd>{r.texto}</dd>
                  </div>
                ))}
              </dl>
              {im.cultura.nota && <p className="mf-nota">{im.cultura.nota}</p>}

              <div className="op-dos">
                <Lista titulo="Prácticas corporativas" items={im.cultura.practicas} />
                <Lista titulo="Mecanismos de refuerzo" items={im.cultura.mecanismos} />
              </div>
            </div>

            <div className="op-card">
              <span className="op-tag">
                <span className="op-letra">E</span> Negocio
              </span>

              <div className="mf-estandar">
                <span className="op-mini">Estándar</span>
                <b>{im.negocio.estandar}</b>
              </div>

              <div className="mf-tres">
                <Lista titulo="Indicadores críticos" items={im.negocio.indicadores} />
                <Lista titulo="Procesos críticos" items={im.negocio.procesos} />
                <Lista titulo="Políticas" items={im.negocio.politicas} />
              </div>
            </div>
          </section>
        ))}
      </div>

      <footer className="op-pie">
        <span className="op-marca">VIBE</span>
      </footer>
    </article>
  )
}
