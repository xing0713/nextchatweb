import { create } from 'zustand'
import { persist, type StorageValue } from 'zustand/middleware'
import storage from '@/utils/Storage'
import { findIndex, omitBy, pick, isFunction, isNull } from 'lodash-es'

type MessageStore = {
  title: string
  messages: Message[]
  summary: Summary
  systemInstruction: string
  systemInstructionEditMode: boolean
  chatLayout: 'chat' | 'doc'
  add: (message: Message) => void
  update: (id: string, message: Message) => void
  remove: (id: string) => void
  clear: () => void
  revoke: (id: string) => void
  instruction: (prompt: string, title?: string) => void
  setSystemInstructionEditMode: (open: boolean) => void
  summarize: (ids: string[], content: string) => void
  changeChatLayout: (type: 'chat' | 'doc') => void
  setTitle: (title: string) => void
  backup: () => Conversation
  restore: (conversation: Conversation) => void
}

export const useMessageStore = create(
  persist<MessageStore>(
    (set, get) => ({
      title: '',
      messages: [],
      summary: {
        ids: [],
        content: '',
      },
      systemInstruction: '',
      systemInstructionEditMode: false,
      chatLayout: 'doc',
      add: (message) => {
        set((state) => ({
          messages: [...state.messages, message],
        }))
      },
      update: (id, message) => {
        const messages = [...get().messages]
        const index = findIndex(messages, { id })
        if (index > -1) {
          messages[index] = message
          set(() => ({ messages }))
        }
      },
      remove: (id) => {
        const newMessages = get().messages.filter((item) => item.id !== id)
        set(() => ({ messages: newMessages }))
      },
      clear: () => {
        set(() => ({
          messages: [],
          summary: { ids: [], content: '' },
        }))
      },
      revoke: (id) => {
        const messages = [...get().messages]
        const index = findIndex(messages, { id })
        if (index > -1) {
          messages.splice(index, 1)
          set(() => ({ messages: messages.slice(0, index) }))
        }
      },
      instruction: (prompt, title) => {
        if (title) set(() => ({ title }))
        set(() => ({ title, systemInstruction: prompt }))
      },
      setSystemInstructionEditMode: (open) => {
        set(() => ({ systemInstructionEditMode: open }))
      },
      summarize: (ids, content) => {
        set(() => ({ summary: { ids, content } }))
      },
      changeChatLayout: (type) => {
        set(() => ({ chatLayout: type }))
      },
      setTitle: (title) => {
        set(() => ({ title }))
      },
      backup: () => {
        const store = get()
        return { ...pick(store, ['title', 'messages', 'summary', 'systemInstruction', 'chatLayout']) }
      },
      restore: (conversation) => {
        set(() => ({ ...conversation }))
      },
    }),
    {
      name: 'chatStore',
      version: 1,
      storage: {
        getItem: async (key: string) => {
          const store = await storage.getItem<StorageValue<MessageStore>>(key)
          /**
           * Since the data storage structure has changed since version 0.13.0,
           * the logic here is used to migrate the data content of the old version.
           */
          if (isNull(store)) {
            try {
              const state: Record<string, any> = {}
              const oldState: string[] = ['messages', 'summary', 'systemInstruction']
              for await (const name of oldState) {
                const data = await storage.getItem(name)
                if (data) state[name] = data
                await storage.removeItem(name)
              }
              return { state, version: 1 } as StorageValue<MessageStore>
            } catch (err) {
              console.error(err)
              return store
            }
          }
          return store
        },
        setItem: async (key: string, store: StorageValue<MessageStore>) => {
          return await storage.setItem(key, {
            state: omitBy(store.state, (item) => isFunction(item)),
            version: store.version,
          })
        },
        removeItem: async (key: string) => await storage.removeItem(key),
      },
    },
  ),
)
