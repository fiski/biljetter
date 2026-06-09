'use client'

import { useEffect, useRef } from 'react'
import { useFilterStore } from '@/lib/stores/filterStore'

export function GrainOverlay() {
  const grainPaused = useFilterStore((s) => s.grainPaused)
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (grainPaused) {
      video.pause()
    } else {
      video.play().catch(() => {})
    }
  }, [grainPaused])

  return (
    <video
      ref={ref}
      src="/images/Grain-Effect.webm"
      loop
      muted
      playsInline
      className="grain-overlay"
      aria-hidden="true"
    />
  )
}
