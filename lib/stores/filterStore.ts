import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const initialMonthMs = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()

interface FilterStore {
  currentMonthMs: number
  selectedGenre: string
  selectedVenue: string
  grainPaused: boolean

  navigateMonth: (direction: 'prev' | 'next') => void
  setGenre: (slug: string) => void
  setVenue: (slug: string) => void
  resetToToday: () => void
  resetFilters: () => void
  toggleGrain: () => void
}

export const useFilterStore = create<FilterStore>()(
  persist(
    (set) => ({
      currentMonthMs: initialMonthMs,
      selectedGenre: '',
      selectedVenue: '',
      grainPaused: false,

      navigateMonth: (direction) =>
        set((state) => {
          const d = new Date(state.currentMonthMs)
          const next =
            direction === 'next'
              ? new Date(d.getFullYear(), d.getMonth() + 1, 1)
              : new Date(d.getFullYear(), d.getMonth() - 1, 1)
          return { currentMonthMs: next.getTime() }
        }),

      resetToToday: () => set({ currentMonthMs: initialMonthMs }),
      setGenre: (slug) => set({ selectedGenre: slug }),
      setVenue: (slug) => set({ selectedVenue: slug }),
      resetFilters: () => set({ selectedGenre: '', selectedVenue: '' }),
      toggleGrain: () => set((state) => ({ grainPaused: !state.grainPaused })),
    }),
    { name: 'biljetter-filters' }
  )
)
