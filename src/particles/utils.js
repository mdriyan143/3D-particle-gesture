export const COUNT = 1500

export const rand = (a, b) => a + Math.random() * (b - a)

export function makeFormation() {
  return {
    positions: new Float32Array(COUNT * 3),
    sizes: new Float32Array(COUNT),
    colors: new Float32Array(COUNT * 3),
  }
}

export function setPoint(f, j, x, y, z, size, color) {
  const i = j * 3
  f.positions[i] = x
  f.positions[i + 1] = y
  f.positions[i + 2] = z
  f.sizes[j] = size
  f.colors[i] = color.r
  f.colors[i + 1] = color.g
  f.colors[i + 2] = color.b
}
