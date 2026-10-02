import * as THREE from 'three'
import { COUNT, makeFormation, rand, setPoint } from './utils'

export function createSpace() {
  const f = makeFormation()
  const c = new THREE.Color()
  for (let j = 0; j < COUNT; j++) {
    const r = 3 + Math.cbrt(Math.random()) * 10
    const theta = rand(0, Math.PI * 2)
    const phi = Math.acos(rand(-1, 1))
    const x = r * Math.sin(phi) * Math.cos(theta)
    const y = r * Math.sin(phi) * Math.sin(theta)
    const z = r * Math.cos(phi)
    const roll = Math.random()
    if (roll < 0.12) c.setHSL(0.1, 0.4, 0.85) // warm white stars
    else if (roll < 0.3) c.setHSL(rand(0.88, 0.95), 0.7, 0.65) // pink nebula dust
    else c.setHSL(rand(0.56, 0.74), 0.65, rand(0.55, 0.75)) // blue / violet
    setPoint(f, j, x, y, z, rand(0.8, 3.2), c)
  }
  return f
}
