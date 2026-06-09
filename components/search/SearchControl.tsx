'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { EventWithRelations } from '@/types'
import { useFilterStore } from '@/lib/stores/filterStore'
import { SearchPopover } from './SearchPopover'

interface SearchControlProps {
  events: EventWithRelations[]
  onSelectEvent: (event: EventWithRelations) => void
}

export function SearchControl({ events, onSelectEvent }: SearchControlProps) {
  const { searchQuery, setSearchQuery } = useFilterStore()
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const close = useCallback(() => {
    setVisible(false)
    setSearchQuery('')
    // Fallback for prefers-reduced-motion: transition-none means onTransitionEnd
    // never fires, so setOpen(false) would never be called without this timer.
    clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => setOpen(false), 250)
  }, [setSearchQuery])

  useEffect(() => () => clearTimeout(closeTimerRef.current), [])

  // Drive the enter/exit transition off `open`.
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(id)
    }
  }, [open])

  // Esc to close, click-outside to close.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const onPointer = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) close()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open, close])

  const handleSelect = (event: EventWithRelations) => {
    onSelectEvent(event)
    close()
  }

  return (
    <div ref={wrapperRef}>
      <button
        type="button"
        aria-label="Sök"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className="fixed left-10 top-20 z-50 text-foreground hover:text-accent transition-colors"
      >
        <Search size={24} />
      </button>

      {open && (
        <div
          className={`fixed left-10 top-[116px] z-50 origin-top-left transition-all duration-200 ease-out motion-reduce:transition-none ${
            visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          onTransitionEnd={() => {
            if (!visible) setOpen(false)
          }}
        >
          <SearchPopover
            events={events}
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onSelectEvent={handleSelect}
          />
        </div>
      )}
    </div>
  )
}
