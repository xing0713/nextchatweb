'use client'
import { useEffect, useState, useCallback, useMemo, memo } from 'react'
import { useTranslation } from 'react-i18next'
import Lightbox from 'yet-another-react-lightbox'
import LightboxFullscreen from 'yet-another-react-lightbox/plugins/fullscreen'
import MarkdownIt from 'markdown-it'
import markdownHighlight from 'markdown-it-highlightjs'
import highlight from 'highlight.js'
import markdownKatex from '@traptitech/markdown-it-katex'
import Clipboard from 'clipboard'
import {
  User,
  Bot,
  RotateCw,
  Sparkles,
  Copy,
  CopyCheck,
  PencilLine,
  Eraser,
  Volume2,
  Eye,
  LoaderCircle,
  CircleCheck,
  Blocks,
} from 'lucide-react'
import { EdgeSpeech } from '@xiangfa/polly'
import type { SearchResult } from 'duck-duck-scrape'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import BubblesLoading from '@/components/BubblesLoading'
import FileList from '@/components/FileList'
import EditableArea from '@/components/EditableArea'
import AudioPlayer from '@/components/AudioPlayer'
import IconButton from '@/components/IconButton'
import Button from '@/components/Button'
import WebSearch from '@/components/plugins/WebSearch'
import Weather, { type WeatherResult } from '@/components/plugins/Weather'
import Unsplash from '@/components/plugins/Unsplash'
import Arxiv from '@/components/plugins/Arxiv'
import { useMessageStore } from '@/store/chat'
import { useSettingStore } from '@/store/setting'
import { usePluginStore } from '@/store/plugin'
import AudioStream from '@/utils/AudioStream'
import { sentenceSegmentation } from '@/utils/common'
import { cn } from '@/utils'
import { OFFICAL_PLUGINS } from '@/constant/plugins'
import { upperFirst, isFunction, find } from 'lodash-es'

import 'katex/dist/katex.min.css'
import 'highlight.js/styles/a11y-light.css'
import 'yet-another-react-lightbox/styles.css'

interface Props extends Message {
  onRegenerate?: (id: string) => void
}

const registerCopy = (className: string) => {
  const clipboard = new Clipboard(className, {
    text: (trigger) => {
      return decodeURIComponent(trigger.getAttribute('data-clipboard-text') || '')
    },
  })
  return clipboard
}

function filterMarkdown(text: string): string {
  const md = new MarkdownIt()
  // Convert Markdown to HTML using markdown-it
  const html = md.render(text)
  // Convert HTML to DOM objects using DOMParser
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  // Get filtered text content
  const filteredText = doc.body.textContent || ''
  return filteredText
}

function mergeSentences(sentences: string[], sentenceLength = 20): string[] {
  const mergedSentences: string[] = []
  let currentSentence = ''

  sentences.forEach((sentence) => {
    if (currentSentence.length + sentence.length >= sentenceLength) {
      mergedSentences.push(currentSentence.trim())
      currentSentence = sentence
    } else {
      currentSentence += ' ' + sentence
    }
  })

  if (currentSentence.trim() !== '') {
    mergedSentences.push(currentSentence.trim())
  }
  return mergedSentences
}

