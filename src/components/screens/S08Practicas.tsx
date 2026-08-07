import { K } from '../../lib/model'
import { Foot } from '../ui'
import ParPaneles from './ParPaneles'
import type { ScreenProps } from './tipos'

export default function S08Practicas({ screen }: ScreenProps) {
  return (
    <ParPaneles
      izq={{ titulo: 'PRÁCTICAS CORPORATIVAS', key: K.prac, placeholder: 'Práctica concreta y repetible…' }}
      der={{ titulo: 'MECANISMOS DE REFUERZO', key: K.mec, placeholder: 'Bono / reconocimiento / consecuencia…' }}
      pie={<Foot>{screen.foot}</Foot>}
    />
  )
}
