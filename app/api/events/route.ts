import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getEvents } from '@/lib/data/repository'

const querySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'month must be in YYYY-MM format')
    .optional(),
  genres: z.string().optional(),
  venues: z.string().optional(),
})

const splitCsv = (value?: string) =>
  value?.split(',').map((s) => s.trim()).filter(Boolean) ?? []

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = querySchema.safeParse(params)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const events = await getEvents({
    month: parsed.data.month,
    genres: splitCsv(parsed.data.genres),
    venues: splitCsv(parsed.data.venues),
  })

  return NextResponse.json(events)
}
