import type { ModuloId, ScreenMeta, Tab, TabId } from '../types'

export interface Modulo {
  id: ModuloId
  num: string
  label: string
  /** qué se hace en el módulo, en una línea */
  nota: string
}

/** Los dos grandes bloques del proceso. El primero alimenta al segundo. */
export const MODULOS: Modulo[] = [
  {
    id: 'pre',
    num: '01',
    label: 'Pre-evento',
    nota: 'Levantar la evidencia: entrevistas con el CEO y los DGs, archivos, alineación y consolidado.',
  },
  {
    id: 'off',
    num: '02',
    label: 'Off-Site',
    nota: 'Construir la arquitectura sobre esa evidencia y decidirla en vivo con el grupo.',
  },
]

export const TABS: Tab[] = [
  { id: 'metodo', label: 'Método VIBE', modulo: 'pre' },
  { id: 'manifiesto', label: 'Manifiesto UPAX', modulo: 'pre' },
  { id: 'ceo', label: 'CEO', modulo: 'pre' },
  { id: 'dgs', label: 'DGs', modulo: 'pre' },
  { id: 'alineacion', label: 'Alineación', modulo: 'pre' },
  { id: 'consolidado', label: 'Consolidado', modulo: 'pre' },
  { id: 'propuesta', label: 'Propuesta', modulo: 'off' },
  { id: 'imperativos', label: 'Imperativos', modulo: 'off' },
  { id: 'cultura', label: 'Cultura', modulo: 'off' },
  { id: 'negocio', label: 'Negocio', modulo: 'off' },
  { id: 'final', label: 'Final', modulo: 'off' },
]

/**
 * FUENTE DE VERDAD de la navegacion: las pantallas del diseno funcional.
 * El indice del arreglo es el orden de recorrido; `tab` agrupa en la barra superior.
 */
