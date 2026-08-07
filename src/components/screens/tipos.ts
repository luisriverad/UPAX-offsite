import type { ScreenMeta } from '../../types'

export interface ScreenProps {
  screen: ScreenMeta
  /** salta al índice de pantalla indicado */
  onGo: (i: number) => void
}

/** Desde qué pantalla se edita cada bloque de la matriz maestra. */
export const PANTALLA_DE_BLOQUE: Record<string, number> = {
  pdv: 4,
  imp: 5,
  'cul.cond': 6,
  'cul.prac': 7,
  'cul.mec': 7,
  'neg.est': 8,
  'neg.ind': 8,
  'neg.proc': 9,
  'neg.pol': 9,
}
