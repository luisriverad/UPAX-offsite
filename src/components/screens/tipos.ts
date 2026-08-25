import type { ScreenMeta } from '../../types'

export interface ScreenProps {
  screen: ScreenMeta
  /** salta al índice de pantalla indicado */
  onGo: (i: number) => void
}

/** Desde qué pantalla se edita cada bloque de la matriz maestra. */
export const PANTALLA_DE_BLOQUE: Record<string, number> = {
  pdv: 6,
  imp: 7,
  'cul.cond': 8,
  'cul.prac': 9,
  'cul.mec': 9,
  'neg.est': 10,
  'neg.ind': 10,
  'neg.proc': 11,
  'neg.pol': 11,
}
