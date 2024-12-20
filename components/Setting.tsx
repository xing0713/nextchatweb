'use client'
import { memo, useCallback, useLayoutEffect, useMemo, useState } from 'react'
import { EdgeSpeech } from '@xiangfa/polly'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { MonitorDown } from 'lucide-react'
import { usePWAInstall } from 'react-use-pwa-install'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import ResponsiveDialog from '@/components/ResponsiveDialog'
import i18n from '@/plugins/i18n'
import { fetchModels } from '@/utils/models'
import locales from '@/constant/locales'
import { Model } from '@/constant/model'
import { useSettingStore } from '@/store/setting'
import { useModelStore } from '@/store/model'
import { toPairs, values, keys, omitBy, isFunction } from 'lodash-es'

import pkg from '@/package.json'

type SettingProps = {
  open: boolean
  hiddenTalkPanel?: boolean
  onClose: () => void
}

const GEMINI_MODEL_LIST = process.env.NEXT_PUBLIC_GEMINI_MODEL_LIST

const formSchema = z.object({
  password: z.string().optional(),
  assistantIndexUrl: z.string().url({ message: 'Invalid url' }),
  lang: z.string().optional(),
  apiKey: z.string().optional(),
  apiProxy: z.string().url({ message: 'Invalid url' }).optional(),
  uploadProxy: z.string().url({ message: 'Invalid url' }).optional(),
  model: z.string(),
  maxHistoryLength: z.number().gte(0).lte(50).optional().default(0),
  topP: z.number().gte(0).lte(1).default(0.95),
  topK: z.number().gte(0).lte(128).default(40),
  temperature: z.number().gte(0).lte(1).default(1),
  maxOutputTokens: z.number().gte(0).lte(8192).default(8192),
  safety: z.enum(['none', 'low', 'middle', 'high']).default('none'),
  sttLang: z.string().optional(),
  ttsLang: z.string().optional(),
  ttsVoice: z.string().optional(),
  autoStopRecord: z.boolean().default(false),
})

let cachedModelList = false

