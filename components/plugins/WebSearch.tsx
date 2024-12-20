'use client'
import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, ChevronRight } from 'lucide-react'
import ResponsiveDialog from '@/components/ResponsiveDialog'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { SearchResult } from 'duck-duck-scrape'

type Props = {
  data: SearchResult[]
}

function WebSearch(props: Props) {
  const { data = [] } = props
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)

  if (data.length === 0) return null

  return (
    <>
      <div className="chat-content overflow-x-auto scroll-smooth">
        <div className="flex gap-1.5 max-md:gap-1">
          {data.slice(0, 4).map((item, idx) => {
            return (
              <a key={idx} href={item.url} target="_blank">
                <Card className="w-40 flex-1 hover:bg-gray-50 hover:dark:bg-gray-900">
                  <CardHeader className="p-2">
                    <CardTitle className="truncate text-sm text-blue-500" title={item.title}>
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 py-0" title={item.description}>
                    <p className="text-line-clamp-2 text-sm" dangerouslySetInnerHTML={{ __html: item.description }}></p>
                  </CardContent>
                  <CardFooter className="p-2" title={item.url}>
                    <div className="inline-flex w-full">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={item.icon} />
                        <AvatarFallback>
                          <Link />
                        </AvatarFallback>
                      </Avatar>
                      <span className="ml-1.5 truncate text-sm leading-4">
                        <a href={item.hostname} target="_blank">
                          {item.hostname}
                        </a>
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              </a>
            )
          })}
        </div>
      </div>
      <div className="flex justify-between py-2">
        <div className="inline-flex">
          <div className="grid h-5 w-32 grid-cols-4 p-0.5">
            {data.slice(4, 8).map((item, idx) => {
              return (
                <Avatar key={idx} className="h-4 w-4" title={item.title}>
                  <AvatarImage src={item.icon} />
                  <AvatarFallback>
                    <Link />
                  </AvatarFallback>
                </Avatar>
              )
            })}
          </div>
          <p className="text-sm">
            <span className="text-blue-500">{data.length}</span> {t('plugins.webSearch.totalDataSources')}
          </p>
        </div>
        <div className="inline-flex cursor-pointer text-blue-500" onClick={() => setDialogOpen(true)}>
          <span className="text-sm underline-offset-2 hover:underline">{t('plugins.webSearch.viewAll')}</span>
          <ChevronRight className="h-5 w-5" />
        </div>
      </div>
      <ResponsiveDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={t('plugins.webSearch.dialogTitle')}
        description={t('plugins.webSearch.dialogDescription')}
      >
        <ScrollArea className="h-[500px]">
          <ol>
            {data.map((item, idx) => {
              return (
                <li
                  className="mb-2 border-b-[1px] border-solid border-gray-200 last:border-b-0 dark:border-gray-700"
                  key={idx}
                >
                  <div className="inline-flex text-blue-400">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={item.icon} />
                      <AvatarFallback>
                        <Link className="scale-75" />
                      </AvatarFallback>
                    </Avatar>
                    <small className="ml-1.5 truncate text-sm leading-4">
                      <a href={item.hostname} target="_blank">
                        {item.hostname}
                      </a>
                    </small>
                  </div>
                  <h3 className="my-1 text-base text-blue-500 underline-offset-2 hover:underline">
                    <a href={item.url} target="_blank">
                      {item.title}
                    </a>
                  </h3>
                  <p className="my-2 text-sm" dangerouslySetInnerHTML={{ __html: item.description }}></p>
                </li>
              )
            })}
          </ol>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </ResponsiveDialog>
    </>
  )
}

export default memo(WebSearch)
