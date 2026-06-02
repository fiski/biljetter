const SWEDISH_MONTHS = [
  'JANUARI', 'FEBRUARI', 'MARS', 'APRIL', 'MAJ', 'JUNI',
  'JULI', 'AUGUSTI', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DECEMBER',
]

function ArrowLeft() {
  return (
    <svg width="38" height="22" viewBox="0 0 38 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M37 11H1M1 11L11 1M1 11L11 21" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="38" height="22" viewBox="0 0 38 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 11H37M37 11L27 1M37 11L27 21" />
    </svg>
  )
}

interface MonthHeaderProps {
  currentMonth: Date
  onNavigate: (direction: 'prev' | 'next') => void
}

export function MonthHeader({ currentMonth, onNavigate }: MonthHeaderProps) {
  const monthName = SWEDISH_MONTHS[currentMonth.getMonth()]
  const year = currentMonth.getFullYear()

  return (
    <div className="flex items-center justify-center gap-6 py-8">
      <button
        type="button"
        className="text-foreground hover:text-accent transition-colors"
        aria-label="Föregående månad"
        onClick={() => onNavigate('prev')}
      >
        <ArrowLeft />
      </button>

      <h1
        style={{
          fontFamily: 'var(--font-cinzel)',
          fontSize: '3.125rem',
          color: '#2A2A2A',
          fontWeight: 400,
          letterSpacing: '0.04em',
        }}
        className="uppercase"
      >
        {monthName} {year}
      </h1>

      <button
        type="button"
        className="text-foreground hover:text-accent transition-colors"
        aria-label="Nästa månad"
        onClick={() => onNavigate('next')}
      >
        <ArrowRight />
      </button>
    </div>
  )
}
