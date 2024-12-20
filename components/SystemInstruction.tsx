'use client'
import { useState, useEffect, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import MarkdownIt from 'markdown-it'
import markdownHighlight from 'markdown-it-highlightjs'
import highlight from 'highlight.js'
import markdownKatex from '@traptitech/markdown-it-katex'
import { X, SquarePen, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import Button from '@/components/Button'
import { useMessageStore } from '@/store/chat'
import { useSettingStore } from '@/store/setting'
import { encodeToken } from '@/utils/signature'
import optimizePrompt, { type RequestProps } from '@/utils/optimizePrompt'
import { upperFirst } from 'lodash-es'

const formSchema = z.object({
  content: z.string(),
})

function SystemInstruction() {
  const { t } = useTranslation()
  const { instruction, setSystemInstructionEditMode } = useMessageStore()
  const systemInstruction = useMessageStore((state) => state.systemInstruction)
  const systemInstructionEditMode = useMessageStore((state) => state.systemInstructionEditMode)
  const [html, setHtml] = useState<string>('')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: systemInstruction,
    },
  })

  const handleSave = useCallback(() => {
    const { content } = form.getValues()
    instruction(content)
    setSystemInstructionEditMode(false)
  }, [form, instruction, setSystemInstructionEditMode])

  const handleClear = useCallback(() => {
    instruction('')
    setSystemInstructionEditMode(false)
  }, [instruction, setSystemInstructionEditMode])

  const optimizeAssistantPrompt = useCallback(async () => {
    if (systemInstruction === '') return false
    const { apiKey, apiProxy, model, password } = useSettingStore.getState()
    const config: RequestProps = {
      apiKey,
      model,
      content: systemInstruction,
    }
    if (apiKey !== '') {
      if (apiProxy) config.baseUrl = apiProxy
    } else {
      config.apiKey = encodeToken(password)
      config.baseUrl = '/api/google'
    }
    const readableStream = await optimizePrompt(config)
    let content = ''
    const reader = readableStream.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      content += new TextDecoder().decode(value)
      form.setValue('content', content)
    }
  }, [form, systemInstruction])

  const render = useCallback((content: string) => {
    const md: MarkdownIt = MarkdownIt({
      linkify: true,
      breaks: true,
    })
      .use(markdownHighlight)
      .use(markdownKatex)

    const mathLineRender = md.renderer.rules.math_inline!
    md.renderer.rules.math_inline = (...params) => {
      return `
          <div class="katex-inline-warpper">
            ${mathLineRender(...params)}
          </div>
        `
    }
    const mathBlockRender = md.renderer.rules.math_block!
    md.renderer.rules.math_block = (...params) => {
      return `
          <div class="katex-block-warpper">
            ${mathBlockRender(...params)}
          </div>
        `
    }
    const highlightRender = md.renderer.rules.fence!
    md.renderer.rules.fence = (...params) => {
      const [tokens, idx] = params
      const token = tokens[idx]
      const lang = token.info.trim()
      return `
          <div class="hljs-warpper">
            <div class="info">
              <span class="lang">${upperFirst(lang)}</span>
            </div>
            ${highlight.getLanguage(lang) ? highlightRender(...params) : null}
          </div>
        `
    }
    return md.render(content)
  }, [])

  useEffect(() => {
    setHtml(render(systemInstruction))
    return () => {
      setHtml('')
    }
  }, [systemInstruction, render])

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between space-y-0 px-4 pb-1 pt-3">
        <CardTitle className="inline-flex text-lg font-medium">
          {t('assistantSetting')}{' '}
          {systemInstructionEditMode ? (
            <Button
              className="ml-2 h-7 w-7"
              size="icon"
              variant="ghost"
              title={t('optimizePrompt')}
              onClick={() => optimizeAssistantPrompt()}
            >
              <Sparkles />
            </Button>
          ) : (
            <Button
              className="ml-2 h-7 w-7"
              size="icon"
              variant="ghost"
              title={t('editAssistantSettings')}
              onClick={() => setSystemInstructionEditMode(true)}
            >
              <SquarePen />
            </Button>
          )}
        </CardTitle>
        {systemInstructionEditMode ? (
          <div className="inline-flex gap-2">
            <Button className="h-7" size="sm" variant="outline" onClick={() => setSystemInstructionEditMode(false)}>
              {t('cancel')}
            </Button>
            <Button className="h-7" size="sm" type="submit" onClick={() => handleSave()}>
              {t('save')}
            </Button>
          </div>
        ) : (
          <X
            className="h-7 w-7 cursor-pointer rounded-full p-1 text-muted-foreground hover:bg-secondary/80"
            onClick={() => handleClear()}
          />
        )}
      </CardHeader>
      <div className="max-h-[140px] overflow-auto">
        <CardContent className="p-4 pt-0">
          {systemInstructionEditMode ? (
            <Form {...form}>
              <form>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea rows={5} placeholder={t('systemInstructionPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          ) : (
            <div className="prose break-all text-sm leading-6" dangerouslySetInnerHTML={{ __html: html }}></div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}

export default memo(SystemInstruction)
