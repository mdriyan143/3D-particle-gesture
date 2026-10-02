import { useEffect, useRef } from 'react'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
const MODEL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0))

/** Rotation-invariant: a finger is extended when its tip is farther from the wrist than its PIP joint. */
export function classify(lm) {
  const wrist = lm[0]
  const ext = (tip, pip) => dist(lm[tip], wrist) > dist(lm[pip], wrist) * 1.15
  const index = ext(8, 6)
  const middle = ext(12, 10)
  const ring = ext(16, 14)
  const pinky = ext(20, 18)

  if (!index && !middle && !ring && !pinky) return 'heart' // fist
  if (index && !middle && !ring && !pinky) return 'saturn' // one finger
  if (index && middle && !ring && !pinky) return 'love' // two fingers
  return 'space'
}

const TIPS = [4, 8, 12, 16, 20] // thumb, index, middle, ring, pinky
const COLORS = ['#ff5c8a', '#3dffa8', '#5cc8ff', '#ffd75c', '#c58bff']
const BONES = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]]

/** Draw fingertip dots (and a faint skeleton) on the overlay canvas. Canvas is CSS-mirrored like the video. */
function draw(canvas, video, lm) {
  if (!canvas) return
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  const dpr = window.devicePixelRatio || 1
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr
    canvas.height = h * dpr
  }
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  if (!lm) return

  // match object-fit: cover
  const vw = video.videoWidth || w
  const vh = video.videoHeight || h
  const scale = Math.max(w / vw, h / vh)
  const ox = (w - vw * scale) / 2
  const oy = (h - vh * scale) / 2
  const pt = (p) => [ox + p.x * vw * scale, oy + p.y * vh * scale]

  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  for (const [a, b] of BONES) {
    const [x1, y1] = pt(lm[a])
    const [x2, y2] = pt(lm[b])
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
  }
  ctx.stroke()

  TIPS.forEach((i, k) => {
    const [x, y] = pt(lm[i])
    ctx.shadowColor = COLORS[k]
    ctx.shadowBlur = 12
    ctx.fillStyle = COLORS[k]
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.stroke()
  })
}

const STABLE_FRAMES = 4 // consecutive identical readings before switching
const LOST_FRAMES = 20 // frames without a hand before falling back to space
const INTERVAL = 1000 / 30 // detection capped at ~30 Hz, independent of render loop

export default function HandTracker({ videoRef, canvasRef, handRef, enabled, onGesture, onHand, onStatus }) {
  const cb = useRef({ onGesture, onHand, onStatus })
  cb.current = { onGesture, onHand, onStatus }

  useEffect(() => {
    if (!enabled) return
    let landmarker = null
    let raf = 0
    let cancelled = false
    let lastTime = -1
    let lastRun = 0
    let candidate = null
    let streak = 0
    let current = 'space'
    let missing = 0
    let detected = false

    const setDetected = (v) => {
      if (v !== detected) {
        detected = v
        cb.current.onHand(v)
      }
    }

    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      const video = videoRef.current
      if (!video || video.readyState < 2 || now - lastRun < INTERVAL || video.currentTime === lastTime) return
      lastRun = now
      lastTime = video.currentTime

      const result = landmarker.detectForVideo(video, now)
      let g
      draw(canvasRef?.current, video, result.landmarks?.[0])
      if (handRef) {
        const lm = result.landmarks?.[0]
        if (lm) {
          // palm centre; mirrored (like the preview) and stretched 1.3x so the edges of the screen are reachable
          const palm = [0, 5, 9, 13, 17]
          const cx = palm.reduce((a, i) => a + lm[i].x, 0) / palm.length
          const cy = palm.reduce((a, i) => a + lm[i].y, 0) / palm.length
          const clamp = (v) => Math.max(-1, Math.min(1, v))
          handRef.current.x = clamp((1 - cx) * 2 - 1) * 1.3
          handRef.current.y = clamp(1 - cy * 2) * 1.3
          handRef.current.x = clamp(handRef.current.x)
          handRef.current.y = clamp(handRef.current.y)
          handRef.current.active = true
        } else if (missing >= 4) handRef.current.active = false
      }
      if (result.landmarks && result.landmarks.length) {
        missing = 0
        setDetected(true)
        g = classify(result.landmarks[0])
      } else {
        if (++missing < LOST_FRAMES) return
        setDetected(false)
        g = 'space'
      }

      if (g === candidate) streak++
      else {
        candidate = g
        streak = 1
      }
      if (streak >= STABLE_FRAMES && g !== current) {
        current = g
        cb.current.onGesture(g)
      }
    }

    ;(async () => {
      cb.current.onStatus('loading')
      try {
        const fileset = await FilesetResolver.forVisionTasks(WASM)
        const make = (delegate) =>
          HandLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: MODEL, delegate },
            runningMode: 'VIDEO',
            numHands: 1,
          })
        try {
          landmarker = await make('GPU')
        } catch {
          landmarker = await make('CPU')
        }
        if (cancelled) {
          landmarker.close()
          return
        }
        cb.current.onStatus('ready')
        raf = requestAnimationFrame(loop)
      } catch (err) {
        console.error('Hand tracker failed to load', err)
        if (!cancelled) cb.current.onStatus('error')
      }
    })()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      landmarker?.close()
      if (handRef) handRef.current.active = false
      draw(canvasRef?.current, videoRef.current || { videoWidth: 1, videoHeight: 1 }, null)
      setDetected(false)
    }
  }, [enabled, videoRef, canvasRef, handRef])

  return null
}
