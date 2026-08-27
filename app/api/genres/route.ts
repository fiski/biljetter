import { NextResponse } from 'next/server'
import { getAllGenres } from '@/lib/data/repository'

export async function GET() {
  return NextResponse.json(await getAllGenres())
}
