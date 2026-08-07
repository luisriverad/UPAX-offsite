import { avanceTotal } from '../../lib/model'
import { useStore } from '../../lib/store'
import { Chip, Foot, Panel } from '../ui'
import Matriz from './Matriz'
import Redaccion from './Redaccion'
import type { ScreenProps } from './tipos'
import { PANTALLA_DE_BLOQUE } from './tipos'

export default function S01Mapa({ screen, onGo }: ScreenProps) {
  const { values, get } = useStore()
  const avance = avanceTotal(values)

  return (
    <div className="mapa">
      <Panel
        title="ARQUITECTURA UPAX"
        right={
          <span className="panel-right">
            <span className="muted">{avance}% completado</span>
            <Chip tone="gris">VERSIÓN {get('ver') || '0.1'}</Chip>
          </span>
        }
      >
        <Matriz onIr={(key) => onGo(PANTALLA_DE_BLOQUE[key] ?? 0)} />
        <Foot>{screen.foot}</Foot>
      </Panel>

      <Redaccion onGo={onGo} />
    </div>
  )
}
