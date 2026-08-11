import type { MatrixRow } from '../types'

/**
 * Bloques de la matriz maestra que se evalúan completos. Propuesta de Valor e
 * Imperativos no están aquí: cada uno de sus temas es un renglón propio y se
 * genera desde lo capturado (ver `filasMatriz` en lib/model.ts).
 */
export const MATRIZ_BLOQUES: MatrixRow[] = [
  { sec: 'CULTURA', label: 'Cómo pensamos, decidimos y actuamos', key: 'cul.cond', empty: 'PENDIENTE' },
  { sec: '', label: 'Prácticas corporativas', key: 'cul.prac', empty: 'PENDIENTE' },
  { sec: '', label: 'Mecanismos de refuerzo', key: 'cul.mec', empty: 'PENDIENTE' },
  { sec: 'NEGOCIO', label: 'Estándares', key: 'neg.est', empty: 'PENDIENTE' },
  { sec: '', label: 'Indicadores críticos', key: 'neg.ind', empty: 'PENDIENTE' },
  { sec: '', label: 'Procesos críticos', key: 'neg.proc', empty: 'PENDIENTE' },
  { sec: '', label: 'Políticas', key: 'neg.pol', empty: 'PENDIENTE' },
]

/* ------------------------------------------------------------------ *
 * Pantalla 02 · entrevista con el CEO
 * ------------------------------------------------------------------ */

export interface BloqueEntrevista {
  id: string
  label: string
  preguntas: string[]
}

export const BLOQUES_CEO: BloqueEntrevista[] = [
  {
    id: 'pdv',
    label: 'Propuesta de Valor',
    preguntas: [
      'Más allá de lo que vende cada unidad, ¿qué compra realmente un cliente cuando compra UPAX?',
      '¿Qué debería poder prometer UPAX a cualquier cliente y cumplir consistentemente?',
      '¿Qué debería poder decir un cliente de UPAX en 2027 que hoy todavía no puede decir?',
      '¿Qué hace realmente diferente a UPAX frente a otras alternativas?',
      'Si tuvieras que resumir en una sola idea lo que UPAX debe representar para sus clientes, ¿cuál sería?',
    ],
  },
  {
    id: 'imp',
    label: 'Imperativos Estratégicos',
    preguntas: [
      '¿Cuáles son las pocas cosas que UPAX tiene que hacer excepcionalmente bien para cumplir esa promesa?',
      '¿Qué tendría que cambiar necesariamente de aquí a 2027?',
      '¿Qué tendría que dejar de hacer UPAX para llegar ahí?',
      '¿Qué debería funcionar de la misma manera en las nueve unidades, independientemente de quién las dirija?',
      '¿Qué necesita desarrollar o fortalecer UPAX para poder ejecutar todo lo anterior?',
    ],
  },
  {
    id: 'cul',
    label: 'Cultura',
    preguntas: [
      '¿Cómo necesita pensar, decidir y actuar la gente de UPAX para alcanzar los objetivos de la empresa hacia 2027?',
      '¿Qué comportamientos actuales ayudan a UPAX a lograr resultados y cuáles hoy los están frenando?',
      '¿Qué comportamientos no deberían tolerarse en UPAX, aunque la persona entregue buenos resultados?',
      '¿Qué prácticas deberían ocurrir de manera sistemática para reforzar la forma de trabajar que UPAX necesita?',
      '¿Qué comportamientos deberían modelar los líderes de UPAX de manera visible y consistente?',
    ],
  },
  {
    id: 'neg',
    label: 'Negocio',
    preguntas: [
      'Si UPAX llega a 2027 como esperas, ¿qué resultados concretos deberían ser diferentes en el negocio?',
      '¿Cuáles son los indicadores que realmente deberían decirnos si UPAX está avanzando en la dirección correcta?',
      '¿Qué procesos del negocio tienen que funcionar especialmente bien para alcanzar esos resultados?',
      '¿Qué estándares o niveles de desempeño deberían ser obligatorios en todas las unidades?',
      '¿Qué políticas o reglas de decisión deberían ayudar a mantener a las nueve unidades alineadas con los objetivos de UPAX?',
    ],
  },
]

