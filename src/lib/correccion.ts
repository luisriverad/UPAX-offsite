import type { AnalisisGrupo, Analisis, Grupo } from './asistenteEntrevista'
import type { Values } from '../types'

/**
 * El material de la pantalla final: lo que ya está escrito en la arquitectura,
 * listo para que el modelo lo reescriba a nivel ejecutivo.
 *
 * A diferencia de la síntesis, aquí NO hay respaldo local. Elevar el registro de
 * una frase es trabajo de redacción y una regla mecánica no lo hace: lo único
 * que podría ofrecer —acomodar espacios y acentos— es justo lo que no se pide.
 * Sin llave, el panel enseña el texto tal como está y lo dice.
 */

const g = (v: Values, k: string) => (v[k] ?? '').trim()

/**
 * Los campos que ya tienen texto. Un campo vacío no entra: en esta pantalla no
 * se construye contenido, solo se vuelve a escribir el que hay.
 */
export function revisarRedaccion(v: Values, grupos: Grupo[]): AnalisisGrupo[] {
  return (
    grupos
      .map((gr) => {
        const items: Analisis[] = gr.preguntas
          .map((pregunta, i) => ({
            clave: gr.clave(i),
            numero: i + 1,
            pregunta,
            // la versión elevada la escribe el modelo; local no hay nada que proponer
            propuesta: '',
            actual: g(v, gr.clave(i)),
          }))
          .filter((it) => it.actual)

        return { id: gr.id, label: gr.label, respondidas: items.length, total: items.length, items }
      })
      // un bloque sin una sola línea escrita no da nada que reescribir
      .filter((b) => b.items.length > 0)
  )
}

/** Sin nada escrito no hay redacción que elevar. */
export const hayQueCorregir = (grupos: AnalisisGrupo[]) => grupos.some((b) => b.items.length > 0)
