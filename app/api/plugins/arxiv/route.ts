import { NextResponse, type NextRequest } from 'next/server'
import { convertXML } from 'simple-xml-to-json'
import { ErrorType } from '@/constant/errors'
import { handleError } from '../../utils'

export const preferredRegion = ['sfo1']

export async function POST(req: NextRequest) {
  const { body } = await req.json()
  const { query = '', size = 20, page } = body

  if (query === '') {
    return NextResponse.json({ code: 40001, message: ErrorType.MissingParam }, { status: 400 })
  }

  try {
    const searchParams = new URLSearchParams(`search_query=${query}&max_results=${size}`)
    if (page) searchParams.append('start', page)
    const response = await fetch(`https://export.arxiv.org/api/query?${searchParams.toString()}`)
    const xmlResult = await response.text()
    const JsonResult = convertXML(xmlResult)
    const feed = JsonResult.feed.children
    const result: ArxivResult = {
      link: feed[0].link.href,
      title: feed[1].title.content,
      id: feed[2].id.content,
      updated: feed[3].updated.content,
      total: Number(feed[4]['opensearch:totalResults'].content),
      page: Number(feed[5]['opensearch:startIndex'].content),
      size: Number(feed[6]['opensearch:itemsPerPage'].content),
      data: [],
    }
    const entries = feed.slice(7)
    for (const item of entries) {
      const entry = item.entry.children
      const article: ArxivArticle = {
        id: '',
        updated: '',
        published: '',
        title: '',
        summary: '',
        author: [],
        link: '',
        pdf: '',
      }
      for (const content of entry) {
        if (content.id) article.id = content.id.content.replace('http://arxiv.org/abs/', '')
        if (content.updated) article.updated = content.updated.content
        if (content.published) article.published = content.published.content
        if (content.title) article.title = content.title.content
        if (content.summary) article.summary = content.summary.content
        if (content.author) {
          for (const author of content.author.children) {
            article.author.push(author.name.content)
          }
        }
        if (content.link) {
          if (content.link.type === 'text/html') article.link = content.link.href
          if (content.link.type === 'application/pdf') article.pdf = content.link.href
        }
      }
      result.data.push(article)
    }
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error) {
      return handleError(error.message)
    }
  }
}