/* ------------------------------------------------------------------ *
 * Pantalla 03 · entrevistas con los DGs
 * ------------------------------------------------------------------ */

export interface Unidad {
  /** id estable: es parte de la clave de guardado, no lo cambies al reordenar */
  id: number
  nombre: string
}

/** Las unidades de negocio de UPAX, una entrevista por cada una. */
export const UNIDADES: Unidad[] = [
  { id: 1, nombre: 'Research Land' },
  { id: 2, nombre: 'Marketing United' },
  { id: 3, nombre: 'Promo Espacio' },
  { id: 4, nombre: 'Mexa Creativa' },
  { id: 5, nombre: 'House of Films' },
  { id: 6, nombre: 'Zeus' },
  { id: 7, nombre: 'Neracode' },
  { id: 8, nombre: 'UiX' },
]

export const DGS = UNIDADES.map((u) => u.id)

/**
 * El guion de los DGs es EL MISMO que el del CEO: los cuatro bloques, con las
 * mismas preguntas y en el mismo orden. Es la condición para poder comparar
 * respuesta contra respuesta en el consolidado, en vez de cruzar textos que
 * hablaban de cosas distintas. Apuntan al mismo objeto a propósito: así no
 * pueden divergir al editarse.
 */
export const BLOQUES_DG: BloqueEntrevista[] = BLOQUES_CEO

/**
 * Lo que solo el DG puede contestar: su unidad por dentro. El CEO no responde
 * este bloque, así que no entra en la comparación respuesta contra respuesta —
 * sirve para entender qué hace cada unidad y contrastar unidades entre sí.
 */
export const BLOQUE_UNIDAD: BloqueEntrevista = {
  id: 'uni',
  label: 'Tu unidad',
  preguntas: [
    '¿Qué papel juega tu unidad dentro de UPAX y cuál es su principal contribución al grupo?',
    '¿Qué resultado concreto entrega tu unidad a sus clientes, internos o externos?',
    '¿Qué hace especialmente bien tu unidad hoy que UPAX debería preservar o aprovechar?',
    '¿Cuál es hoy el principal obstáculo que limita el crecimiento o desempeño de tu unidad rumbo a 2027?',
    '¿Qué necesitas de UPAX corporativo o de las demás unidades para que tu unidad pueda lograr mejores resultados?',
  ],
}

export interface PreguntaGuion {
  bloque: string
  bloqueLabel: string
  /** índice dentro de su bloque */
  q: number
  texto: string
}

const aplanar = (bloques: BloqueEntrevista[]): PreguntaGuion[] =>
  bloques.flatMap((b) => b.preguntas.map((texto, q) => ({ bloque: b.id, bloqueLabel: b.label, q, texto })))

/** El guion compartido con el CEO, de corrido. Es la base de la comparación. */
export const GUION: PreguntaGuion[] = aplanar(BLOQUES_CEO)

/** Todo lo que se le pregunta a un DG: el guion compartido más su bloque propio. */
export const GUION_DG: PreguntaGuion[] = aplanar([...BLOQUES_DG, BLOQUE_UNIDAD])

export interface ArchivoPedido {
  nombre: string
  /** cómo pedirlo, en palabras del DG */
  detalle: string
  /** extensiones razonables para ese documento */
  formatos: string[]
  /** palabras que deberían aparecer en el nombre del archivo */
  pistas: string[]
}

