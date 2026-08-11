import { BLOQUES_CEO, GUION_DG, UNIDADES } from '../data/content'
import { K } from './model'
import { conArranque } from './redaccionPdv'
import type { Values } from '../types'

/**
 * Motor del asistente. Es lógica determinista, sin modelo remoto: sirve para la
 * maqueta y no depende de la llave de API. Nació para la entrevista con el CEO
 * (cuatro bloques) y las de los DGs (una por unidad), y lo reutilizan todas las
 * demás pantallas armando sus propios tramos (ver lib/asistentePantalla.ts).
 */

const g = (v: Values, k: string) => (v[k] ?? '').trim()

/** Un tramo capturable: un bloque del CEO, el guion de un DG o una columna del Excel. */
export interface Grupo {
  id: string
  label: string
  preguntas: string[]
  clave: (i: number) => string
  /** repregunta de cierre con el ángulo propio del tramo */
  angulo: string
  /** campos de una línea (nombre corto, indicador, meta): se les exige menos que a una respuesta */
  breve?: boolean
  /** evidencia de otras pantallas de la que salen los borradores cuando el tramo va vacío */
  fuentes?: string[]
  /** borrador ligado al mismo renglón de otro bloque; manda sobre `fuentes` */
  borradorDe?: (i: number) => string
  /**
   * Respaldo y contradicciones del borrador. Van aparte del texto porque el
   * borrador se guarda tal cual en el campo: la atribución es para leerla, no
   * para que termine dentro de la definición.
   */
  metaDe?: (i: number) => { base: string; tension: string }
  /**
   * El tramo produce una síntesis real de la evidencia, no un reciclaje de
   * frases. Entonces el análisis se entrega SIEMPRE, aunque el campo ya tenga
   * texto: el valor está en poder comparar lo escrito contra la evidencia.
   */
  sintetiza?: boolean
}

/** Ángulo de cierre de cada bloque de la entrevista con el CEO. */
export const ANGULO_CEO: Record<string, string> = {
  pdv: '¿Un cliente actual firmaría esa frase tal como la dijiste?',
  imp: `¿Esto aplica igual en las ${UNIDADES.length} unidades o solo en algunas?`,
  cul: '¿Qué pasa hoy cuando alguien no se comporta así?',
  neg: '¿Con qué número sabrías, sin discutir, que se logró?',
}

export function gruposCeo(): Grupo[] {
  return BLOQUES_CEO.map((b) => ({
    id: b.id,
    label: b.label,
    preguntas: b.preguntas,
    clave: (i: number) => K.ceo(b.id, i),
    angulo: ANGULO_CEO[b.id],
  }))
}

/** Un tramo por unidad, con el guion completo del CEO y el bloque a la vista. */
export function gruposDgs(): Grupo[] {
  return UNIDADES.map((u) => ({
    id: `dg${u.id}`,
    label: u.nombre,
    preguntas: GUION_DG.map((p) => `[${p.bloqueLabel}] ${p.texto}`),
    clave: (i: number) => K.dg(u.id, GUION_DG[i].bloque, GUION_DG[i].q),
    angulo: '¿Esto pasa solo en tu unidad o le pasa a todo UPAX?',
  }))
}

function palabras(t: string): string[] {
  return t.split(/\s+/).filter(Boolean)
}

/* ------------------------------------------------------------------ *
 * Analizar: leer todo lo capturado y proponer lo que falta
 * ------------------------------------------------------------------ */

/**
 * Un campo del tramo con las dos caras que interesan: lo que el asistente
 * propone a partir de la evidencia y lo que hay escrito hoy. Van separadas para
 * poder compararlas; `propuesta` es exactamente el texto que se guarda al
 * pulsar Completar.
 */
export interface Analisis {
  clave: string
  numero: number
  pregunta: string
  /** propuesta del asistente; vacía cuando no hay material del cual construirla */
  propuesta: string
  /** lo que hay hoy en el campo, literal */
  actual: string
  /** sobre qué evidencia se construyó la propuesta (solo cuando la escribe el modelo) */
  base?: string
  /** contradicciones entre unidades o con el CEO (solo cuando la escribe el modelo) */
  tension?: string
}

export interface AnalisisGrupo {
  id: string
  label: string
  respondidas: number
  total: number
  items: Analisis[]
}

function frases(texto: string): string[] {
  return texto
    // sin lookbehind, para no depender del soporte del navegador
    .split(/[.;!?]+\s+|\n+/)
    .map((f) => f.trim().replace(/^[-•·]\s*/, ''))
    .filter((f) => palabras(f).length >= 5)
}

/** Recorta una frase a algo que quepa en un campo de una línea. */
function resumeBreve(texto: string): string {
  const t = palabras(texto)
    .slice(0, 4)
    .join(' ')
    .replace(/[.,;:!?]+$/, '')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export function analizar(v: Values, grupos: Grupo[]): AnalisisGrupo[] {
  return grupos.map((gr) => {
    const respuestas = gr.preguntas.map((_, i) => g(v, gr.clave(i)))
    const dichas = respuestas.filter(Boolean)

    // el material del propio tramo, de la frase más sustanciosa a la menos
    const propias = dichas.flatMap(frases).sort((a, z) => z.length - a.length)
    // y el respaldo: lo capturado en las pantallas que alimentan a esta
    const externas = (gr.fuentes ?? []).flatMap(frases).sort((a, z) => z.length - a.length)
    const disponibles = [...new Set([...propias, ...externas])]

    // cada frase se propone una sola vez: el mismo borrador repetido en tres campos no ayuda a nadie
    let siguiente = 0

    const items: Analisis[] = respuestas.map((r, i) => {
      // el renglón hermano manda: un mecanismo se propone desde su práctica, no desde cualquier frase
      const propio = gr.borradorDe?.(i) ?? ''

      let fuente: string
      if (gr.sintetiza) {
        // sintetizar la evidencia se hace siempre; que el campo ya tenga texto
        // no vuelve irrelevante el análisis, al contrario: permite contrastarlo
        fuente = propio
      } else if (r) {
        // reciclar una frase para sustituir una respuesta ya dada sería ruido
        fuente = ''
      } else {
        fuente = propio || disponibles[siguiente++] || ''
      }

      const meta = fuente ? gr.metaDe?.(i) : undefined

      return {
        clave: gr.clave(i),
        numero: i + 1,
        pregunta: gr.preguntas[i],
        // la Propuesta de Valor lleva arranque fijo, venga de donde venga el borrador
        propuesta: fuente ? conArranque(gr.clave(i), gr.breve ? resumeBreve(fuente) : fuente) : '',
        actual: r,
        base: meta?.base || undefined,
        tension: meta?.tension || undefined,
      }
    })

    return {
      id: gr.id,
      label: gr.label,
      respondidas: dichas.length,
      total: gr.preguntas.length,
      items,
    }
  })
}
