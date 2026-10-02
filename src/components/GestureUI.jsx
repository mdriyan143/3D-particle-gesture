import { MODES, ORDER } from '../modes.js'

function statusText(camStatus, trackerStatus, handDetected) {
  if (camStatus !== 'live') return camStatus === 'requesting' ? 'Waiting for camera' : 'Manual mode'
  if (trackerStatus === 'loading' || trackerStatus === 'idle') return 'Loading hand model…'
  if (trackerStatus === 'error') return 'Tracker failed · manual mode'
  return handDetected ? 'Hand detected' : 'Show your hand'
}

export default function GestureUI({ mode, handDetected, camStatus, trackerStatus, onSelect }) {
  const m = MODES[mode]
  return (
    <>
      <header className="pointer-events-none absolute left-0 top-0 z-[2] flex flex-col gap-3 pl-3 pr-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] sm:pl-4">
        <div className="text-xs font-extrabold tracking-[0.3em] text-muted">
          LoveMotion<span className="text-accent">HEART</span>
        </div>

        {/* key={mode} re-runs the pop animation every time the mode changes */}
        <div key={mode} className="flex animate-pop items-center gap-3 rounded-2xl border border-line bg-glass py-2.5 pl-3 pr-4 backdrop-blur-[14px]">
          <div className="text-[30px] leading-none">{m.emoji}</div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted">Current mode</div>
            <div className="bg-gradient-to-r from-accent to-accent2 bg-clip-text text-[17px] font-bold text-transparent sm:text-xl">
              {m.label}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted">
          <i
            className={`size-2 rounded-full transition-all duration-300 ${
              handDetected ? 'bg-[#3dffa8] shadow-[0_0_10px_#3dffa8]' : 'bg-[#444866]'
            }`}
          />
          {statusText(camStatus, trackerStatus, handDetected)}
        </div>
      </header>

      <nav className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+16px)] left-1/2 z-[2] flex max-w-[calc(100vw-24px)] -translate-x-1/2 gap-0.5 rounded-[20px] border border-line bg-glass p-1.5 backdrop-blur-[14px] sm:gap-2 sm:p-2">
        {ORDER.map((id) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            title={`Key ${MODES[id].key}`}
            className={`flex cursor-pointer flex-col items-center gap-0.5 rounded-[14px] border px-2.5 py-2 text-[10px] transition-all duration-200 sm:flex-row sm:gap-2 sm:px-3.5 sm:text-[13px] ${
              id === mode
                ? 'border-accent/50 bg-gradient-to-br from-accent/20 to-accent2/20 text-fg shadow-[0_0_20px_rgba(255,77,141,0.25)]'
                : 'border-transparent text-muted hover:text-fg'
            }`}
          >
            <span className="text-[22px] sm:text-xl">{MODES[id].emoji}</span>
            <span>{MODES[id].label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
