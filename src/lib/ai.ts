import { ARCHIVOS_DG, BLOQUES_CEO, CAMPOS_PROPUESTA, DGS, PREGUNTAS_DG, VISTAS_CONSOLIDADO } from '../data/content'
import {
  COND_ROWS_DEFAULT,
  IND_DEFAULT,
  K,
  archivosCargados,
  columnas,
  imperativos,
  respuestasCeo,
  unidadDe,
  respuestasDG,
} from './model'
import type { ScreenMeta, Values } from '../types'

export type AiMode = 'analizar' | 'cuestionar'

const g = (v: Values, k: string) => (v[k] ?? '').trim()
const int = (v: Values, k: string, def: number) => {
  const n = parseInt(v[k] ?? '', 10)
  return Number.isFinite(n) ? n : def
}

/** Lo capturado en la pantalla activa, en texto plano. */
export function dumpPantalla(s: ScreenMeta, v: Values): string {
  const out: string[] = []
  const cols = columnas(v)
  const porColumna = (titulo: string, key: (c: number) => string) => {
    const filas = cols.map((c) => (g(v, key(c.i)) ? `· ${c.label}: ${g(v, key(c.i))}` : '')).filter(Boolean)
    if (filas.length) out.push(titulo, ...filas)
  }

  switch (s.tab) {
    case 'ceo':
      BLOQUES_CEO.forEach((b) => {
        b.preguntas.forEach((p, q) => {
          const r = g(v, K.ceo(b.id, q))
          if (r) out.push(`[${b.label}] ${p}\n  → ${r}`)
        })
      })
      break

    case 'dgs':
      DGS.forEach((d) => {
        PREGUNTAS_DG.forEach((p, q) => {
          const r = g(v, K.dg(d, q))
          if (r) out.push(`[${unidadDe(v, d)}] ${p}\n  → ${r}`)
        })
        const arch = ARCHIVOS_DG.map((a, i) => (g(v, K.dgArch(d, i)) ? a.nombre : '')).filter(Boolean)
        if (arch.length) out.push(`[${unidadDe(v, d)}] archivos: ${arch.join(', ')}`)
      })
      break

    case 'consolidado':
      VISTAS_CONSOLIDADO.forEach((vista) => {
        vista.temas.forEach((t) => {
          const sint = g(v, K.cons(vista.id, t.id))
          if (sint) out.push(`[${vista.label} · ${t.label}] síntesis: ${sint}`)
        })
      })
      break

    case 'propuesta':
      CAMPOS_PROPUESTA.forEach((c) => {
        const t = g(v, K.pdv(c.id))
        if (t) out.push(`${c.tag}: ${t} (${g(v, K.pdvEstado(c.id)) || 'borrador'})`)
      })
      break

    case 'imperativos':
      imperativos(v).forEach((im) => {
        if (im.nombre) out.push(`Imperativo ${im.i + 1}: ${im.nombre}${im.corto ? ` — ${im.corto}` : ''}`)
      })
      break

    case 'cultura':
      if (s.id === 's07') {
        const rows = int(v, K.condRows, COND_ROWS_DEFAULT)
        cols.forEach((c) => {
          for (let r = 0; r < rows; r++) {
            const t = g(v, K.cond(c.i, r))
            if (t) out.push(`· ${c.label} / conducta ${r + 1}: ${t}`)
          }
        })
      } else {
        porColumna('PRÁCTICAS CORPORATIVAS', K.prac)
        porColumna('MECANISMOS DE REFUERZO', K.mec)
      }
      break

    case 'negocio':
      if (s.id === 's09') {
        porColumna('ESTÁNDARES', K.est)
        const n = int(v, K.indCount, IND_DEFAULT)
        const inds: string[] = []
        for (let r = 0; r < n; r++) {
          const nom = g(v, K.ind(r, 'nombre'))
          if (!nom) continue
          inds.push(
            `· ${nom}: actual ${g(v, K.ind(r, 'actual')) || '—'} → 2027 ${g(v, K.ind(r, 'meta')) || '—'} (fuente: ${
              g(v, K.ind(r, 'fuente')) || 'sin fuente'
            })`,
          )
        }
        if (inds.length) out.push('INDICADORES CRÍTICOS', ...inds)
      } else {
        porColumna('PROCESOS CRÍTICOS', K.proc)
        porColumna('POLÍTICAS', K.pol)
      }
      break

    case 'offsite':
    case 'mapa':
    case 'final':
      CAMPOS_PROPUESTA.forEach((c) => {
        const t = g(v, K.pdv(c.id))
        if (t) out.push(`${c.tag}: ${t} (${g(v, K.pdvEstado(c.id)) || 'borrador'})`)
      })
      imperativos(v).forEach((im) => {
        if (im.nombre) out.push(`Imperativo ${im.i + 1}: ${im.nombre}`)
      })
      porColumna('PRÁCTICAS', K.prac)
      porColumna('MECANISMOS', K.mec)
      porColumna('ESTÁNDARES', K.est)
      porColumna('PROCESOS', K.proc)
      porColumna('POLÍTICAS', K.pol)
      break
  }

  return out.join('\n')
}