export const SCREENS: ScreenMeta[] = [
  {
    id: 's01',
    num: 1,
    tab: 'metodo',
    title: 'El método VIBE',
    sub: 'Cómo se convierte todo lo que la empresa ya sabe en operación diaria: los insumos entran por arriba, el filtro VIBE los ordena y bajan como conductas, indicadores y resultados.',
    sinAsistente: true,
    copi: [],
  },
  {
    id: 's00',
    num: 2,
    tab: 'manifiesto',
    title: 'Manifiesto UPAX',
    sinAsistente: true,
    copi: [],
  },
  {
    id: 's02',
    num: 3,
    tab: 'ceo',
    title: 'Entrevista con el CEO',
    sub: 'Una sola entrevista estructurada con las mismas secciones del Excel. La plataforma captura, transcribe y convierte respuestas en material de trabajo.',
    sinAsistente: true,
    copi: [
      'Resumir la respuesta sin cambiar su sentido',
      'Repreguntar cuando la respuesta sea ambigua',
      'Extraer frases para el Excel',
      'Marcar contradicciones con archivos o DGs',
    ],
  },
  {
    id: 's03',
    num: 4,
    tab: 'dgs',
    title: 'Entrevistas con cada DG + archivos',
    sub: 'Misma estructura para todas las unidades. Así evitamos un ejercicio distinto por cada una y logramos información comparable desde el inicio.',
    sinAsistente: true,
    copi: [
      'Preparar la entrevista con base en sus archivos',
      'Comparar respuestas entre DGs',
      'Detectar datos faltantes antes del Off-Site',
      'Mandar cada hallazgo al bloque correcto del Excel',
    ],
  },
  {
    id: 's03b',
    num: 5,
    tab: 'alineacion',
    title: 'Alineación: el diamante y el cruce CEO ↔ DGs',
    sub: 'Dos lecturas de lo mismo. El Diamante califica de 0 a 10 las cuatro fuerzas que sostienen a la empresa —estrategia, oferta, gente y procesos— y enseña por dónde se fuga el resultado; el cruce baja al detalle y compara respuesta contra respuesta, porque CEO y DGs contestaron el mismo guion.',
    sinAsistente: true,
    copi: [
      'Calificar cada eje con evidencia, no con intención',
      'Leer el desbalance: el eje débil manda sobre los demás',
      'Comparar la respuesta del CEO con la de cada DG',
      'Llevar al Off-Site sólo las divergencias que importan',
    ],
  },
  {
    id: 's04',
    num: 6,
    tab: 'consolidado',
    title: 'Consolidado de entrevistas y evidencia',
    sub: 'Una pantalla para ver qué dice el CEO, qué dicen los DGs y qué respaldan los archivos antes de redactar cualquier definición.',
    copi: [
      'Detectar coincidencias, diferencias y vacíos',
      'Separar hechos de opiniones',
      'Construir una síntesis editable por tema',
      'Citar la evidencia usada en cada síntesis',
    ],
  },
  {
    id: 's05',
    num: 7,
    tab: 'propuesta',
    title: 'Construcción de la Propuesta de Valor',
    sub: 'Aquí se trabajan únicamente los tres campos del Excel: Para qué existimos, Promesa y Cómo lo hacemos.',
    sinAsistente: true,
    copi: [
      'Generar alternativas usando sólo evidencia cargada',
      'Simplificar sin perder contenido',
      'Comparar redacción con los ejemplos del Excel',
      'Guardar por separado: propuesta del asistente / versión humana',
    ],
  },
  {
    id: 's06',
    num: 8,
    tab: 'imperativos',
    title: 'Construcción de Imperativos Estratégicos',
    sub: 'La plataforma convierte la información previa en pocos imperativos claros y permite probar si realmente soportan la Propuesta de Valor.',
    sinAsistente: true,
    copi: [
      'Agrupar ideas repetidas sin perder matices',
      'Señalar imperativos demasiado genéricos',
      'Mostrar qué entrevistas respaldan cada uno',
      'Detectar duplicidad o contradicción entre imperativos',
    ],
  },
  {
    id: 's07',
    num: 9,
    tab: 'cultura',
    title: 'Cultura: cómo pensamos, decidimos y actuamos',
    sub: 'Una cuadrícula por imperativo. Se redactan comportamientos concretos, no palabras aspiracionales sueltas.',
    sinAsistente: true,
    copi: [
      'Convertir conceptos abstractos en conductas observables',
      'Eliminar frases redundantes',
      'Proponer redacciones ligadas a cada imperativo',
      'Buscar conflictos entre lo que se dice y lo que se hace',
    ],
  },
  {
    id: 's08',
    num: 10,
    tab: 'cultura',
    title: 'Cultura: prácticas corporativas y mecanismos de refuerzo',
    sub: 'La misma lógica del Excel: qué hacemos de forma repetible y qué mecanismos hacen que realmente ocurra.',
    sinAsistente: true,
    copi: [
      'Proponer prácticas a partir de comportamientos aprobados',
      'Detectar prácticas sin mecanismo de refuerzo',
      'Evitar mecanismos genéricos o imposibles de medir',
      'Mantener trazabilidad con entrevistas y documentos',
    ],
  },
  {
    id: 's09',
    num: 11,
    tab: 'negocio',
    title: 'Negocio: estándares, indicadores, procesos y políticas',
    sub: 'Los cuatro bloques de Negocio del Excel, un imperativo a la vez: el número que se exige, cómo se mide, qué proceso lo sostiene y qué regla gobierna la decisión.',
    sinAsistente: true,
    copi: [
      'Identificar números ya presentes en archivos',
      'Separar indicador actual de meta 2027',
      'Alertar cuando un número no tiene fuente',
      'Relacionar procesos y políticas con cada imperativo',
    ],
  },
  {
    id: 's12',
    num: 12,
    tab: 'final',
    title: 'Resultado final: matriz UPAX completada',
    sub: 'El proceso termina donde empezó: el Excel convertido en una arquitectura única, trazable y lista para exportar o seguir evolucionando.',
    copi: [
      'Generar una síntesis ejecutiva del resultado',
      'Explicar la trazabilidad de cualquier definición',
      'Crear versiones de comunicación sin cambiar el núcleo',
      'Mantener el documento vivo después del Off-Site',
    ],
  },
]

/** Primera pantalla de cada pestaña, para la barra superior. */
export function firstOfTab(tab: string): number {
  const i = SCREENS.findIndex((s) => s.tab === tab)
  return i < 0 ? 0 : i
}

export function tabsDeModulo(m: ModuloId): Tab[] {
  return TABS.filter((t) => t.modulo === m)
}

export function moduloDeTab(tab: TabId): ModuloId {
  return TABS.find((t) => t.id === tab)?.modulo ?? 'pre'
}

/** Primera pantalla de un módulo, para saltar entre bloques. */
export function firstOfModulo(m: ModuloId): number {
  const suyas = tabsDeModulo(m).map((t) => t.id)
  const i = SCREENS.findIndex((s) => suyas.includes(s.tab))
  return i < 0 ? 0 : i
}
