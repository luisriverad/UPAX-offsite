/**
 * El método, antes que el contenido: el embudo VIBE explica de dónde sale todo
 * lo que se va a trabajar en las demás pantallas.
 *
 * La lámina vive en `public/vibe-funnel-slide.html` y se muestra tal cual, en un
 * iframe: es material fijo de presentación y se edita ahí, no aquí.
 */
export default function S01Metodo() {
  return (
    <article className="metodo">
      <iframe className="metodo-slide" src="/vibe-funnel-slide.html" title="Embudo VIBE: de la información a la conducta" />
    </article>
  )
}