function Setting({ open, hiddenTalkPanel, onClose }: SettingProps) {
  const { t } = useTranslation()
  const pwaInstall = usePWAInstall()
  const settingStore = useSettingStore()
  const modelStore = useModelStore()
  const [ttsLang, setTtsLang] = useState<string>('')
  const isProtected = useMemo(() => {
    return settingStore.isProtected
  }, [settingStore.isProtected])
  const voiceOptions = useMemo(() => {
    return new EdgeSpeech({ locale: ttsLang }).voiceOptions || []
  }, [ttsLang])
  const modelOptions = useMemo(() => {
    const { update } = useSettingStore.getState()

    if (modelStore.models.length > 0) {
      const models = values(Model)
      modelStore.models.forEach((item) => {
        const modelName = item.name.replace('models/', '')
        if (!models.includes(modelName)) {
          Model[modelName] = item.displayName
        }
      })
    }

    let modelList: string[] = []
    let defaultModel = 'gemini-1.5-flash-latest'
    const defaultModelList: string[] = keys(Model)
    const userModels: string[] = GEMINI_MODEL_LIST ? GEMINI_MODEL_LIST.split(',') : []

    userModels.forEach((modelName) => {
      if (modelName === 'all' || modelName === '+all') {
        for (const name of defaultModelList) {
          if (!modelList.includes(name)) modelList.push(name)
        }
      } else if (modelName === '-all') {
        modelList = modelList.filter((name) => !defaultModelList.includes(name))
      } else if (modelName.startsWith('-')) {
        modelList = modelList.filter((name) => name !== modelName.substring(1))
      } else if (modelName.startsWith('@')) {
        const name = modelName.substring(1)
        if (!modelList.includes(name)) modelList.push(name)
        update({ model: name })
        defaultModel = name
      } else {
        modelList.push(modelName.startsWith('+') ? modelName.substring(1) : modelName)
      }
    })

    const models = modelList.length > 0 ? modelList : defaultModelList
    if (!models.includes(defaultModel)) {
      update({ model: models[0] })
    }

    return models
  }, [modelStore.models])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: async () => {
      return new Promise((resolve) => {
        const state = useSettingStore.getState()
        const store = omitBy(state, (item) => isFunction(item)) as z.infer<typeof formSchema>
        setTtsLang(state.ttsLang)
        resolve(store)
      })
    },
  })

  const handleTTSChange = (value: string) => {
    form.setValue('ttsLang', value)
    setTtsLang(value)
    const options = new EdgeSpeech({ locale: value }).voiceOptions
    if (options) {
      form.setValue('ttsVoice', options[0].value)
    }
  }

  const handleLangChange = (value: string) => {
    i18n.changeLanguage(value)
    form.setValue('lang', value)
    form.setValue('sttLang', value)
    handleTTSChange(value)
  }

  const LangOptions = () => {
    return toPairs(locales).map((kv) => {
      return (
        <SelectItem key={kv[0]} value={kv[0]}>
          {kv[1]}
        </SelectItem>
      )
    })
  }

  const handleSubmit = useCallback(
    (values: z.infer<typeof formSchema>) => {
      settingStore.update(values as Partial<Setting>)
      onClose()
    },
    [onClose, settingStore],
  )

  useLayoutEffect(() => {
    if (open && !cachedModelList) {
      const { update } = useModelStore.getState()
      const { apiKey, apiProxy, password } = useSettingStore.getState()
      fetchModels({ apiKey, apiProxy, password }).then((models) => {
        if (models.length > 0) {
          update(models)
          cachedModelList = true
        }
      })
    }
  }, [open])

  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      title={t('setting')}
      description={t('settingDescription')}
      footer={
        <>
          <Button className="flex-1" type="submit" onClick={form.handleSubmit(handleSubmit)}>
            {t('save')}
          </Button>
          <Button className="flex-1 max-sm:mt-2" variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <Tabs defaultValue="general">
            <TabsList className="mx-auto grid h-fit w-full grid-cols-4">
              <TabsTrigger className="text-wrap" value="general">
                {t('generalSetting')}
              </TabsTrigger>
              <TabsTrigger className="text-wrap" value="model">
                {t('llmModel')}
              </TabsTrigger>
              <TabsTrigger className="text-wrap" value="params">
                {t('modelParams')}
              </TabsTrigger>
              <TabsTrigger className="text-wrap" disabled={hiddenTalkPanel} value="voice">
                {t('voiceServer')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="general">
              <div className="grid w-full gap-4 px-4 py-4 max-sm:px-0">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                      <FormLabel className="text-right">
                        {isProtected ? <span className="leading-12 mr-1 text-red-500">*</span> : null}
                        {t('accessPassword')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="col-span-3"
                          type="password"
                          placeholder={t('accessPasswordPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assistantIndexUrl"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                      <FormLabel className="text-right">{t('assistantMarketUrl')}</FormLabel>
                      <FormControl>
                        <Input className="col-span-3" placeholder={t('assistantMarketUrl')} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lang"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                      <FormLabel className="text-right">{t('language')}</FormLabel>
                      <FormControl>
                        <Select defaultValue={field.value} onValueChange={handleLangChange}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder={t('followTheSystem')} />
                          </SelectTrigger>
                          <SelectContent>
                            <LangOptions />
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                {pwaInstall ? (
                  <div className="grid grid-cols-4 items-center gap-4 space-y-0">
                    <Label className="text-right">{t('installPwa')}</Label>
                    <Button className="col-span-3" variant="ghost" onClick={() => pwaInstall()}>
                      <MonitorDown className="mr-1.5 h-4 w-4" />
                      {t('pwaInstall')}
                    </Button>
                  </div>
                ) : null}
                <div className="grid grid-cols-4 items-center gap-4 space-y-0">
                  <Label className="text-right">{t('version')}</Label>
                  <div className="col-span-3 text-center leading-10">
                    {`v${pkg.version}`}{' '}
                    <small>
                      (
                      <a
                        className="underline underline-offset-2"
                        href="https://github.com/u14app/gemini-next-chat/releases"
                        target="_blank"
                      >
                        {t('checkForUpdate')}
                      </a>
                      )
                    </small>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="model">
              <div className="grid w-full gap-4 px-4 py-4 max-sm:px-0">
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                      <FormLabel className="text-right">
                        {!isProtected ? <span className="leading-12 mr-1 text-red-500">*</span> : null}
                        {t('geminiKey')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="col-span-3"
                          type="password"
                          placeholder={t('geminiKeyPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apiProxy"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                      <FormLabel className="text-right">{t('apiProxyUrl')}</FormLabel>
                      <FormControl>
                        <Input
                          className="col-span-3"
                          placeholder={t('apiProxyUrlPlaceholder')}
                          disabled={form.getValues().apiKey === ''}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="uploadProxy"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                      <FormLabel className="text-right">{t('uploadProxyUrl')}</FormLabel>
                      <FormControl>
                        <Input
                          className="col-span-3"
                          placeholder={t('uploadProxyUrlPlaceholder')}
                          disabled={form.getValues().apiKey === ''}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                      <FormLabel className="text-right">{t('defaultModel')}</FormLabel>
                      <FormControl>
                        <Select defaultValue={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder={t('selectDefaultModel')} />
                          </SelectTrigger>
                          <SelectContent className="text-left">
                            {modelOptions.map((name) => {
                              return (
                                <SelectItem key={name} value={name}>
                                  {name}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxHistoryLength"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                      <FormLabel className="text-right">{t('maxHistoryLength')}</FormLabel>
                      <FormControl>
                        <div className="col-span-3 flex h-10">
                          <Slider
                            className="flex-1"
                            defaultValue={[field.value]}
                            max={50}
                            step={1}
                            onValueChange={(values) => field.onChange(values[0])}
                          />
                          <span className="w-1/5 text-center text-sm leading-10">
                            {field.value === 0 ? t('unlimited') : field.value}
                          </span>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
            <TabsContent value="params">
              <div className="grid w-full gap-4 px-4 py-4 max-sm:px-0">
                <FormField
                  control={form.control}
                  name="topP"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                      <FormLabel className="text-right">Top-P</FormLabel>
                      <FormControl>
                        <div className="col-span-3 flex h-10">
                          <Slider
                            className="flex-1"
                            defaultValue={[field.value]}
                            max={1}
                            step={0.01}
                            onValueChange={(values) => field.onChange(values[0])}
                          />
                          <span className="w-1/5 text-center text-sm leading-10">{field.value}</span>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="topK"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                      <FormLabel className="text-right">Top-K</FormLabel>
                      <FormControl>
                        <div className="col-span-3 flex h-10">
                          <Slider
                            className="flex-1"
                            defaultValue={[field.value]}
                            max={128}
                            step={1}
                            onValueChange={(values) => field.onChange(values[0])}
                          />
                          <span className="w-1/5 text-center text-sm leading-10">{field.value}</span>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                      <FormLabel className="text-right">{t('temperature')}</FormLabel>
                      <FormControl>
                        <div className="col-span-3 flex h-10">
                          <Slider
                            className="flex-1"
                            defaultValue={[field.value]}
                            max={1}
                            step={0.1}
                            onValueChange={(values) => field.onChange(values[0])}
                          />
                          <span className="w-1/5 text-center text-sm leading-10">{field.value}</span>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxOutputTokens"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                      <FormLabel className="text-right">{t('maxOutputTokens')}</FormLabel>
                      <FormControl>
                        <div className="col-span-3 flex h-10">
                          <Slider
                            className="flex-1"
                            defaultValue={[field.value]}
                            max={8192}
                            step={1}
                            onValueChange={(values) => field.onChange(values[0])}
                          />
                          <span className="w-1/5 text-center text-sm leading-10">{field.value}</span>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="safety"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                      <FormLabel className="text-right">{t('safety')}</FormLabel>
                      <FormControl>
                        <div className="col-span-3 flex h-10">
                          <RadioGroup className="grid w-full grid-cols-4" {...field}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="none" id="none" />
                              <Label htmlFor="none">{t('none')}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="low" id="low" />
                              <Label htmlFor="low">{t('low')}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="middle" id="middle" />
                              <Label htmlFor="middle">{t('middle')}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="high" id="high" />
                              <Label htmlFor="high">{t('high')}</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
            <TabsContent value="voice">
              <div className="grid w-full gap-4 px-4 py-4 max-sm:px-0">
                <FormField
                  control={form.control}
                  name="sttLang"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                      <FormLabel className="text-right">{t('speechRecognition')}</FormLabel>
                      <FormControl>
                        <Select defaultValue={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder={t('followTheSystem')} />
                          </SelectTrigger>
                          <SelectContent>
                            <LangOptions />
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ttsLang"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                      <FormLabel className="text-right">{t('speechSynthesis')}</FormLabel>
                      <FormControl>
                        <Select defaultValue={field.value} onValueChange={handleTTSChange}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder={t('followTheSystem')} />
                          </SelectTrigger>
                          <SelectContent>
                            <LangOptions />
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ttsVoice"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                      <FormLabel className="text-right">{t('soundSource')}</FormLabel>
                      <FormControl>
                        <Select defaultValue={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder={t('followTheSystem')} />
                          </SelectTrigger>
                          <SelectContent>
                            {values(voiceOptions).map((option) => {
                              return (
                                <SelectItem key={option.value} value={option.value as string}>
                                  {option.label}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="autoStopRecord"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                      <FormLabel className="text-right">{t('autoStopRecord')}</FormLabel>
                      <FormControl>
                        <>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                          <span className="text-center">{field.value ? t('settingEnable') : t('settingDisable')}</span>
                        </>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </ResponsiveDialog>
  )
}

export default memo(Setting)
