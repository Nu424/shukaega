import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'

import { MAX_HISTORY_ITEMS, SCORE_THRESHOLDS } from '../utils/constants'
import type { LessonFeedback, LessonPrompt } from './useLessonStore'

export type HistoryItem = {
  id: string
  prompt: LessonPrompt
  userAnswer: string
  feedback: LessonFeedback | null
  createdAt: string
  isManualReview?: boolean
}

type HistoryStoreState = {
  items: HistoryItem[]
  add: (entry: Omit<HistoryItem, 'id' | 'createdAt'> & { createdAt?: string }) => HistoryItem
  remove: (id: string) => void
  clear: () => void
  getWrongOnes: (threshold?: number) => HistoryItem[]
  addToReview: (id: string) => void
  removeFromReview: (id: string) => void
}

const LEGACY_STORAGE_KEY = 'shukaega_history_items'
const isBrowser = typeof window !== 'undefined'
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `hist-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function readLegacyItems(): HistoryItem[] {
  if (!isBrowser) return []
  const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => ({
          ...item,
          createdAt: item.createdAt ?? new Date().toISOString(),
          isManualReview: item.isManualReview ?? false,
        }))
        .slice(0, MAX_HISTORY_ITEMS)
    }
  } catch (error) {
    // ignore parsing errors
  }
  return []
}

function clearLegacyItems() {
  if (!isBrowser) return
  window.localStorage.removeItem(LEGACY_STORAGE_KEY)
}

export const useHistoryStore = create<HistoryStoreState>()(
  persist(
    (set, get) => ({
      items: readLegacyItems(),
      add(entry) {
        const item: HistoryItem = {
          id: createId(),
          prompt: entry.prompt,
          userAnswer: entry.userAnswer,
          feedback: entry.feedback ?? null,
          createdAt: entry.createdAt ?? new Date().toISOString(),
          isManualReview: entry.isManualReview ?? false,
        }
        const nextItems = [item, ...get().items].slice(0, MAX_HISTORY_ITEMS)
        set({ items: nextItems })
        return item
      },
      remove(id) {
        const nextItems = get().items.filter((item) => item.id !== id)
        set({ items: nextItems })
      },
      clear() {
        set({ items: [] })
      },
      getWrongOnes(threshold = 70) {
        return get().items.filter((item) => {
          if (item.isManualReview) return true
          const score = item.feedback?.score
          if (score == null) return true
          return score < threshold
        })
      },
      addToReview(id) {
        const nextItems = get().items.map((item) =>
          item.id === id ? { ...item, isManualReview: true } : item,
        )
        set({ items: nextItems })
      },
      removeFromReview(id) {
        const nextItems = get().items.map((item) =>
          item.id === id ? { ...item, isManualReview: false } : item,
        )
        set({ items: nextItems })
      },
    }),
    {
      name: 'shukaega-history',
      version: 1,
      storage: createJSONStorage(() => (isBrowser ? window.localStorage : noopStorage)),
      onRehydrateStorage: () => () => {
        clearLegacyItems()
      },
    },
  ),
)

export function isSuccessfulFeedback(feedback: LessonFeedback | null) {
  if (!feedback) return false
  return feedback.score >= SCORE_THRESHOLDS.success
}

