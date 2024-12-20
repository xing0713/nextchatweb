import { create } from 'zustand'
import { persist, type StorageValue } from 'zustand/middleware'
import storage from '@/utils/Storage'
import { shuffleArray } from '@/utils/common'
import { omitBy, isFunction, findIndex } from 'lodash-es'

type AssistantStore = {
  assistants: AssistantDetail[]
  favorites: string[]
  tags: string[]
  recommendation: AssistantDetail[]
  cachedTime: number
  cachedLang: string
  update: (assistants: AssistantDetail[]) => void
  addAssistant: (assistant: AssistantDetail) => void
  updateAssistant: (id: string, assistant: AssistantDetail) => void
  removeAssistant: (id: string) => void
  addFavorite: (id: string) => void
  removeFavorite: (id: string) => void
  updateTags: (tags: string[]) => void
  recommend: (amount: number) => void
  setCachedTime: (timestamp: number) => void
  setCachedLang: (lang: string) => void
}

export const useAssistantStore = create(
  persist<AssistantStore>(
    (set, get) => ({
      assistants: [],
      favorites: [],
      tags: [],
      recommendation: [],
      cachedTime: 0,
      cachedLang: '',
      update: (assistantList) => {
        const assistants = [...get().assistants]
        assistantList.reverse().forEach((item) => {
          const index = findIndex(assistants, { identifier: item.identifier })
          if (index > -1) {
            if (!assistants[index].config) {
              assistants[index] = item
            }
          } else {
            assistants.unshift(item)
          }
        })
        set(() => ({ assistants }))
      },
      addAssistant: (assistant) => {
        set(() => ({ assistants: [assistant, ...get().assistants] }))
      },
      updateAssistant: (id, assistant) => {
        const assistants = [...get().assistants]
        const index = findIndex(assistants, { identifier: id })
        if (index > -1) {
          assistants[index] = assistant
          set(() => ({ assistants }))
        }
      },
      removeAssistant: (id) => {
        const newAssistants = get().assistants.filter((item) => item.identifier !== id)
        set(() => ({ assistants: newAssistants }))
      },
      addFavorite: (id) => {
        const favorites = [...get().favorites]
        if (!favorites.includes(id)) {
          favorites.push(id)
          set(() => ({ favorites }))
        }
      },
      removeFavorite: (id) => {
        const newFavorites = get().favorites.filter((item) => item !== id)
        set(() => ({ favorites: newFavorites }))
      },
      updateTags: (tags) => {
        set(() => ({ tags: [...tags] }))
      },
      recommend: (amount = 1) => {
        set(() => ({
          recommendation: shuffleArray(get().assistants).slice(0, amount),
        }))
      },
      setCachedTime: (timestamp) => set(() => ({ cachedTime: timestamp })),
      setCachedLang: (lang) => set(() => ({ cachedLang: lang })),
    }),
    {
      name: 'assistantStore',
      version: 1,
      storage: {
        getItem: async (key: string) => {
          return await storage.getItem<StorageValue<AssistantStore>>(key)
        },
        setItem: async (key: string, store: StorageValue<AssistantStore>) => {
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
