import { Search, Menu } from 'lucide-react'
import { CalendarWrapper } from '@/components/CalendarWrapper'

export default function Home() {
  return (
    <div className="min-h-screen relative">
      {/* Left sidebar icons */}
      <div className="absolute left-10 top-20 flex flex-col gap-10 text-foreground">
        <Search size={24} />
        <Menu size={24} />
      </div>

      <main className="px-6 py-4 max-w-[1280px] mx-auto">
        <CalendarWrapper />
      </main>
    </div>
  )
}
