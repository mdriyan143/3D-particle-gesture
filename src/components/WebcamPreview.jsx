import { useEffect } from 'react'

const MESSAGES = {
  requesting: 'Requesting camera…',
  denied: 'Camera blocked. Click the lock icon in the address bar → allow Camera, then Retry.',
  unsupported: 'Camera needs HTTPS or localhost. Open http://localhost:5173 on this device.',
  notfound: 'No camera found on this device.',
  busy: 'Camera is in use by another app (Zoom, Meet, etc). Close it and Retry.',
  error: 'Camera unavailable. Use keys 1–4 / tap the chips below.',
}

export default function WebcamPreview({ videoRef, canvasRef, status, onStatus, attempt, onRetry, handDetected }) {
  useEffect(() => {
    let stream = null
    let cancelled = false

    async function open() {
      // try nice constraints first, fall back to plain video if the camera can't match them
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })
      } catch (err) {
        if (err?.name === 'OverconstrainedError' || err?.name === 'TypeError') {
          return await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        }
        throw err
      }
    }

    async function start() {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        onStatus('unsupported')
        return
      }
      try {
        stream = await open()
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        const video = videoRef.current
        video.srcObject = stream
        await video.play()
        if (!cancelled) onStatus('live')
      } catch (err) {
        if (cancelled || err?.name === 'AbortError') return
        console.error('Camera error:', err?.name, err?.message)
        const n = err?.name
        if (n === 'NotAllowedError' || n === 'SecurityError') onStatus('denied')
        else if (n === 'NotFoundError' || n === 'DevicesNotFoundError') onStatus('notfound')
        else if (n === 'NotReadableError' || n === 'TrackStartError') onStatus('busy')
        else onStatus('error')
      }
    }
    start()

    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [videoRef, onStatus, attempt])

  const live = status === 'live'
  return (
    <div
      className={`absolute right-3 top-[calc(env(safe-area-inset-top,0px)+12px)] z-[3] aspect-[4/3] w-[140px] overflow-hidden rounded-2xl border bg-[#0b0d1c] transition-all duration-300 sm:right-4 sm:top-[calc(env(safe-area-inset-top,0px)+16px)] sm:w-[220px] ${
        handDetected
          ? 'border-[#3dffa8] shadow-[0_0_24px_rgba(61,255,168,0.35)]'
          : 'border-line shadow-[0_10px_40px_rgba(0,0,0,0.5)]'
      }`}
    >
      {/* -scale-x-100 mirrors the video (and the dots canvas) like a selfie camera */}
      <video ref={videoRef} className="size-full -scale-x-100 object-cover" playsInline muted />
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 size-full -scale-x-100" />
      {!live && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/90 p-2.5 text-center text-[11px] leading-snug text-muted">
          <p>{MESSAGES[status] ?? MESSAGES.error}</p>
          {status !== 'requesting' && (
            <button onClick={onRetry} className="cursor-pointer rounded-full border border-line bg-glass px-3 py-1 text-[11px] text-fg">
              Retry
            </button>
          )}
        </div>
      )}
      {live && <span className="absolute left-2 top-2 size-2 animate-blink rounded-full bg-[#ff3b5c]" />}
    </div>
  )
}
