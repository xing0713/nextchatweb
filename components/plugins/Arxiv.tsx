'use client'
import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, ChevronRight, FileDown } from 'lucide-react'
import ResponsiveDialog from '@/components/ResponsiveDialog'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import dayjs from 'dayjs'
import { isUndefined } from 'lodash-es'

type Props = {
  data: ArxivResult['data']
}

function Arxiv(props: Props) {
  const { data } = props
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)

  if (isUndefined(data)) return null

  return (
    <>
      <div className="chat-content overflow-x-auto scroll-smooth">
        <div className="flex gap-1.5 max-md:gap-1">
          {data.slice(0, 4).map((item) => {
            return (
              <a key={item.id} href={item.link} target="_blank">
                <Card className="w-40 flex-1 hover:bg-gray-50 hover:dark:bg-gray-900">
                  <CardHeader className="p-2 pb-0">
                    <CardTitle className="truncate text-sm text-blue-500" title={item.title}>
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 pt-1" title={item.summary}>
                    <p className="text-line-clamp-3 text-sm">{item.summary}</p>
                  </CardContent>
                </Card>
              </a>
            )
          })}
        </div>
      </div>
      <div className="flex justify-between py-2">
        <div className="inline-flex">
          <p className="text-sm">
            <span className="text-blue-500">{data.length}</span> {t('plugins.arxiv.totalDataSources')}
          </p>
        </div>
        <div className="inline-flex cursor-pointer text-blue-500" onClick={() => setDialogOpen(true)}>
          <span className="text-sm underline-offset-2 hover:underline">{t('plugins.arxiv.viewAll')}</span>
          <ChevronRight className="h-5 w-5" />
        </div>
      </div>
      <ResponsiveDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={t('plugins.arxiv.dialogTitle')}
        description={t('plugins.arxiv.dialogDescription')}
      >
        <ScrollArea className="h-[500px]">
          <ol>
            {data.map((item) => {
              return (
                <li
                  key={item.id}
                  className="mb-2 border-b-[1px] border-solid border-gray-200 last:border-b-0 dark:border-gray-700"
                >
                  <h3 className="my-1 text-lg font-semibold text-blue-500 underline-offset-2 hover:underline">
                    <a href={item.link} target="_blank">
                      {item.title}
                    </a>
                  </h3>
                  <p className="text-sm font-semibold">{item.author.join(', ')}</p>
                  <p className="my-2 text-sm">{item.summary}</p>
                  <div className="mb-2 flex justify-between">
                    <div className="inline-flex gap-2">
                      <a className="block" href={item.link} target="_blank">
                        <Link className="h-4 w-4" />
                      </a>
                      <a className="block" href={item.pdf} target="_blank" download>
                        <FileDown className="h-4 w-4" />
                      </a>
                    </div>
                    <div className="text-sm">{dayjs(item.published).format('YYYY-MM-DD HH:mm:ss')}</div>
                  </div>
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

export default memo(Arxiv)
