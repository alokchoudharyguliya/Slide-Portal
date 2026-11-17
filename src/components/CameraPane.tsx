import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export function CameraPane({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [failure, setFailure] = useState<{ attempt: number; message: string } | null>(null)
  const [mirrored, setMirrored] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const unsupported = typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia
  const error = unsupported ? 'This browser cannot open a camera.' : failure?.attempt === attempt ? failure.message : null

  useEffect(() => {
    const video = videoRef.current
    if (!video || unsupported) return
    let stream: MediaStream | null = null
    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((next) => {
        if (cancelled) {
          stop(next)
          return
        }
        stream = next
        video.srcObject = next
        return video.play()
      })
      .catch((reason: unknown) => {
        if (cancelled) return
        setFailure({ attempt, message: cameraMessage(reason) })
      })
    return () => {
      cancelled = true
      video.srcObject = null
      if (stream) stop(stream)
    }
  }, [attempt, unsupported])

  return (
    <aside className="wb-camera" aria-label="Camera">
      <div className="wb-camera-head">
        <span>Camera</span>
        <div>
          <button type="button" aria-pressed={mirrored} onClick={() => setMirrored((value) => !value)}>
            {mirrored ? 'Mirrored' : 'Mirror'}
          </button>
          <button type="button" aria-label="Close camera" onClick={onClose}>
            <X />
          </button>
        </div>
      </div>
      <div className="wb-camera-stage">
        <video ref={videoRef} autoPlay playsInline muted className={mirrored ? 'mirrored' : ''} />
        {error && (
          <div className="wb-camera-note">
            <p>{error}</p>
            <button type="button" onClick={() => setAttempt((value) => value + 1)}>
              Try again
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

function stop(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop())
}

function cameraMessage(reason: unknown) {
  const name = reason instanceof DOMException ? reason.name : ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Camera permission is blocked. Allow it for this site, then try again.'
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'No camera was found on this computer.'
  if (name === 'NotReadableError') return 'The camera is in use by another app.'
  return 'The camera could not be started.'
}
