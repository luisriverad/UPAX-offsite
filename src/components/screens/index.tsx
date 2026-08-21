import type { ComponentType } from 'react'
import S00Manifiesto from './S00Manifiesto'
import S01Metodo from './S01Metodo'
import S02Ceo from './S02Ceo'
import S03Dgs from './S03Dgs'
import S04Consolidado from './S04Consolidado'
import S05Propuesta from './S05Propuesta'
import S06Imperativos from './S06Imperativos'
import S07Conductas from './S07Conductas'
import S08Practicas from './S08Practicas'
import S09Negocio from './S09Negocio'
import S12Final from './S12Final'
import type { ScreenProps } from './tipos'

/** Una pantalla del diseño funcional por cada id de `SCREENS`. */
export const PANTALLAS: Record<string, ComponentType<ScreenProps>> = {
  s01: S01Metodo,
  s00: S00Manifiesto,
  s02: S02Ceo,
  s03: S03Dgs,
  s04: S04Consolidado,
  s05: S05Propuesta,
  s06: S06Imperativos,
  s07: S07Conductas,
  s08: S08Practicas,
  s09: S09Negocio,
  s12: S12Final,
}
