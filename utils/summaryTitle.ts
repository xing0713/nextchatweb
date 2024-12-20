import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSummaryTitlePrompt } from '@/utils/prompt'

export type RequestProps = {
  apiKey: string
  baseUrl?: string
  model?: string
  lang: string
  systemRole: string
  messages: Message[]
}

const systemInstruction = `
You are an assistant who is good at conversations. You need to summarize the user's conversation into a title of 6 words or less. The title does not need to contain punctuation marks.
If the conversation contains system instructions, you can refer to the content of the system instructions to name it appropriately.
The title text needs to be output in the specified language type.
The content in the \`<conversation></conversation>\` tag is the conversation, the content in the \`<systemInstruction></systemInstruction>\` tag is the system instruction of the conversation, and the content in the \`<lang></lang>\` tag is the title language type. The labels here are only used to limit the data range. Do not output any label elements.
`

export default async function summaryTitle(props: RequestProps) {
  const { apiKey, model = 'gemini-pro', baseUrl, lang, systemRole, messages } = props
  const genAI = new GoogleGenerativeAI(apiKey)
  const geminiModel = genAI.getGenerativeModel({ model, systemInstruction }, { baseUrl })
  const { stream } = await geminiModel.generateContentStream([getSummaryTitlePrompt(lang, messages, systemRole)])
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      for await (const chunk of stream) {
        const text = chunk.text()
        const encoded = encoder.encode(text)
        controller.enqueue(encoded)
      }
      controller.close()
    },
  })
}
