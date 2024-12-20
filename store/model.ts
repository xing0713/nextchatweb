import { create } from 'zustand'
import { persist, type StorageValue } from 'zustand/middleware'
import storage from '@/utils/Storage'
import { omitBy, isFunction, isNull } from 'lodash-es'

type ModelStore = {
  models: Model[]
  update: (models: Model[]) => void
}

export const useModelStore = create(
  persist<ModelStore>(
    (set) => ({
      models: [],
      update: (models) => set(() => ({ models: [...models] })),
    }),
    {
      name: 'modelStore',
      version: 1,
      storage: {
        getItem: async (key: string) => {
          const store = await storage.getItem<StorageValue<ModelStore>>(key)
          /**
           * Since the data storage structure has changed since version 0.13.0,
           * the logic here is used to migrate the data content of the old version.
           */
          if (isNull(store)) {
            try {
              const state: Record<string, any> = {}
              const oldState: string[] = ['models', 'cachedTime', 'modelsCachedTime']
              for await (const name of oldState) {
                const data = await storage.getItem(name)
                if (data) {
                  if (name === 'modelsCachedTime') {
                    state['cachedTime'] = data
                  } else {
                    state[name] = data
                  }
                }
                await storage.removeItem(name)
              }
              return { state, version: 1 } as StorageValue<ModelStore>
            } catch (err) {
              console.error(err)
              return store
            }
          }
          return store
        },
        setItem: async (key: string, store: StorageValue<ModelStore>) => {
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
