import { NextResponse, type NextRequest } from 'next/server'
import { ErrorType } from '@/constant/errors'
import { handleError } from '../../utils'
import { omit } from 'lodash-es'

export const preferredRegion = ['sfo1']

interface ReaderResult {
  code: number
  status: number
  data: {
    title: string
    description: string
    url: string
    content: string
    usage: {
      tokens: number
    }
  }
}

export async function POST(req: NextRequest) {
  const { body } = await req.json()
  const { url = '' } = body

  if (url === '') {
    return NextResponse.json({ code: 40001, message: ErrorType.MissingParam }, { status: 400 })
  }

  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })
    const result: ReaderResult = await response.json()
    return NextResponse.json(omit(result.data, ['usage']))
  } catch (error) {
    if (error instanceof Error) {
      return handleError(error.message)
    }
  }
}
