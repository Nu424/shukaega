import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'

import {
  DEFAULT_GRANULARITY,
  DEFAULT_LEVEL,
  DEFAULT_MODEL,
  STORAGE_KEYS,
  type DifficultyLevel,
  type Granularity,
} from '../utils/constants'

export type OpenRouterStoreState = {
  apiKey: string | null
  model: string
  level: DifficultyLevel | string
  granularity: Granularity
  setApiKey: (apiKey: string | null) => void
  setModel: (model: string) => void
  setLevel: (level: DifficultyLevel | string) => void
  setGranularity: (granularity: Granularity) => void
  clearCredentials: () => void
}

const isBrowser = typeof window !== 'undefined'
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

const DEFAULT_STATE: Pick<OpenRouterStoreState, 'apiKey' | 'model' | 'level' | 'granularity'> = {
  apiKey: null,
  model: DEFAULT_MODEL,
  level: DEFAULT_LEVEL,
  granularity: DEFAULT_GRANULARITY as Granularity,
}

function readLegacyState() {
  if (!isBrowser) {
    return { ...DEFAULT_STATE }
  }

  const storedApiKey = window.localStorage.getItem(STORAGE_KEYS.apiKey)
  const storedModel = window.localStorage.getItem(STORAGE_KEYS.model)
  const storedLevel = window.localStorage.getItem(STORAGE_KEYS.level)
  const storedGranularity = window.localStorage.getItem(STORAGE_KEYS.granularity)

  return {
    apiKey: storedApiKey ?? DEFAULT_STATE.apiKey,
    model: storedModel ?? DEFAULT_STATE.model,
    level: storedLevel ?? DEFAULT_STATE.level,
    granularity: (storedGranularity as Granularity | null) ?? DEFAULT_STATE.granularity,
  }
}

function clearLegacyKeys() {
  if (!isBrowser) return
  window.localStorage.removeItem(STORAGE_KEYS.apiKey)
  window.localStorage.removeItem(STORAGE_KEYS.model)
  window.localStorage.removeItem(STORAGE_KEYS.level)
  window.localStorage.removeItem(STORAGE_KEYS.granularity)
}

export const useOpenRouterStore = create<OpenRouterStoreState>()(
  persist(
    (set) => ({
      ...readLegacyState(),
      setApiKey(apiKey) {
        set({ apiKey })
      },
      setModel(model) {
        set({ model })
      },
      setLevel(level) {
        set({ level })
      },
      setGranularity(granularity) {
        set({ granularity })
      },
      clearCredentials() {
        set({ apiKey: null })
      },
    }),
    {
      name: 'shukaega-openrouter',
      version: 1,
      storage: createJSONStorage(() => (isBrowser ? window.localStorage : noopStorage)),
      onRehydrateStorage: () => () => {
        clearLegacyKeys()
      },
    },
  ),
)

