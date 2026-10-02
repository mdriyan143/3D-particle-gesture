import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { COUNT, buildFormations } from '../particles'

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float twinkle = 0.8 + 0.2 * sin(uTime * 2.0 + aPhase);
    gl_PointSize = aSize * twinkle * uPixelRatio * (30.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`
const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = pow(1.0 - d * 2.0, 1.6);
    gl_FragColor = vec4(vColor * (0.6 + a), a);
  }
`

const REACH = 2.6 // how far (scene units) the hand pushes particles
const now = () => performance.now() / 1000

function Particles({ mode, handRef }) {
  const group = useRef()
  const formations = useMemo(() => buildFormations(), [])

  // Allocated once: current (live) buffers, per-particle speed/phase, geometry, material.
  const { geometry, material, cur, speed, vel } = useMemo(() => {
    const start = formations.space
    const cur = {
      positions: Float32Array.from(start.positions),
      sizes: Float32Array.from(start.sizes),
      colors: Float32Array.from(start.colors),
    }
    const speed = new Float32Array(COUNT)
    const phase = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      speed[i] = 0.55 + Math.random() * 0.9
      phase[i] = Math.random() * Math.PI * 2
    }
    const geometry = new THREE.BufferGeometry()
    const add = (name, arr, size, dynamic) => {
      const a = new THREE.BufferAttribute(arr, size)
      if (dynamic) a.setUsage(THREE.DynamicDrawUsage)
      geometry.setAttribute(name, a)
    }
    add('position', cur.positions, 3, true)
    add('aSize', cur.sizes, 1, true)
    add('aColor', cur.colors, 3, true)
    add('aPhase', phase, 1, false)

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { geometry, material, cur, speed, vel: new Float32Array(COUNT * 3) }
  }, [formations])

  // smoothed hand state + mouse/finger fallback so it also works without a camera
  const hs = useRef({ wx: 0, wy: 0, vx: 0, vy: 0, act: 0, init: false })
  const ptr = useRef({ x: 0, y: 0, t: -99 })
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), q: new THREE.Quaternion() }), [])
  useEffect(() => {
    const move = (e) => {
      ptr.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: -((e.clientY / window.innerHeight) * 2 - 1), t: now() }
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const k = 1 - Math.exp(-dt * 3.2) // frame-rate independent smoothing factor
    const t = formations[mode]
    const P = cur.positions, TP = t.positions
    const S = cur.sizes, TS = t.sizes
    const C = cur.colors, TC = t.colors

    // ---- hand / pointer interaction
    const gr = group.current
    const H = handRef?.current
    const pt = ptr.current
    const h = hs.current
    let on = false, nx = 0, ny = 0
    if (H?.active) { on = true; nx = H.x; ny = H.y }
    else if (now() - pt.t < 1.5) { on = true; nx = pt.x; ny = pt.y }
    if (on) {
      const halfH = state.camera.position.z * Math.tan(THREE.MathUtils.degToRad(state.camera.fov / 2))
      const wx = nx * halfH * (state.size.width / state.size.height)
      const wy = ny * halfH
      if (!h.init) { h.wx = wx; h.wy = wy; h.init = true }
      const a = 1 - Math.exp(-dt * 18)
      const px = h.wx + (wx - h.wx) * a
      const py = h.wy + (wy - h.wy) * a
      const b = 1 - Math.exp(-dt * 12)
      h.vx += ((px - h.wx) / dt - h.vx) * b
      h.vy += ((py - h.wy) / dt - h.vy) * b
      h.wx = px; h.wy = py
    } else {
      h.init = false
      h.vx *= 0.85; h.vy *= 0.85
    }
    h.act += ((on ? 1 : 0) - h.act) * (1 - Math.exp(-dt * 8))
    const act = h.act
    let lx = 0, ly = 0, lz = 0, lvx = 0, lvy = 0, lvz = 0, shake = 0
    if (act > 0.01) {
      tmp.p.set(h.wx, h.wy, 0); gr.worldToLocal(tmp.p)
      lx = tmp.p.x; ly = tmp.p.y; lz = tmp.p.z
      tmp.v.set(h.vx, h.vy, 0).applyQuaternion(tmp.q.copy(gr.quaternion).invert()).multiplyScalar(1 / gr.scale.x)
      lvx = tmp.v.x; lvy = tmp.v.y; lvz = tmp.v.z
      shake = THREE.MathUtils.clamp((Math.hypot(h.vx, h.vy) - 4) / 10, 0, 1) * act // fast waving = shake everything
    }
    const damp = Math.exp(-dt * 2.6)

    for (let j = 0; j < COUNT; j++) {
      const kk = Math.min(1, k * speed[j])
      const i = j * 3
      if (act > 0.01) {
        const dx = P[i] - lx, dy = P[i + 1] - ly, dz = P[i + 2] - lz
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz * 0.25) + 1e-4
        if (d < REACH) {
          let f = 1 - d / REACH
          f *= f
          const push = f * 38 * dt * act
          vel[i] += (dx / d) * push + lvx * f * 7 * dt * act
          vel[i + 1] += (dy / d) * push + lvy * f * 7 * dt * act
          vel[i + 2] += (dz / d) * push * 0.5 + lvz * f * 7 * dt * act
        }
        if (shake > 0) {
          const s = shake * 90 * dt
          vel[i] += (Math.random() - 0.5) * s
          vel[i + 1] += (Math.random() - 0.5) * s
          vel[i + 2] += (Math.random() - 0.5) * s
        }
      }
      vel[i] = THREE.MathUtils.clamp(vel[i] * damp, -18, 18)
      vel[i + 1] = THREE.MathUtils.clamp(vel[i + 1] * damp, -18, 18)
      vel[i + 2] = THREE.MathUtils.clamp(vel[i + 2] * damp, -18, 18)
      P[i] += (TP[i] - P[i]) * kk + vel[i] * dt
      P[i + 1] += (TP[i + 1] - P[i + 1]) * kk + vel[i + 1] * dt
      P[i + 2] += (TP[i + 2] - P[i + 2]) * kk + vel[i + 2] * dt
      S[j] += (TS[j] - S[j]) * kk
      C[i] += (TC[i] - C[i]) * kk
      C[i + 1] += (TC[i + 1] - C[i + 1]) * kk
      C[i + 2] += (TC[i + 2] - C[i + 2]) * kk
    }
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.aSize.needsUpdate = true
    geometry.attributes.aColor.needsUpdate = true

    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uPixelRatio.value = state.gl.getPixelRatio()

    // Group motion + responsive scale
    const g = group.current
    const aspect = state.size.width / state.size.height
    const base = THREE.MathUtils.clamp(aspect / 1.2, 0.5, 1)
    let pulse = 1
    if (mode === 'heart') pulse = 1 + 0.05 * Math.sin(state.clock.elapsedTime * 4)
    const s = base * pulse
    g.scale.setScalar(g.scale.x + (s - g.scale.x) * 0.15)

    if (mode === 'love') {
      g.rotation.y = ((g.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI
      const target = Math.sin(state.clock.elapsedTime * 0.6) * 0.2
      g.rotation.y += (target - g.rotation.y) * 0.05
      g.rotation.x += (0 - g.rotation.x) * 0.05
    } else {
      g.rotation.y += dt * (mode === 'space' ? 0.04 : 0.18)
      g.rotation.x += ((mode === 'saturn' ? 0.15 : 0) - g.rotation.x) * 0.03
    }
  })

  return (
    <group ref={group}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  )
}

export default function ParticleScene({ mode, handRef }) {
  return (
    <div className="absolute inset-0 touch-none">
      <Canvas
        camera={{ position: [0, 0, 11], fov: 55 }}
        dpr={[1, 2]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#05060f']} />
        <Particles mode={mode} handRef={handRef} />
        <OrbitControls enableZoom={false} enablePan={false} enableDamping dampingFactor={0.06} rotateSpeed={0.5} />
      </Canvas>
    </div>
  )
}
