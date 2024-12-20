import { NextResponse, type NextRequest } from 'next/server'
import { ErrorType } from '@/constant/errors'
import { handleError } from '../../utils'

export const preferredRegion = ['sfo1']

type SearchResult = {
  results: {
    id: string
    width: number
    height: number
    description: string
    alt_description: string
    color: string
    created_at: string
    updated_at: string
    links: {
      download: string
      download_location: string
      html: string
      self: string
    }
    tags_preview: {
      type: string
      title: string
    }[]
    urls: {
      raw: string
      full: string
      regular: string
      small: string
      small_s3: string
      thumb: string
    }
    user: {
      name: string
      profile_image: {
        large: string
        medium: string
        small: string
      }
      links: {
        html: string
        photos: string
      }
    }
  }[]
  total: number
  total_pages: number
}

export async function POST(req: NextRequest) {
  const { body } = await req.json()
  const { query = '' } = body

  if (query === '') {
    return NextResponse.json({ code: 40001, message: ErrorType.MissingParam }, { status: 400 })
  }

  try {
    const searchParams = new URLSearchParams('page=1&per_page=20&plus=none')
    searchParams.append('query', query)
    const response = await fetch(`https://unsplash.com/napi/search/photos?${searchParams.toString()}`)
    const result: SearchResult = await response.json()
    const unsplashImages: UnsplashImage[] = result.results.map((item) => {
      return {
        id: item.id,
        width: item.width,
        height: item.height,
        title: item.description || item.alt_description,
        color: item.color,
        createdAt: item.created_at,
        download: item.urls.raw,
        link: item.links.html,
        tags: item.tags_preview.map((tag) => tag.title),
        src: item.urls.regular,
        thumbnail: item.urls.small,
        user: {
          name: item.user.name,
          avatar: item.user.profile_image.small,
          link: item.user.links.html,
        },
      }
    })
    return NextResponse.json(unsplashImages)
  } catch (error) {
    if (error instanceof Error) {
      return handleError(error.message)
    }
  }
}