function MessageItem(props: Props) {
  const { id, role, parts, attachments, onRegenerate } = props
  const { t } = useTranslation()
  const [html, setHtml] = useState<string>('')
  const chatLayout = useMessageStore((state) => state.chatLayout)
  const [hasTextContent, setHasTextContent] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isCopyed, setIsCopyed] = useState<boolean>(false)
  const [showLightbox, setShowLightbox] = useState<boolean>(false)
  const [lightboxIndex, setLightboxIndex] = useState<number>(0)
  const fileList = useMemo(() => {
    return attachments ? attachments.filter((item) => !item.metadata?.mimeType.startsWith('image/')) : []
  }, [attachments])
  const inlineImageList = useMemo(() => {
    const imageList: string[] = []
    parts.forEach(async (part) => {
      if (part.inlineData?.mimeType.startsWith('image/')) {
        imageList.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`)
      } else if (part.fileData && attachments) {
        for (const attachment of attachments) {
          if (attachment.metadata?.uri === part.fileData.fileUri) {
            if (part.fileData?.mimeType.startsWith('image/') && attachment.preview) {
              imageList.push(attachment.preview)
            }
          }
        }
      }
    })
    return imageList
  }, [parts, attachments])
  const inlineAudioList = useMemo(() => {
    const audioList: string[] = []
    parts.forEach(async (part) => {
      if (part.inlineData?.mimeType.startsWith('audio/')) {
        audioList.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`)
      }
    })
    return audioList
  }, [parts])
  const content = useMemo(() => {
    let text = ''
    parts.forEach((item) => {
      if (item.text) text = item.text
    })
    return text
  }, [parts])

  const handleRegenerate = useCallback(
    (id: string) => {
      if (isFunction(onRegenerate)) {
        onRegenerate(id)
      }
    },
    [onRegenerate],
  )

  const handleEdit = useCallback((id: string, content: string) => {
    const { messages, update } = useMessageStore.getState()
    const message = find(messages, { id })

    if (message) {
      const messageParts = [...message.parts]
      messageParts.map((part) => {
        if (part.text) part.text = content
      })
      update(id, { ...message, parts: messageParts })
    }

    setIsEditing(false)
  }, [])

  const handleDelete = useCallback((id: string) => {
    const { remove } = useMessageStore.getState()
    remove(id)
  }, [])

  const handleCopy = useCallback(() => {
    setIsCopyed(true)
    setTimeout(() => {
      setIsCopyed(false)
    }, 2000)
  }, [])

  const handleSpeak = useCallback(async () => {
    const { lang, ttsLang, ttsVoice } = useSettingStore.getState()
    const sentences = mergeSentences(sentenceSegmentation(filterMarkdown(content), lang), 100)
    const edgeSpeech = new EdgeSpeech({ locale: ttsLang })
    const audioStream = new AudioStream()

    for (const sentence of sentences) {
      const response = await edgeSpeech.create({
        input: sentence,
        options: { voice: ttsVoice },
      })
      if (response) {
        const audioData = await response.arrayBuffer()
        audioStream.play({ audioData })
      }
    }
  }, [content])

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
    setShowLightbox(true)
  }, [])

  const render = useCallback(
    (content: string) => {
      const md: MarkdownIt = MarkdownIt({
        linkify: true,
        breaks: true,
      })
        .use(markdownHighlight)
        .use(markdownKatex)

      // Save the original text rule
      const defaultTextRules = md.renderer.rules.text!

      // Rewrite the `strong` rule to adapt to Gemini generation grammar
      md.renderer.rules.text = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        const content = token.content

        // Check whether it conforms to the `strong` format
        const match = content.match(/^\*\*(.+?)\*\*(.+)/)
        if (match) {
          return `<b>${match[1]}</b>${match[2]}`
        }

        // If the format is not met, the original `strong` rule is called
        return defaultTextRules(tokens, idx, options, env, self)
      }

      md.renderer.rules.table_open = function (tokens, idx, options) {
        return `<div style="overflow-x:auto;"><table>`
      }

      md.renderer.rules.table_close = function (tokens, idx, options) {
        return '</table></div>'
      }

      const mathLineRender = md.renderer.rules.math_inline!
      md.renderer.rules.math_inline = (...params) => {
        const [tokens, idx] = params
        const token = tokens[idx]
        return `
          <div class="katex-inline-warpper">
            <span class="copy copy-katex-inline" data-clipboard-text="${encodeURIComponent(token.content)}">${t(
              'copy',
            )}</span>
            ${mathLineRender(...params)}
          </div>
        `
      }
      const mathBlockRender = md.renderer.rules.math_block!
      md.renderer.rules.math_block = (...params) => {
        const [tokens, idx] = params
        const token = tokens[idx]
        return `
          <div class="katex-block-warpper">
            <span class="copy copy-katex-block" data-clipboard-text="${encodeURIComponent(token.content)}">${t(
              'copy',
            )}</span>
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
              <span class="copy copy-code" data-clipboard-text="${encodeURIComponent(token.content)}">${t(
                'copy',
              )}</span>
            </div>
            ${highlight.getLanguage(lang) ? highlightRender(...params) : null}
          </div>
        `
      }
      return md.render(content)
    },
    [t],
  )

  const MessageAvatar = () => {
    if (role === 'user') {
      return (
        <AvatarFallback className="bg-green-300 text-white">
          <User className="h-5 w-5" />
        </AvatarFallback>
      )
    } else if (role === 'function') {
      return (
        <AvatarFallback className="bg-blue-300 text-white">
          <Blocks className="h-5 w-5" />
        </AvatarFallback>
      )
    } else {
      return (
        <AvatarFallback className="bg-red-300 text-white">
          <Bot className="h-5 w-5" />
        </AvatarFallback>
      )
    }
  }

  const getPluginInfo = (name: string) => {
    const { installed } = usePluginStore.getState()
    const pluginId = name.split('__')[0]
    if (installed[pluginId]) return installed[pluginId]?.info
    return { title: pluginId, description: '' }
  }

  const MessageContent = () => {
    if (role === 'model' && parts && parts[0].text === '') {
      return <BubblesLoading />
    } else if (role === 'function' && parts && parts[0].functionResponse) {
      const pluginsDetail: {
        id: string
        title: string
        description?: string
        response?: FunctionResponse
      }[] = []
      for (const part of parts) {
        if (part.functionResponse) {
          const pluginInfo = getPluginInfo(part.functionResponse.name)
          pluginsDetail.push({
            id: part.functionResponse.name.split('__')[0],
            title: pluginInfo.title,
            description: pluginInfo.description,
            response: part.functionResponse.response as FunctionResponse,
          })
        }
      }
      return pluginsDetail.map((detail) => {
        return detail.response?.content ? (
          <div key={detail.id} className="w-full">
            <div className="mb-3">
              <Button variant="outline" title={detail.description}>
                {detail.title}
                <CircleCheck className="ml-1.5 h-5 w-5" />
              </Button>
            </div>
            {detail.id === OFFICAL_PLUGINS.SEARCH ? (
              <WebSearch data={detail.response.content as SearchResult[]} />
            ) : null}
            {detail.id === OFFICAL_PLUGINS.WEATHER ? <Weather data={detail.response.content as WeatherResult} /> : null}
            {detail.id === OFFICAL_PLUGINS.UNSPLASH ? (
              <Unsplash data={detail.response.content as UnsplashImage[]} />
            ) : null}
            {detail.id === OFFICAL_PLUGINS.ARXIV ? (
              <Arxiv data={(detail.response.content as ArxivResult)?.data} />
            ) : null}
          </div>
        ) : (
          <div key={detail.id}>
            <div className="mb-3">
              <Button variant="outline" title={detail.description}>
                {detail.title}
                <LoaderCircle className="ml-1.5 h-5 w-5 animate-spin" />
              </Button>
            </div>
          </div>
        )
      })
    } else {
      return (
        <div className="group flex-auto">
          {fileList.length > 0 ? (
            <div className="not:last:border-dashed not:last:border-b w-full pb-2">
              <FileList fileList={fileList} />
            </div>
          ) : null}
          {inlineAudioList.length > 0 ? (
            <div className="not:last:border-dashed not:last:border-b flex w-full flex-wrap pb-2">
              {inlineAudioList.map((audio, idx) => {
                return <AudioPlayer key={idx} className="mb-2" src={audio} />
              })}
            </div>
          ) : null}
          {inlineImageList.length > 0 ? (
            <div className="flex flex-wrap gap-2 pb-2">
              {inlineImageList.map((image, idx) => {
                return (
                  <div key={idx} className="group/image relative cursor-pointer" onClick={() => openLightbox(idx)}>
                    {
                      // eslint-disable-next-line
                      <img className="max-h-48 rounded-sm" src={image} alt="inline-image" />
                    }
                    <Eye className="absolute left-1/2 top-1/2 -ml-4 -mt-4 h-8 w-8 text-white/80 opacity-0 group-hover/image:opacity-100" />
                  </div>
                )
              })}
            </div>
          ) : null}
          {!isEditing ? (
            <>
              <div
                className="prose chat-content break-words text-base leading-8"
                dangerouslySetInnerHTML={{ __html: html }}
              ></div>
              <div
                className={cn(
                  'flex gap-1 text-right opacity-0 transition-opacity duration-300 group-hover:opacity-100',
                  role === 'user' && chatLayout === 'chat' ? 'justify-start' : 'justify-end',
                )}
              >
                {id !== 'preview' ? (
                  <>
                    <IconButton
                      title={t(role === 'user' ? 'resend' : 'regenerate')}
                      onClick={() => handleRegenerate(id)}
                    >
                      {role === 'user' ? <RotateCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    </IconButton>
                    <IconButton title={t('edit')} onClick={() => setIsEditing(true)}>
                      <PencilLine className="h-4 w-4" />
                    </IconButton>
                    <IconButton title={t('delete')} onClick={() => handleDelete(id)}>
                      <Eraser className="h-4 w-4" />
                    </IconButton>
                  </>
                ) : null}
                {hasTextContent ? (
                  <>
                    <IconButton title={t('copy')} className={`copy-${id}`} onClick={() => handleCopy()}>
                      {isCopyed ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </IconButton>
                    <IconButton title={t('speak')} onClick={() => handleSpeak()}>
                      <Volume2 className="h-4 w-4" />
                    </IconButton>
                  </>
                ) : null}
              </div>
            </>
          ) : (
            <EditableArea
              content={content}
              isEditing={isEditing}
              onChange={(content) => handleEdit(id, content)}
              onCancel={() => setIsEditing(false)}
            />
          )}
        </div>
      )
    }
  }

  useEffect(() => {
    const messageParts: string[] = []
    parts.forEach(async (part) => {
      if (part.text) {
        messageParts.push(render(part.text))
        setHasTextContent(true)
      }
    })
    setHtml(messageParts.join(''))
    const copyKatexInline = registerCopy('.copy-katex-inline')
    const copyKatexBlock = registerCopy('.copy-katex-block')
    const copyCode = registerCopy('.copy-code')

    const copyContent = new Clipboard(`.copy-${id}`, {
      text: () => content,
    })
    return () => {
      setHtml('')
      copyKatexInline.destroy()
      copyKatexBlock.destroy()
      copyCode.destroy()
      copyContent.destroy()
    }
  }, [id, content, parts, attachments, render])

  return (
    <>
      <Avatar className="h-8 w-8">
        <MessageAvatar />
      </Avatar>
      <MessageContent />
      <Lightbox
        open={showLightbox}
        close={() => setShowLightbox(false)}
        slides={inlineImageList.map((item) => ({ src: item }))}
        index={lightboxIndex}
        plugins={[LightboxFullscreen]}
      />
    </>
  )
}

export default memo(MessageItem)
