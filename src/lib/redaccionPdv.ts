import { UNIDADES } from '../data/content'

/**
 * Los tres campos de la Propuesta de Valor se leen en voz alta en el comité, así
 * que su redacción arranca siempre igual. La regla vive aquí y se aplica en los
 * dos caminos que pueden escribir una síntesis: el motor local y el modelo.
 */

export const GRUPO = 'UPAX'

export interface MoldePdv {
  /** lo que se antepone cuando el texto no trae el arranque */
  arranque: string
  /** aperturas que ya cumplen la regla */
  valido: RegExp
  /** cómo se le enuncia al modelo, literal */
  regla: string
  /** lo que ve quien escribe a mano */
  placeholder: string
  /** limpieza previa, para que el texto empalme con el arranque sin romperse */
  previo?: (t: string) => string
}

export const MOLDES_PDV: Record<string, MoldePdv> = {
  existimos: {
    arranque: `${GRUPO} existe para `,
    valido: new RegExp(`^${GRUPO}\\s+existe\\s+para\\b`, 'i'),
    regla: `«${GRUPO} existe para …»`,
    placeholder: `${GRUPO} existe para…`,
  },
  promesa: {
    arranque: `${GRUPO} promete `,
    valido: new RegExp(`^${GRUPO}\\s+promete\\b`, 'i'),
    regla: `«${GRUPO} promete …»`,
    placeholder: `${GRUPO} promete…`,
  },
  puente: {
    arranque: 'Para ello, ',
    // el verbo va en futuro, pero cuál es decisión de quien redacta
    valido: /^Para ello,?\s+\S+/i,
    regla: '«Para ello, …» seguido de un verbo en futuro (haremos, desarrollaremos, contrataremos, seremos…)',
    placeholder: 'Para ello, haremos…',
    previo: aFuturo,
  },
}

/* ------------------------------------------------------------------ *
 * La frase puente en futuro
 * ------------------------------------------------------------------ */

/** Futuros que no se forman con infinitivo + "emos". */
const FUTURO_IRREGULAR: Record<string, string> = {
  ser: 'seremos',
  hacer: 'haremos',
  tener: 'tendremos',
  poder: 'podremos',
  poner: 'pondremos',
  salir: 'saldremos',
  venir: 'vendremos',
  decir: 'diremos',
  querer: 'querremos',
  saber: 'sabremos',
  haber: 'habremos',
  valer: 'valdremos',
}

/** Primera persona del plural en futuro: integrar → integraremos, hacer → haremos. */
function futuroDe(verbo: string): string {
  const v = verbo.toLowerCase()
  if (FUTURO_IRREGULAR[v]) return FUTURO_IRREGULAR[v]
  return /(?:ar|er|ir)$/.test(v) ? `${v}emos` : ''
}

/**
 * Deja el texto listo para colgarse de "Para ello, ": le quita el sujeto o el
 * arranque viejo y pone en futuro el verbo con el que arranca.
 */
function aFuturo(texto: string): string {
  const t = texto
    // arranque anterior, para no encimar dos: "Para lograrlo, debemos X" → "X"
    .replace(/^para\s+lograrlo,?\s*/i, '')
    .replace(/^(?:debemos|tenemos\s+que|hay\s+que|vamos\s+a)\s+/i, '')
    // la frase suele llegar como afirmación sobre el grupo: "UPAX es X" → "ser X"
    .replace(new RegExp(`^${GRUPO}\\s+(?:es|será|debe\\s+ser)\\s+`, 'i'), 'ser ')
    .trim()

  const [primera, ...resto] = t.split(/\s+/)
  const futuro = futuroDe((primera ?? '').replace(/[^\p{L}]/gu, ''))
  return futuro ? [futuro, ...resto].join(' ') : t
}

/** El campo de Propuesta de Valor al que apunta una clave, si es que apunta a uno. */
export function campoPdv(clave: string): string | null {
  const m = /^(?:cons\.)?pdv\.(existimos|promesa|puente)$/.exec(clave)
  return m ? m[1] : null
}

/** Nombres que no se pueden pasar a minúscula al empalmar el arranque. */
const PROPIOS = new Set([GRUPO, ...UNIDADES.map((u) => u.nombre.split(/\s+/)[0])].map((s) => s.toLowerCase()))

function empalma(t: string): string {
  const primera = (t.split(/\s+/)[0] ?? '').replace(/[^\p{L}\p{N}]/gu, '')
  // acrónimos y nombres propios conservan su mayúscula; una frase normal no
  if (!primera || primera === primera.toUpperCase() || PROPIOS.has(primera.toLowerCase())) return t
  return t.charAt(0).toLowerCase() + t.slice(1)
}

/**
 * Garantiza el arranque obligatorio sin tocar el contenido de la frase. Es la
 * red de seguridad: al modelo se le pide la forma correcta de entrada, esto solo
 * corrige lo que llegue mal y da forma a los borradores del motor local.
 */
export function conArranque(clave: string, texto: string): string {
  const campo = campoPdv(clave)
  const t = texto.trim()
  if (!campo || !t) return texto
  const molde = MOLDES_PDV[campo]
  if (molde.valido.test(t)) return t
  return molde.arranque + empalma(molde.previo ? molde.previo(t) : t)
}

/** Las seis claves donde vive la Propuesta de Valor: la síntesis y el campo de trabajo. */
const CLAVES_PDV = Object.keys(MOLDES_PDV).flatMap((c) => [`cons.pdv.${c}`, `pdv.${c}`])

/**
 * Corrige lo que ya está capturado. Sin esto, la regla solo aplicaría a los
 * resúmenes nuevos y un texto viejo se quedaría mal escrito para siempre.
 * Devuelve únicamente las claves que cambian.
 */
export function normalizaPdv(v: Record<string, string>): Record<string, string> {
  const cambios: Record<string, string> = {}
  CLAVES_PDV.forEach((k) => {
    const actual = (v[k] ?? '').trim()
    if (!actual) return
    const arreglado = conArranque(k, actual)
    if (arreglado !== v[k]) cambios[k] = arreglado
  })
  return cambios
}
