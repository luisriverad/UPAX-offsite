import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useStore } from '../lib/store'

/* ---------------------------------------------------------------- *
 * Chips y etiquetas
 * ---------------------------------------------------------------- */

export type ChipTone = 'gris' | 'naranja' | 'oscuro' | 'azul' | 'verde' | 'ambar' | 'rojo' | 'violeta'

export function Chip({ tone = 'gris', children }: { tone?: ChipTone; children: ReactNode }) {
  return <span className={`chip chip-${tone}`}>{children}</span>
}

/** Chip de estado de un bloque del Excel. */
export function EstadoChip({ estado, vacio }: { estado: string; vacio: string }) {
  if (estado === 'aprobado') return <Chip tone="verde">APROBADO</Chip>
  if (estado === 'revisar') return <Chip tone="ambar">REVISAR</Chip>
  if (estado === 'borrador') return <Chip tone="azul">BORRADOR</Chip>
  return <Chip tone={vacio === 'SIN DEFINIR' ? 'rojo' : 'gris'}>{vacio}</Chip>
}

/* ---------------------------------------------------------------- *
 * Contenedores
 * ---------------------------------------------------------------- */

export function Panel({
  title,
  tone = 'gris',
  right,
  children,
  className = '',
}: {
  title?: string
  tone?: ChipTone
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || right) && (
        <header className="panel-h">
          {title && (tone === 'gris' ? <span className="panel-t">{title}</span> : <Chip tone={tone}>{title}</Chip>)}
          {right}
        </header>
      )}
      {children}
    </section>
  )
}

/* ---------------------------------------------------------------- *
 * Navegación por pestañas dentro de una pantalla
 * ---------------------------------------------------------------- */

export function PillTabs<T extends string>({
  items,
  value,
  onChange,
  label,
  size = 'md',
}: {
  items: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
  label?: string
  size?: 'md' | 'sm'
}) {
  return (
    <div className={`pills ${size === 'sm' ? 'pills-sm' : ''}`}>
      {label && <span className="pills-label">{label}</span>}
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          className={`pill-btn ${it.id === value ? 'on' : ''}`}
          onClick={() => onChange(it.id)}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

export function SideTabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <nav className="side-tabs">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          className={`side-tab ${it.id === value ? 'on' : ''}`}
          onClick={() => onChange(it.id)}
        >
          {it.label}
        </button>
      ))}
    </nav>
  )
}

/* ---------------------------------------------------------------- *
 * Campos de captura, todos enganchados al store
 * ---------------------------------------------------------------- */

/** Textarea que crece con el contenido. */
export function Field({
  k,
  placeholder,
  className = '',
  rows = 1,
}: {
  k: string
  placeholder?: string
  className?: string
  rows?: number
}) {
  const { get, set } = useStore()
  const ref = useRef<HTMLTextAreaElement>(null)
  const value = get(k)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      className={`field ${className}`}
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={(e) => set(k, e.target.value)}
    />
  )
}

/** Entrada de una sola línea, para celdas de tabla. */
export function Line({
  k,
  placeholder,
  className = '',
  align,
}: {
  k: string
  placeholder?: string
  className?: string
  align?: 'center'
}) {
  const { get, set } = useStore()
  return (
    <input
      className={`line ${align === 'center' ? 'center' : ''} ${className}`}
      placeholder={placeholder}
      value={get(k)}
      onChange={(e) => set(k, e.target.value)}
    />
  )
}

/** Celda con chip de imperativo a la izquierda y campo a la derecha. */
export function FilaImperativo({ label, k, placeholder }: { label: string; k: string; placeholder: string }) {
  return (
    <div className="fila-imp">
      <span className="imp-tag">{label}</span>
      <Field k={k} placeholder={placeholder} />
    </div>
  )
}

/* ---------------------------------------------------------------- *
 * Varios
 * ---------------------------------------------------------------- */

export function Foot({ children }: { children: ReactNode }) {
  return <p className="panel-foot">{children}</p>
}

export function Btn({
  children,
  onClick,
  tone = 'ghost',
  disabled,
  title,
}: {
  children: ReactNode
  onClick?: () => void
  tone?: 'ghost' | 'dark' | 'orange'
  disabled?: boolean
  title?: string
}) {
  return (
    <button type="button" className={`btn btn-${tone}`} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  )
}
