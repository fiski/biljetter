import { Menu } from 'lucide-react'
import { CalendarWrapper } from '@/components/CalendarWrapper'

export default function Home() {
  return (
    <div className="min-h-screen relative">
      {/* Left sidebar icons — the Search trigger is rendered by SearchControl
          (fixed at left-10 top-20); Menu sits just below it. */}
      <div className="absolute left-10 top-36 flex flex-col gap-10 text-foreground">
        <Menu size={24} />
      </div>

      <main className="px-6 py-4 max-w-[1280px] mx-auto">
        <CalendarWrapper />
      </main>
    </div>
  )
}
