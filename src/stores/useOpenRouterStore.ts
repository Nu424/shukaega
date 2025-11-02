import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'

import {
  DEFAULT_GRANULARITY,
  DEFAULT_LEVEL,
  DEFAULT_MODEL,
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

export const useOpenRouterStore = create<OpenRouterStoreState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
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
    },
  ),
)

