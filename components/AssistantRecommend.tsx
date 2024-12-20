'use client'
import { useState, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCcw, BotMessageSquare, Heart } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import AssistantMarket from '@/components/AssistantMarket'
import Button from '@/components/Button'
import { useMessageStore } from '@/store/chat'
import { useAssistantStore } from '@/store/assistant'
import { useSettingStore } from '@/store/setting'
import AssistantMarketUrl from '@/utils/AssistantMarketUrl'

function CardSkeleton() {
  return (
    <Card className="w-full cursor-pointer transition-colors hover:drop-shadow-md dark:hover:border-white/80">
      <CardHeader className="p-4 pb-1 max-sm:px-3 max-sm:py-2 max-sm:pb-0">
        <Skeleton className="my-1 h-5 w-[160px]" />
      </CardHeader>
      <CardContent className="px-4 pb-2 max-sm:px-3">
        <Skeleton className="my-1 h-4 w-full" />
        <Skeleton className="my-1 h-4 w-[100px]" />
      </CardContent>
    </Card>
  )
}

function AssistantRecommend() {
  const { t } = useTranslation()
  const settingStore = useSettingStore()
  const { addFavorite, removeFavorite } = useAssistantStore()
  const recommendation = useAssistantStore((state) => state.recommendation)
  const favorites = useAssistantStore((state) => state.favorites)
  const [assistantMarketOpen, setAssistantMarketOpen] = useState<boolean>(false)

  const initAssistantMarket = useCallback((refresh: boolean = false) => {
    const { recommendation, recommend } = useAssistantStore.getState()
    if (refresh || recommendation.length === 0) recommend(4)
  }, [])

  const handleCustomAssistant = useCallback(() => {
    const { instruction, setSystemInstructionEditMode, clear: clearMessage } = useMessageStore.getState()
    clearMessage()
    instruction('')
    setSystemInstructionEditMode(true)
  }, [])

  const handleSelectAssistant = useCallback(
    async (identifier: string) => {
      const { instruction, clear: clearMessage } = useMessageStore.getState()
      const assistantMarketUrl = new AssistantMarketUrl(settingStore.assistantIndexUrl)
      const response = await fetch(assistantMarketUrl.getAssistantUrl(identifier, settingStore.lang))
      const data: AssistantDetail = await response.json()
      clearMessage()
      instruction(data.config.systemRole, data.meta.title)
    },
    [settingStore.lang, settingStore.assistantIndexUrl],
  )

  return (
    <div className="flex w-full flex-1 grow items-center justify-center overflow-y-auto scroll-smooth p-4 text-sm">
      <section className="-mt-20 w-full max-sm:mt-0">
        <div className="my-3 flex justify-between">
          <h3 className="text-base font-medium">{t('assistantRecommend')}</h3>
          <div>
            <Button
              className="h-6 w-6 p-1"
              title={t('customizeAssistantSetting')}
              variant="ghost"
              size="icon"
              onClick={() => handleCustomAssistant()}
            >
              <BotMessageSquare className="h-5 w-5" />
            </Button>
            <Button
              className="h-6 w-6 p-1"
              title={t('refresh')}
              variant="ghost"
              size="icon"
              disabled={recommendation.length === 0}
              onClick={() => initAssistantMarket(true)}
            >
              <RefreshCcw className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {recommendation.length === 0 ? (
          <div className="grid grid-cols-2 grid-rows-2 gap-2 max-sm:grid-cols-1">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-2 grid-rows-2 gap-2 text-left text-gray-600 max-sm:grid-cols-1">
            {recommendation.map((assistant) => {
              return (
                <Card
                  key={assistant.identifier}
                  className="cursor-pointer transition-colors hover:drop-shadow-md dark:hover:border-white/80"
                  onClick={() => handleSelectAssistant(assistant.identifier)}
                >
                  <CardHeader className="p-4 pb-1 max-sm:px-3 max-sm:py-2">
                    <CardTitle className="flex justify-between text-base">
                      <div className="flex w-full">
                        <Avatar className="mr-1 h-6 w-6">
                          {assistant.meta.avatar.startsWith('http') ? (
                            <AvatarImage className="m-1 h-4 w-4 rounded-full" src={assistant.meta.avatar} />
                          ) : null}
                          <AvatarFallback className="bg-transparent">{assistant.meta.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="flex-1 truncate font-medium" title={assistant.meta.title}>
                          {assistant.meta.title}
                        </span>
                        <div className="inline-flex gap-1">
                          <Button
                            className="h-6 w-6"
                            size="icon"
                            variant="ghost"
                            onClick={(ev) => {
                              ev.stopPropagation()
                              ev.preventDefault()
                              if (favorites.includes(assistant.identifier)) {
                                removeFavorite(assistant.identifier)
                              } else {
                                addFavorite(assistant.identifier)
                              }
                            }}
                          >
                            <Heart className={favorites.includes(assistant.identifier) ? 'text-red-400' : ''} />
                          </Button>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-line-clamp-2 mb-3 h-10 px-4 text-sm max-sm:mb-2 max-sm:px-3">
                    {assistant.meta.description}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
        <div
          className="cursor-pointer pt-3 text-center underline-offset-4 hover:underline"
          onClick={() => setAssistantMarketOpen(true)}
        >
          {t('moreAssistants')}
        </div>
      </section>
      <AssistantMarket
        open={assistantMarketOpen}
        onClose={() => setAssistantMarketOpen(false)}
        onLoaded={initAssistantMarket}
      />
    </div>
  )
}

export default memo(AssistantRecommend)