export const ARCHIVOS_DG: ArchivoPedido[] = [
  {
    nombre: 'Plan / objetivos 2027 de la unidad',
    detalle: 'El documento que exista hoy: plan estratégico, presupuesto, metas o presentación.',
    formatos: ['pdf', 'pptx', 'ppt', 'xlsx', 'xls', 'docx', 'doc', 'key'],
    pistas: ['plan', 'objetivo', 'meta', 'presupuesto', 'estrateg', '2027', '2026'],
  },
  {
    nombre: 'Presentación comercial actual',
    detalle: 'Lo que utilizan para explicar qué hace la unidad, para quién y qué ofrece.',
    formatos: ['pdf', 'pptx', 'ppt', 'key'],
    pistas: ['comercial', 'presentacion', 'credencial', 'oferta', 'servicio', 'propuesta', 'deck'],
  },
  {
    nombre: 'Reporte de gestión que realmente utiliza el DG',
    detalle: 'El tablero, reporte mensual o información que usas hoy para revisar el desempeño de tu unidad.',
    formatos: ['xlsx', 'xls', 'csv', 'pdf', 'pptx', 'ppt'],
    pistas: ['reporte', 'tablero', 'dashboard', 'gestion', 'mensual', 'kpi', 'desempeno', 'seguimiento'],
  },
  {
    nombre: 'Última presentación de resultados de la unidad',
    detalle: 'La que hayas usado con el CEO, el Comité, el Consejo o tu propio equipo directivo.',
    formatos: ['pdf', 'pptx', 'ppt', 'key'],
    pistas: ['resultado', 'cierre', 'comite', 'consejo', 'trimestre', 'anual', 'q1', 'q2', 'q3', 'q4'],
  },
  {
    nombre: 'Organigrama actual de la unidad',
    detalle: 'Sólo para entender estructura, responsabilidades y capacidad de ejecución.',
    formatos: ['pdf', 'pptx', 'ppt', 'png', 'jpg', 'jpeg', 'xlsx', 'xls', 'vsdx'],
    pistas: ['organigrama', 'estructura', 'org', 'equipo', 'plantilla'],
  },
]

/* ------------------------------------------------------------------ *
 * Pantalla 04 · consolidado
 * ------------------------------------------------------------------ */

export interface VistaConsolidado {
  id: string
  label: string
  /** cada tema apunta al bloque de entrevista del que toma la evidencia */
  temas: { id: string; label: string; bloque: string }[]
}

export const VISTAS_CONSOLIDADO: VistaConsolidado[] = [
  {
    id: 'pdv',
    label: 'Propuesta de Valor',
    temas: [
      { id: 'existimos', label: 'Para qué existimos', bloque: 'pdv' },
      { id: 'promesa', label: 'Promesa', bloque: 'pdv' },
      { id: 'puente', label: 'Frase puente', bloque: 'pdv' },
    ],
  },
  {
    id: 'imp',
    label: 'Imperativos',
    temas: [
      { id: 'candidatos', label: 'Imperativos candidatos', bloque: 'imp' },
      { id: 'prioridades', label: 'Prioridades 2027', bloque: 'imp' },
      { id: 'dejar', label: 'Qué dejar de hacer', bloque: 'imp' },
    ],
  },
  {
    id: 'cul',
    label: 'Cultura',
    temas: [
      { id: 'conductas', label: 'Cómo pensamos, decidimos y actuamos', bloque: 'cul' },
      { id: 'practicas', label: 'Prácticas corporativas', bloque: 'cul' },
      { id: 'mecanismos', label: 'Mecanismos de refuerzo', bloque: 'cul' },
    ],
  },
  {
    id: 'neg',
    label: 'Negocio',
    temas: [
      { id: 'estandares', label: 'Estándares', bloque: 'neg' },
      { id: 'indicadores', label: 'Indicadores críticos', bloque: 'neg' },
      { id: 'procesos', label: 'Procesos críticos', bloque: 'neg' },
      { id: 'politicas', label: 'Políticas', bloque: 'neg' },
    ],
  },
]

/* ------------------------------------------------------------------ *
 * Pantalla 05 · propuesta de valor
 * ------------------------------------------------------------------ */

export interface CampoPropuesta {
  id: 'existimos' | 'promesa' | 'puente'
  tag: string
  titulo: string
  hint: string
  /** el campo que el diseno marca como el nucleo de la propuesta */
  destacado?: boolean
}

export const CAMPOS_PROPUESTA: CampoPropuesta[] = [
  {
    id: 'existimos',
    tag: 'PARA QUÉ EXISTIMOS',
    titulo: 'Definición actual de trabajo',
    hint: 'La razón de ser de UPAX como grupo, no la suma de sus unidades.',
  },
  {
    id: 'promesa',
    tag: 'PROMESA',
    titulo: 'Definición actual de trabajo',
    hint: 'Lo que UPAX puede prometer y cumplir consistentemente.',
    destacado: true,
  },
  {
    id: 'puente',
    tag: 'FRASE PUENTE',
    titulo: 'Para ello, haremos…',
    hint: 'La frase que conecta la promesa con los imperativos.',
  },
]

