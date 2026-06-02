'use client'

import { List, CalendarDays, LayoutGrid } from 'lucide-react'
import type { ViewMode } from '../CalendarWrapper'
import { useFilterStore } from '@/lib/stores/filterStore'

interface ViewToggleProps {
  viewMode: ViewMode
  onViewChange: (mode: ViewMode) => void
}

const BUTTONS: { mode: ViewMode; Icon: typeof List; label: string }[] = [
  { mode: 'list', Icon: List, label: 'Listvy' },
  { mode: 'calendar', Icon: CalendarDays, label: 'Kalendervy' },
  { mode: 'grid', Icon: LayoutGrid, label: 'Rutnätsvy' },
]

export function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  const { grainPaused, toggleGrain } = useFilterStore()

  return (
    <div className="flex items-start gap-2">
      <button
        type="button"
        onClick={toggleGrain}
        className="border border-foreground h-10 flex items-center justify-center px-4 text-[11px] font-montserrat font-semibold uppercase tracking-widest transition-colors hover:text-accent"
        style={{ fontFamily: 'var(--font-montserrat)' }}
      >
        {grainPaused ? 'Spela animationer' : 'Pausa animationer'}
      </button>

      <div className="flex items-start border border-foreground">
        {BUTTONS.map(({ mode, Icon, label }, i) => {
          const isActive = viewMode === mode
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onViewChange(mode)}
              aria-label={label}
              className={[
                'border border-foreground h-10 flex items-center justify-center px-8 py-2.5 transition-colors',
                i < BUTTONS.length - 1 ? '-mr-px' : '',
                isActive
                  ? 'bg-accent-bg border-accent text-accent'
                  : 'text-foreground hover:text-accent',
              ].join(' ')}
            >
              <Icon size={24} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
