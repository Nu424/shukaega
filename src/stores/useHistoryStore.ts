import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { Feedback, HistoryItem, Prompt } from '../types/lesson'
import {
  loadPersistedState,
  savePersistedState,
  safeStorage,
} from '../utils/storage'

const STORAGE_KEY = 'lesson-history'

export type HistoryState = {
  items: HistoryItem[]
  add: (item: Omit<HistoryItem, 'id' | 'createdAt'>) => HistoryItem
  clear: () => void
  getWrongOnes: () => HistoryItem[]
  loadFromLocalStorage: () => void
  saveToLocalStorage: () => void
}

let idCounter = 0
const createHistoryItem = (
  data: Omit<HistoryItem, 'id' | 'createdAt'>,
): HistoryItem => ({
  ...data,
  id: `history-${Date.now()}-${idCounter++}`,
  createdAt: new Date().toISOString(),
})

const isWrong = (feedback: Feedback | null): boolean => {
  if (!feedback) return true
  return Number.isFinite(feedback.score) ? feedback.score < 80 : true
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        const historyItem = createHistoryItem(item)
        set((state) => ({ items: [historyItem, ...state.items].slice(0, 100) }))
        get().saveToLocalStorage()
        return historyItem
      },
      clear: () => {
        set({ items: [] })
        get().saveToLocalStorage()
      },
      getWrongOnes: () => get().items.filter((entry) => isWrong(entry.feedback)),
      loadFromLocalStorage: () => {
        const restored = loadPersistedState<HistoryState>(safeStorage, STORAGE_KEY)
        if (restored && Array.isArray(restored.items)) {
          set({ items: restored.items as HistoryItem[] })
        }
      },
      saveToLocalStorage: () => {
        const { items } = get()
        savePersistedState(safeStorage, STORAGE_KEY, { items })
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
)

export const createHistoryEntry = (prompt: Prompt, userAnswer: string, feedback: Feedback | null) => ({
  prompt,
  userAnswer,
  feedback,
})
