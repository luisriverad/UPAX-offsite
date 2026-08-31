/**
 * Regla de atribución del documento: el hallazgo se dice completo, pero sin
 * nombre de quien lo dijo. No es pudor ni suavizado, es lo contrario: en una
 * mesa con muchos egos, poner el nombre de la empresa o del puesto hace que se
 * discuta a la persona en vez del hecho, y el hallazgo se pierde. Sin dueño, la
 * evidencia se puede leer en voz alta y seguir siendo dura.
 *
 * Vive en un solo lugar porque aplica a TODA interpretación que escriba la
 * plataforma, no solo a la que la estrenó, y se aplica por los dos lados: se le
 * pide al modelo antes de escribir y se tapa lo que se le escape.
 */

/** Lo que se le dice al modelo, literal, en todos los prompts que interpretan. */
export const REGLA_ATRIBUCION = [
  'REGLA DE ATRIBUCIÓN, INNEGOCIABLE: dices el hallazgo completo, nunca de quién es. Hablas SIEMPRE en genérico.',
  'Prohibido escribir el nombre de una unidad de negocio o de una empresa del grupo. Prohibido escribir "el CEO", "la dirección", "el director", "el DG" o cualquier puesto. Prohibido cualquier nombre de persona.',
  'Nada de "Tal empresa dice", "el CEO define", "según tal unidad", "el director de tal área admite". Ese señalamiento convierte un diagnóstico en una acusación con destinatario, y la mesa termina discutiendo a quién nombraste en vez de lo que encontraste.',
  'Así se escribe en su lugar. "Se menciona que", "una empresa afirma", "en algunos casos se desconoce", "varias empresas coinciden en", "hacia adentro se reconoce", "en las entrevistas se declara", "la evidencia muestra".',
  'El contenido NO se suaviza ni se recorta por esto. La evidencia se escribe igual de dura, con el mismo dato y el mismo detalle, solo que sin dueño. Quitar el nombre nunca es excusa para quitar el hecho.',
  'Las citas textuales se conservan entre comillas, pero entran sin decir de quién son. "Una empresa lo dice sin rodeos, actualmente no lo sé" es correcto. Ponerle nombre a esa cita no lo es.',
  'Sí puedes decir cuántas voces sostienen algo, porque un número es información y no señala a nadie.',
  'Sí puedes nombrar a un cliente o a una empresa de fuera cuando el dato lo exige, porque eso es un hecho de mercado y no un señalamiento hacia adentro.',
  'Esta regla es sobre lo que ESCRIBES. Para ponderar y concluir sigues usando quién dijo qué, con todo el detalle que tengas.',
  'Si el material que recibes viene lleno de nombres propios, los dejas fuera al redactar tu conclusión.',
].join('\n')

/**
 * Nombres que además de identificar una unidad son vocabulario corriente de
 * negocio. A estos no se les puede pasar la goma a ciegas: "construido para
 * Marketing" habla del área y tiene que sobrevivir, mientras que "Marketing lo
 * dice sin anestesia" es una atribución y se tapa. Por eso solo se sustituyen
 * cuando están hablando.
 */
const AMBIGUAS = new Set([
  'marketing',
  'finanzas',
  'house',
  'promo',
  'ventas',
  'comercial',
  'operaciones',
  'digital',
  'medios',
  'datos',
  'contenido',
  'creativa',
  'estudio',
  'produccion',
  'producción',
  'tecnologia',
  'tecnología',
])

/** Verbos con los que una empresa "habla" en el texto, y las partículas que se cuelan antes. */
const CLITICOS = '(?:\\s+(?:lo|la|le|les|se|ya|también|incluso|tampoco|no|sí))*'
const DECIR =
  '(?:dice|dicen|dijo|dijeron|afirma|afirman|admite|admiten|reconoce|reconocen|menciona|mencionan|declara|declaran|' +
  'responde|responden|contesta|contestan|señala|señalan|sostiene|sostienen|indica|indican|comenta|comentan|apunta|' +
  'apuntan|explica|explican|describe|describen|desconoce|desconocen|niega|niegan|acepta|aceptan|habla|hablan|' +
  'propone|proponen|pide|piden|plantea|plantean|define|definen|reporta|reportan|insiste|insisten|advierte|advierten)'

