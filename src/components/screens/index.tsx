import type { ComponentType } from 'react'
import S01Mapa from './S01Mapa'
import S02Ceo from './S02Ceo'
import S03Dgs from './S03Dgs'
import S04Consolidado from './S04Consolidado'
import S05Propuesta from './S05Propuesta'
import S06Imperativos from './S06Imperativos'
import S07Conductas from './S07Conductas'
import S08Practicas from './S08Practicas'
import S09Estandares from './S09Estandares'
import S10Procesos from './S10Procesos'
import S11Offsite from './S11Offsite'
import S12Final from './S12Final'
import type { ScreenProps } from './tipos'

/** Una pantalla del diseño funcional por cada id de `SCREENS`. */
export const PANTALLAS: Record<string, ComponentType<ScreenProps>> = {
  s01: S01Mapa,
  s02: S02Ceo,
  s03: S03Dgs,
  s04: S04Consolidado,
  s05: S05Propuesta,
  s06: S06Imperativos,
  s07: S07Conductas,
  s08: S08Practicas,
  s09: S09Estandares,
  s10: S10Procesos,
  s11: S11Offsite,
  s12: S12Final,
}
