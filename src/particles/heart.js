import * as THREE from 'three'
import { COUNT, makeFormation, rand, setPoint } from './utils'

const SCALE = 0.22

/** Classic heart curve: x = 16 sin³t, y = 13cos t − 5cos 2t − 2cos 3t − cos 4t, extruded in z. */
export function createHeart() {
  const f = makeFormation()
  const c = new THREE.Color()
  for (let j = 0; j < COUNT; j++) {
    const t = rand(0, Math.PI * 2)
    const surface = Math.random() < 0.65
    const s = surface ? 1 - Math.random() * 0.06 : Math.sqrt(Math.random()) * 0.92
    const hx = 16 * Math.pow(Math.sin(t), 3)
    const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    const x = hx * s
    const y = hy * s + 2.5 // re-centre vertically
    const depth = 8 * Math.sqrt(Math.max(0, 1 - (hx * hx) / 289))
    const z = rand(-1, 1) * depth * s
    c.setHSL(rand(0.95, 1.0) % 1, 0.9, surface ? rand(0.55, 0.68) : rand(0.4, 0.55))
    setPoint(f, j, x * SCALE, y * SCALE, z * SCALE, surface ? rand(2.2, 3.4) : rand(1.4, 2.4), c)
  }
  return f
}
