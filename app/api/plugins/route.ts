import { NextResponse, type NextRequest } from 'next/server'
import OASNormalize from 'oas-normalize'
import { ErrorType } from '@/constant/errors'
import { handleError } from '../utils'

export const preferredRegion = ['sfo1']

export async function POST(req: NextRequest) {
  const body = await req.text()

  if (body === '') {
    return NextResponse.json({ code: 40001, message: ErrorType.MissingParam }, { status: 400 })
  }

  try {
    try {
      const oasNormalize = new OASNormalize(body)
      const openApiDocument = await oasNormalize.deref()
      return NextResponse.json(openApiDocument)
    } catch (err) {
      if (err instanceof Error) {
        return NextResponse.json({ code: 50001, message: err.message }, { status: 500 })
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      return handleError(error.message)
    }
  }
}
