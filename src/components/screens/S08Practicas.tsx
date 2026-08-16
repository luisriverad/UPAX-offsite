import { K } from '../../lib/model'
import ParPaneles from './ParPaneles'

export default function S08Practicas() {
  return (
    <ParPaneles
      izq={{ titulo: 'PRÁCTICAS CORPORATIVAS', key: K.prac, placeholder: 'Práctica concreta y repetible…' }}
      der={{ titulo: 'MECANISMOS DE REFUERZO', key: K.mec, placeholder: 'Bono / reconocimiento / consecuencia…' }}
    />
  )
}
