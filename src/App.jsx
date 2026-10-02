import { useCallback, useEffect, useRef, useState } from 'react'
import ParticleScene from './components/ParticleScene.jsx'
import WebcamPreview from './components/WebcamPreview.jsx'
import HandTracker from './components/HandTracker.jsx'
import GestureUI from './components/GestureUI.jsx'
import { MODES, ORDER } from './modes.js'

export default function App() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const handRef = useRef({ active: false, x: 0, y: 0 }) // palm position (-1..1) shared with the particle scene
  const [mode, setMode] = useState('space')
  const [handDetected, setHandDetected] = useState(false)
  const [camStatus, setCamStatus] = useState('requesting') // requesting | live | denied | unsupported | error
  const [trackerStatus, setTrackerStatus] = useState('idle') // idle | loading | ready | error
  const [attempt, setAttempt] = useState(0)

  const handleGesture = useCallback((g) => setMode(g), [])

  // Keyboard fallback: 1-4
  useEffect(() => {
    const onKey = (e) => {
      const id = ORDER.find((m) => MODES[m].key === e.key)
      if (id) setMode(id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="fixed inset-0">
      <ParticleScene mode={mode} handRef={handRef} />
      <GestureUI
        mode={mode}
        handDetected={handDetected}
        camStatus={camStatus}
        trackerStatus={trackerStatus}
        onSelect={setMode}
      />
      <WebcamPreview
        videoRef={videoRef}
        canvasRef={canvasRef}
        status={camStatus}
        onStatus={setCamStatus}
        attempt={attempt}
        onRetry={() => {
          setCamStatus('requesting')
          setAttempt((a) => a + 1)
        }}
        handDetected={handDetected}
      />
      <HandTracker
        videoRef={videoRef}
        canvasRef={canvasRef}
        handRef={handRef}
        enabled={camStatus === 'live'}
        onGesture={handleGesture}
        onHand={setHandDetected}
        onStatus={setTrackerStatus}
      />
    </div>
  )
}