const escapar = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Todas las formas en que un nombre aparece en el texto: el nombre completo y
 * la forma corta con la que se le llama de dientes para adentro, que es por
 * donde se cuela ("el ingreso de Mexa" en vez de "Mexa Creativa").
 */
function formas(nombres: string[]): { duras: string[]; ambiguas: string[] } {
  const duras = new Set<string>()
  const ambiguas = new Set<string>()

  nombres
    .map((n) => n.trim())
    .filter((n) => n.length > 2)
    .forEach((n) => {
      ;(AMBIGUAS.has(n.toLowerCase()) ? ambiguas : duras).add(n)
      const primera = n.split(/\s+/)[0]
      if (primera && primera !== n && primera.length > 2)
        (AMBIGUAS.has(primera.toLowerCase()) ? ambiguas : duras).add(primera)
    })

  // primero los nombres largos: si no, "Mexa" se come a "Mexa Creativa"
  const ordenar = (s: Set<string>) => [...s].sort((a, b) => b.length - a.length).map(escapar)
  return { duras: ordenar(duras), ambiguas: ordenar(ambiguas) }
}

/**
 * Red de seguridad sobre lo que llega del modelo y sobre lo que ya se guardó
 * antes de que existiera la regla. El prompt es la defensa principal, porque
 * redactar en genérico desde el principio sale mejor que taparlo después; esto
 * solo cubre el nombre que se escape, que es justo el que mete en problemas.
 */
export function sinAtribucion(texto: string, nombres: string[]): string {
  if (!texto) return texto
  const { duras, ambiguas } = formas(nombres)
  let out = texto

  if (duras.length) {
    const uno = `(?:${duras.join('|')})`
    // una enumeración de empresas se resuelve por cantidad, no nombre por nombre
    out = out.replace(new RegExp(`\\b${uno}(?:\\s*,\\s*|\\s+y\\s+)${uno}(?:(?:\\s*,\\s*|\\s+y\\s+)${uno})*\\b`, 'g'), 'varias empresas')
    out = out.replace(new RegExp(`\\b${uno}\\b`, 'g'), 'una empresa')
  }

  // los nombres que también son palabra de negocio: solo cuando están hablando
  if (ambiguas.length) {
    const uno = `(?:${ambiguas.join('|')})`
    out = out.replace(new RegExp(`\\b${uno}\\b(?=${CLITICOS}\\s+${DECIR}\\b)`, 'g'), 'una empresa')
    out = out.replace(new RegExp(`\\b[Ss]egún\\s+${uno}\\b`, 'g'), 'según se menciona')
  }

  out = out
    // el puesto que habla se vuelve impersonal, que es como se lee en la mesa
    .replace(new RegExp(`\\b[Ee]l (?:CEO|DG|director general|director|presidente)\\b(?=${CLITICOS}\\s+${DECIR}\\b)`, 'g'), 'se')
    .replace(new RegExp(`\\b[Ll]a dirección\\b(?=${CLITICOS}\\s+${DECIR}\\b)`, 'g'), 'se')
    .replace(/\b[Ss]egún (?:el CEO|la dirección|el director general|el DG)\b/g, 'según se menciona')
    .replace(/\bse se\b/g, 'se')
    .replace(/\buna empresa,\s*una empresa\b/g, 'varias empresas')
    .replace(/[ \t]{2,}/g, ' ')

  // lo que quedó al arranque de una frase vuelve a empezar con mayúscula
  return out.replace(
    /(^|[.!?]\s+)(una empresa|varias empresas|se|según)\b/g,
    (_m, antes: string, palabra: string) => `${antes}${palabra[0].toUpperCase()}${palabra.slice(1)}`,
  )
}
