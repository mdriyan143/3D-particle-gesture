import * as THREE from 'three'
import { COUNT, makeFormation, rand, setPoint } from './utils'

const TEXT = 'I LOVE YOU'
const W = 1000
const H = 260
const WORLD_WIDTH = 9.6

/** Rasterises the text on an offscreen canvas and samples lit pixels as 3D particle targets. */
export function createLoveText() {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const family = '"Arial Black", Impact, "Helvetica Neue", Arial, sans-serif'

  let size = 200
  ctx.font = `900 ${size}px ${family}`
  size = Math.floor(size * Math.min(1, (W * 0.94) / ctx.measureText(TEXT).width))
  ctx.font = `900 ${size}px ${family}`
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(TEXT, W / 2, H / 2)

  const data = ctx.getImageData(0, 0, W, H).data
  const pts = []
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (data[(y * W + x) * 4 + 3] > 128) pts.push(x, y)
    }
  }
  const n = pts.length / 2

  // Partial Fisher–Yates: pick COUNT random lit pixels
  const idx = Uint32Array.from({ length: n }, (_, i) => i)
  const pick = Math.min(COUNT, n)
  for (let i = 0; i < pick; i++) {
    const r = i + Math.floor(Math.random() * (n - i))
    const tmp = idx[i]
    idx[i] = idx[r]
    idx[r] = tmp
  }

  const f = makeFormation()
  const c = new THREE.Color()
  for (let j = 0; j < COUNT; j++) {
    const p = idx[j % pick]
    const px = pts[p * 2]
    const py = pts[p * 2 + 1]
    const x = ((px - W / 2) / W) * WORLD_WIDTH
    const y = (-(py - H / 2) / W) * WORLD_WIDTH
    c.setHSL(0.95 - (px / W) * 0.22, 0.85, rand(0.6, 0.72))
    setPoint(f, j, x, y, rand(-0.25, 0.25), rand(2.0, 3.2), c)
  }
  return f
}
