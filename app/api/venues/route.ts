import { NextResponse } from 'next/server'
import { getAllVenues } from '@/lib/data/mockEvents'

export async function GET() {
  return NextResponse.json(getAllVenues())
}
