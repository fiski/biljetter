import Link from 'next/link'
import { mockEvents } from '@/lib/data/mockEvents'

const SWEDISH_MONTHS = [
  'JANUARI', 'FEBRUARI', 'MARS', 'APRIL', 'MAJ', 'JUNI',
  'JULI', 'AUGUSTI', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DECEMBER',
]

export default function Home() {
  const now = new Date()
  const currentMonth = SWEDISH_MONTHS[now.getMonth()]
  const currentYear = now.getFullYear()

  const currentMonthEvents = mockEvents.filter((event) => {
    const start = new Date(event.startTime)
    return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear()
  })

  return (
    <main className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      <h1 className="font-serif text-5xl md:text-7xl font-semibold tracking-tight mb-8">
        {currentMonth} {currentYear}
      </h1>

      <p className="text-muted mb-10">
        {currentMonthEvents.length} konserter denna månad
      </p>

      <div className="space-y-4">
        {currentMonthEvents.map((event) => {
          const start = new Date(event.startTime)
          const end = new Date(event.endTime)
          const day = start.getDate()
          const startTime = start.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
          const endTime = end.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })

          return (
            <Link
              key={event.id}
              href={`/event/${event.slug}`}
              className="block bg-card-bg border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-4">
                  <span className="font-serif text-3xl font-semibold text-foreground w-10">
                    {day}
                  </span>
                  <div>
                    <h2 className="font-semibold text-foreground">{event.title}</h2>
                    <p className="text-sm text-muted">{event.venue.name}</p>
                  </div>
                </div>
                <span className="text-sm text-muted whitespace-nowrap">
                  {startTime} – {endTime}
                </span>
              </div>
              {event.price && (
                <p className="text-sm text-accent mt-2 ml-14">{event.price}</p>
              )}
            </Link>
          )
        })}
      </div>
    </main>
  )
}
