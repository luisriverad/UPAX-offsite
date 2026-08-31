/**
 * Regla de puntuación del documento: nada de rayas ni de dos puntos en el texto
 * que se guarda. Es una decisión de estilo del grupo, no una preferencia del
 * redactor, así que vive en un solo lugar y se aplica por los dos lados: se le
 * pide al modelo antes de escribir y se verifica sobre lo que devuelve.
 */

/** Lo que se le dice al modelo, literal, en todos los prompts que redactan. */
export const REGLA_PUNTUACION = [
  'REGLA DE PUNTUACIÓN, INNEGOCIABLE: no escribes guiones ni dos puntos. Ninguno, en ningún campo.',
  'Prohibido el guion en todas sus formas, el corto y el largo, ya sea para abrir un inciso, para enumerar, para unir dos ideas o para aclarar algo.',
  'Prohibidos los dos puntos, incluso para presentar una lista, una definición o un ejemplo.',
  'Si una frase te pide uno de los dos, no lo metas y no lo sustituyas por otro signo raro. Vuelve a redactar la frase para que no haga falta.',
  'Casi siempre se resuelve partiendo la oración en dos, cambiando el orden de la idea o usando una coma, un "que", un "como", un "porque" o un "es decir".',
  'Cuando quieras enumerar, enumera dentro de la frase con comas y una "y" al final.',
  'También evitas las palabras compuestas con guion: prefiere siempre la forma que no lo lleva.',
].join('\n')

/**
 * Red de seguridad sobre lo que llega del modelo. El prompt es la defensa
 * principal —reescribir la frase es cosa suya, no nuestra—; esto solo atrapa el
 * signo que se le escape, cambiándolo por la coma que casi siempre equivale.
 * No toca el guion pegado dentro de una palabra ni los dos puntos entre cifras:
 * ahí un reemplazo automático rompería más de lo que arregla.
 */
export function sinGuionesNiDosPuntos(texto: string): string {
  if (!texto) return texto

  return (
    texto
      // raya de apertura, de las que el modelo usa para encabezar un renglón
      .replace(/^\s*[-–—―]\s+/, '')
      // guion tipográfico: en español siempre es puntuación, nunca parte de la palabra
      .replace(/\s*[–—―]\s*/g, ', ')
      // guion corto usado como separador, es decir con espacio a algún lado
      .replace(/\s+-+\s*/g, ', ')
      .replace(/\s*-+\s+/g, ', ')
      // dos puntos, salvo entre cifras (horas, proporciones)
      .replace(/([^\s\d]):(?!\d)\s*/g, '$1, ')
      // la sustitución puede encimarse con la puntuación que ya estaba
      .replace(/,\s*,/g, ',')
      .replace(/\s+,/g, ',')
      .replace(/,\s*([.;!?])/g, '$1')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/,\s*$/, '.')
      .trim()
  )
}
