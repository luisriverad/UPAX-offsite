import { BLOQUES_CEO, PREGUNTAS_DG, UNIDADES } from '../data/content'
import { K, recorta } from './model'
import type { Values } from '../types'

/**
 * Motor del asistente. Es lógica determinista, sin modelo remoto: sirve para la
 * maqueta y no depende de la llave de API. Nació para la entrevista con el CEO
 * (cuatro bloques) y las de los DGs (una por unidad), y lo reutilizan todas las
 * demás pantallas armando sus propios tramos (ver lib/asistentePantalla.ts).
 */

const g = (v: Values, k: string) => (v[k] ?? '').trim()

const normaliza = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

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

export function gruposDgs(): Grupo[] {
  return UNIDADES.map((u) => ({
    id: `dg${u.id}`,
    label: u.nombre,
    preguntas: PREGUNTAS_DG,
    clave: (i: number) => K.dg(u.id, i),
    angulo: '¿Esto pasa solo en tu unidad o le pasa a todo UPAX?',
  }))
}

/** Palabras que suenan bien y no dicen nada por sí solas. */
const PALABRAS_VAGAS = [
  'calidad',
  'excelencia',
  'valor agregado',
  'innovacion',
  'liderazgo',
  'compromiso',
  'sinergia',
  'pasion',
  'integral',
  'soluciones',
  'profesionalismo',
  'eficiencia',
  'vanguardia',
  'mejores practicas',
  'clase mundial',
  'transformacion',
]

/* ------------------------------------------------------------------ *
 * Cuestionar: repreguntar donde la respuesta no quedó firme
 * ------------------------------------------------------------------ */

export type Motivo = 'vacia' | 'corta' | 'generica' | 'lista'

export interface Repregunta {
  clave: string
  grupoLabel: string
  numero: number
  pregunta: string
  motivo: Motivo
  /** lo que quedó escrito en la respuesta, para releerlo al repreguntar */
  respuesta: string
  repreguntas: string[]
}

export interface ResultadoCuestionar {
  dudas: Repregunta[]
  /** tramos sin una sola respuesta: se resumen en vez de listarse pregunta por pregunta */
  sinEmpezar: string[]
  revisadas: number
}

function palabras(t: string): string[] {
  return t.split(/\s+/).filter(Boolean)
}

/**
 * Detecta por qué una respuesta no sirve todavía. `null` = está firme.
 * A un campo `breve` (nombre corto, indicador, meta) se le pide mucho menos:
 * ahí lo largo es defecto, no virtud.
 */
function diagnostico(texto: string, breve = false): Motivo | null {
  if (!texto) return 'vacia'

  const p = palabras(texto)
  if (p.length < (breve ? 2 : 8)) return 'corta'

  const t = normaliza(texto)
  const vaga = PALABRAS_VAGAS.some((x) => t.includes(x))
  // un dato, un ejemplo o una respuesta larga ya la aterrizan
  const aterrizada = /\d/.test(texto) || p.length > 45 || t.includes('por ejemplo')
  if (vaga && !aterrizada) return 'generica'

  if (breve) return null

  const comas = (texto.match(/,/g) || []).length
  if (comas >= 3 && p.length < 20) return 'lista'

  return null
}

/**
 * Cinco repreguntas por motivo, no dos: a cada duda le tocan dos y se va
 * rotando, así una entrevista con varias respuestas flojas no devuelve el mismo
 * par una y otra vez. Cinco es impar a propósito: con paso de dos, el par
 * tarda cinco dudas en repetirse.
 */
const REPREGUNTAS: Record<Motivo, string[]> = {
  vacia: [
    '¿Qué contestarías hoy, aunque sea en borrador?',
    '¿Qué te impide contestarla: falta información o falta decisión?',
    '¿Quién dentro de UPAX sí tendría la respuesta?',
    'Si tuvieras que decidirlo mañana, ¿por dónde empezarías?',
    '¿No aplica, o simplemente todavía no se ha discutido?',
  ],
  corta: [
    '¿Puedes dar un ejemplo concreto de la última vez que pasó?',
    '¿Cómo se notaría esto para un cliente, en la práctica?',
    '¿Quién tendría que hacer algo distinto para que esto sea cierto?',
    '¿Qué hay detrás de esa frase que todavía no está escrito?',
    '¿Con qué lo compararías para que se entienda mejor?',
  ],
  generica: [
    'Esa palabra la diría cualquier competidor. ¿Qué hace UPAX que ellos no?',
    '¿Cómo se ve eso un martes cualquiera, en una operación real?',
    'Si quitamos esa palabra, ¿qué queda de la idea?',
    '¿Qué tendría que pasar para que dejara de ser cierto?',
    '¿Cómo lo demostrarías ante un cliente que no te cree?',
  ],
  lista: [
    'Enumeraste varios conceptos. Si solo pudieras conservar uno, ¿cuál?',
    '¿Cuál de esos falla más seguido hoy?',
    '¿Están en orden de importancia o los dijiste como fueron saliendo?',
    '¿Alguno de esos es consecuencia de otro?',
    '¿Cuál costaría más trabajo sostener en todas las unidades?',
  ],
}

export function cuestionar(v: Values, grupos: Grupo[]): ResultadoCuestionar {
  const dudas: Repregunta[] = []
  const sinEmpezar: string[] = []
  let revisadas = 0
  // cuántas dudas de cada motivo llevamos, para ir rotando el par de repreguntas
  const turno: Record<Motivo, number> = { vacia: 0, corta: 0, generica: 0, lista: 0 }

  grupos.forEach((gr) => {
    const respuestas = gr.preguntas.map((_, i) => g(v, gr.clave(i)))
    revisadas += respuestas.filter(Boolean).length

    // un tramo intacto no da para repreguntar: se reporta de una línea
    if (respuestas.every((r) => !r)) {
      sinEmpezar.push(gr.label)
      return
    }

    // el ángulo es del bloque entero: repetirlo en cada pregunta es ruido, va solo en la primera
    let anguloPendiente = Boolean(gr.angulo)

    gr.preguntas.forEach((pregunta, i) => {
      const motivo = diagnostico(respuestas[i], gr.breve)
      if (!motivo) return

      // se recorren pares distintos, no la lista de dos en dos: cinco repreguntas
      // dan veinte combinaciones, de sobra para una entrevista completa
      const pool = REPREGUNTAS[motivo]
      const n = pool.length
      const t = turno[motivo]++
      const a = t % n
      const b = (a + 1 + Math.floor(t / n)) % n
      const repreguntas = [pool[a], pool[b === a ? (a + 1) % n : b]]
      if (anguloPendiente) {
        repreguntas.push(gr.angulo)
        anguloPendiente = false
      }

      dudas.push({
        clave: gr.clave(i),
        grupoLabel: gr.label,
        numero: i + 1,
        pregunta,
        motivo,
        respuesta: recorta(respuestas[i], 160),
        repreguntas,
      })
    })
  })

  return { dudas, sinEmpezar, revisadas }
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

      return {
        clave: gr.clave(i),
        numero: i + 1,
        pregunta: gr.preguntas[i],
        propuesta: fuente ? (gr.breve ? resumeBreve(fuente) : fuente) : '',
        actual: r,
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
