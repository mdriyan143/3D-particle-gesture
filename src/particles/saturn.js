import * as THREE from 'three'
import { COUNT, makeFormation, rand, setPoint } from './utils'

const PLANET = 700
const TILT = new THREE.Euler(0.35, 0, -0.4)

export function createSaturn() {
  const f = makeFormation()
  const c = new THREE.Color()
  const v = new THREE.Vector3()
  const golden = Math.PI * (3 - Math.sqrt(5))

  // Planet: Fibonacci sphere with banded colour
  for (let j = 0; j < PLANET; j++) {
    const y = 1 - (2 * (j + 0.5)) / PLANET
    const rad = Math.sqrt(1 - y * y)
    const a = j * golden
    const R = 1.6 + rand(-0.04, 0.04)
    v.set(Math.cos(a) * rad * R, y * R, Math.sin(a) * rad * R).applyEuler(TILT)
    c.setHSL(rand(0.08, 0.12), 0.65, 0.5 + 0.12 * Math.sin(y * 14))
    setPoint(f, j, v.x, v.y, v.z, rand(2.4, 3.2), c)
  }

  // Rings: two bands with a Cassini-style gap
  for (let j = PLANET; j < COUNT; j++) {
    const inner = Math.random() < 0.45
    const r = inner ? rand(2.4, 3.1) : rand(3.3, 4.3)
    const a = rand(0, Math.PI * 2)
    v.set(Math.cos(a) * r, rand(-0.04, 0.04), Math.sin(a) * r).applyEuler(TILT)
    c.setHSL(rand(0.1, 0.16), 0.35, rand(0.6, 0.82))
    if (!inner && Math.random() < 0.25) c.setHSL(0.55, 0.4, 0.75)
    setPoint(f, j, v.x, v.y, v.z, rand(1.0, 1.8), c)
  }
  return f
}
