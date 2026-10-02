import { createSpace } from './space'
import { createSaturn } from './saturn'
import { createHeart } from './heart'
import { createLoveText } from './loveText'

export { COUNT } from './utils'

export function buildFormations() {
  return {
    space: createSpace(),
    saturn: createSaturn(),
    heart: createHeart(),
    love: createLoveText(),
  }
}
