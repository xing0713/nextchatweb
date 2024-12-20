import { NextResponse, type NextRequest } from 'next/server'
import { time } from 'duck-duck-scrape'
import { handleError } from '../../utils'

export const preferredRegion = ['sfo1']

export async function POST(req: NextRequest) {
  const { body } = await req.json()
  const { location } = body

  try {
    const result = await time(location)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error) {
      return handleError(error.message)
    }
  }
}
