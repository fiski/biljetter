import { NextResponse } from 'next/server'
import { getAllVenues } from '@/lib/data/repository'

export async function GET() {
  return NextResponse.json(await getAllVenues())
}