/** Estado del taller, para que el asistente responda con la foto completa. */
export function contextoGlobal(v: Values): string {
  const out: string[] = []
  CAMPOS_PROPUESTA.forEach((c) => {
    const t = g(v, K.pdv(c.id))
    if (t) out.push(`${c.tag}: ${t}`)
  })
  const imps = imperativos(v)
    .filter((i) => i.nombre)
    .map((i) => i.nombre)
  if (imps.length) out.push(`Imperativos: ${imps.join(' / ')}`)
  out.push(
    `Evidencia: ${respuestasCeo(v)} respuestas del CEO · ${respuestasDG(v)} respuestas de DGs · ${archivosCargados(
      v,
    )} archivos`,
  )
  return out.join('\n')
}

export function construirPrompt(s: ScreenMeta, v: Values, mode: AiMode): string {
  const dump = dumpPantalla(s, v)
  const ctx = contextoGlobal(v)
  const tarea =
    mode === 'cuestionar'
      ? 'Cuestiona lo capturado como lo haría un consultor senior: señala frases genéricas, afirmaciones sin evidencia, contradicciones entre bloques y decisiones que se están evadiendo. Cierra con tres preguntas incómodas que el equipo debe responder hoy.'
      : 'Analiza lo capturado siguiendo las directrices del asistente y devuelve conclusiones accionables.'

  return [
    'Eres el asistente del proceso de arquitectura de cultura de UPAX (house of brands: investigación, datos, creatividad, medios y tecnología). Respondes en español de México, tono ejecutivo y directo, sin preámbulo.',
    '',
    `PANTALLA ${s.num}: ${s.title}`,
    `PROPÓSITO: ${s.sub}`,
    '',
    'DIRECTRICES:',
    `- ${s.copi.join('\n- ')}`,
    '',
    ctx ? `ESTADO DEL TALLER:\n${ctx}\n` : '',
    'CAPTURADO EN ESTA PANTALLA:',
    dump || '(vacío)',
    '',
    `TAREA: ${tarea}`,
    '',
    'Formato: máximo 200 palabras, viñetas cortas con "-". Sin introducción ni despedida. Cada viñeta debe poder accionarse.',
  ].join('\n')
}

/**
 * Llama a la API de Anthropic a traves del proxy de Vite (/api/anthropic).
 * La llave vive en el archivo .env del proyecto y nunca llega al navegador,
 * por eso la llamada es fetch directo y no el SDK.
 */
export async function preguntarAsistente(s: ScreenMeta, v: Values, mode: AiMode): Promise<string> {
  const res = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-opus-5',
      // el pensamiento adaptativo viene activado por defecto y consume parte de
      // max_tokens, asi que hay que dejar holgura para que no se corte la respuesta
      max_tokens: 8000,
      output_config: { effort: 'medium' },
      messages: [{ role: 'user', content: construirPrompt(s, v, mode) }],
    }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const data = (await res.json()) as {
    stop_reason?: string
    content?: Array<{ type: string; text?: string }>
  }
  if (data.stop_reason === 'refusal') throw new Error('el modelo declinó responder')
  const txt = (data.content || [])
    .filter((i) => i.type === 'text')
    .map((i) => i.text || '')
    .join('\n')
    .trim()
  if (!txt) throw new Error('respuesta vacía')
  return txt
}
