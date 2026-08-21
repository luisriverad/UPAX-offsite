import type { ScreenMeta } from '../../types'

export interface ScreenProps {
  screen: ScreenMeta
  /** salta al índice de pantalla indicado */
  onGo: (i: number) => void
}

/** Desde qué pantalla se edita cada bloque de la matriz maestra. */
export const PANTALLA_DE_BLOQUE: Record<string, number> = {
  pdv: 5,
  imp: 6,
  'cul.cond': 7,
  'cul.prac': 8,
  'cul.mec': 8,
  'neg.est': 9,
  'neg.ind': 9,
  'neg.proc': 10,
  'neg.pol': 10,
}
