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
    ],
  },
  {
    id: 'cul',
    label: 'Cultura',
    preguntas: [
      '¿Cómo necesita pensar, decidir y actuar la gente de UPAX para ejecutar lo anterior?',
      '¿Qué comportamientos actuales fortalecen a UPAX y cuáles hoy lo están frenando?',
      '¿Qué comportamientos no deberían ser tolerables, aunque la persona entregue resultados?',
      '¿Qué prácticas deberían ocurrir sistemáticamente para reforzar la mejor manera de trabajar en UPAX?',
    ],
  },
  {
    id: 'neg',
    label: 'Negocio',
    preguntas: [
      'Si llegamos a 2027 y todo esto funcionó extraordinariamente bien, ¿qué tendría que ser materialmente diferente en el negocio?',
      '¿Qué resultados e indicadores demostrarían que realmente lo logramos?',
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

export const PREGUNTAS_DG = [
  '¿Cuál es el propósito principal de tu unidad dentro de UPAX?',
  '¿Qué resultado concreto recibe el cliente gracias a tu unidad?',
  'Pensando en UPAX como grupo, ¿qué debería poder prometerle a cualquier cliente y cumplir siempre?',
  '¿Cuáles son las 3 cosas que UPAX debe hacer especialmente bien para alcanzar sus objetivos hacia 2027?',
  'En el día a día, ¿qué comportamientos, prácticas o reglas ayudan a lograr resultados y cuáles los dificultan?',
]

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
    titulo: 'Para lograrlo, debemos…',
    hint: 'La frase que conecta la promesa con los imperativos.',
  },
]

/* ------------------------------------------------------------------ *
 * Pantalla 11 · bloques que se deciden en el Off-Site
 * ------------------------------------------------------------------ */

export interface BloqueOffsite {
  id: string
  label: string
  /** clave del texto en el store */
  src: string
}

export const BLOQUES_OFFSITE: BloqueOffsite[] = [
  { id: 'existimos', label: 'PARA QUÉ EXISTIMOS', src: 'pdv.existimos' },
  { id: 'promesa', label: 'PROMESA', src: 'pdv.promesa' },
  { id: 'puente', label: 'FRASE PUENTE', src: 'pdv.puente' },
]
