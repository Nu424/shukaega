import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import {
  loadPersistedState,
  savePersistedState,
  safeStorage,
} from '../utils/storage'

const STORAGE_KEY = 'openrouter-settings'

export type OpenRouterState = {
  apiKey: string | null
  model: string
  hydrated: boolean
  setApiKey: (apiKey: string | null) => void
  setModel: (model: string) => void
  clear: () => void
  loadFromLocalStorage: () => void
  saveToLocalStorage: () => void
  setHydrated: (hydrated: boolean) => void
}

export const useOpenRouterStore = create<OpenRouterState>()(
  persist(
    (set, get) => ({
      apiKey: null,
      model: 'openai/gpt-4o-mini',
      hydrated: false,
      setApiKey: (apiKey) => {
        set({ apiKey })
        get().saveToLocalStorage()
      },
      setModel: (model) => {
        set({ model })
        get().saveToLocalStorage()
      },
      clear: () => {
        set({ apiKey: null })
        get().saveToLocalStorage()
      },
      loadFromLocalStorage: () => {
        const restored = loadPersistedState<OpenRouterState>(safeStorage, STORAGE_KEY)
        if (restored) {
          const { apiKey, model } = restored
          set({ apiKey: apiKey ?? null, model: model ?? 'openai/gpt-4o-mini' })
        }
        set({ hydrated: true })
      },
      saveToLocalStorage: () => {
        const { apiKey, model } = get()
        savePersistedState(safeStorage, STORAGE_KEY, {
          apiKey,
          model,
          hydrated: true,
        })
      },
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        apiKey: state.apiKey,
        model: state.model,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('[openRouterStore] Failed to rehydrate', error)
        }
        state?.setHydrated(true)
      },
    },
  ),
)
