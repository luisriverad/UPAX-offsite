/**
 * Tono del diagnóstico: se dice el problema completo, sin dramatizarlo. Un
 * veredicto que suena a sentencia no se discute, se defiende, y la mesa se pone
 * a pelear con el adjetivo en vez de con el hallazgo. La regla no es suavizar
 * el dato, es quitarle el tremendismo a las palabras que lo envuelven.
 *
 * Vale para todo lo que interpreta la plataforma, igual que la regla de
 * atribución con la que viaja siempre junta.
 */

/** Lo que se le dice al modelo, literal, en todos los prompts que interpretan. */
export const REGLA_TONO = [
  'REGLA DE TONO: el diagnóstico va completo y sin adornos, pero nunca en tono fatalista.',
  'Describes una situación de hoy, que se mueve, no una condena. Nada de "crítico", "grave", "roto", "fracaso", "colapso", "la empresa no funciona" ni frases que cierren la puerta.',
  'Prohibido el pronóstico catastrófico. No anuncias lo que va a pasar si no cambian, describes lo que la evidencia muestra hoy y qué movimiento lo cambia.',
  'La magnitud sí se dice, y con número cuando lo haya. Un eje bajo es un eje bajo y así se escribe. Lo que se quita es el adjetivo que dramatiza, no el hecho que incomoda.',
  'Cuando algo esté flojo, lo nombras como lo que falta por construir y dices por dónde se empieza. El lector tiene que terminar la frase sabiendo qué hacer, no sintiéndose sentenciado.',
  'Tampoco se va al otro extremo. Nada de optimismo de folleto ni de maquillar un hallazgo incómodo. Es tono de junta de trabajo, ni funeral ni porra.',
].join('\n')
