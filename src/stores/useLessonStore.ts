import { create } from 'zustand'

import type { Feedback, HistoryItem, Prompt } from '../types/lesson'
import {
  evaluateAnswer as evaluateWithLLM,
  fallbackFeedback,
  fallbackPrompt,
  requestPrompt,
} from '../services/openrouter'
import { useHistoryStore } from './useHistoryStore'
import { useOpenRouterStore } from './useOpenRouterStore'

export type LessonMode = 'practice' | 'review'

export type LessonState = {
  currentPrompt: Prompt | null
  userAnswer: string
  feedback: Feedback | null
  isGeneratingPrompt: boolean
  isEvaluating: boolean
  mode: LessonMode
  reviewQueue: HistoryItem[]
  reviewIndex: number
  error: string | null
  initialize: () => Promise<void>
  generatePrompt: (theme?: string) => Promise<void>
  setUserAnswer: (answer: string) => void
  clearFeedback: () => void
  evaluateAnswer: () => Promise<void>
  next: () => Promise<void>
  enterReviewMode: () => Promise<void>
  exitReviewMode: () => void
  focusHistoryItem: (item: HistoryItem) => void
}

export const useLessonStore = create<LessonState>((set, get) => ({
  currentPrompt: null,
  userAnswer: '',
  feedback: null,
  isGeneratingPrompt: false,
  isEvaluating: false,
  mode: 'practice',
  reviewQueue: [],
  reviewIndex: 0,
  error: null,
  initialize: async () => {
    const { currentPrompt } = get()
    if (!currentPrompt) {
      await get().generatePrompt()
    }
  },
  generatePrompt: async (theme) => {
    set({ isGeneratingPrompt: true, error: null })
    try {
      const { apiKey, model } = useOpenRouterStore.getState()
      let prompt: Prompt | null = null
      if (apiKey) {
        prompt = await requestPrompt({ apiKey, model, theme })
      }
      if (!prompt) {
        prompt = fallbackPrompt(theme)
      }
      set({
        currentPrompt: prompt,
        userAnswer: '',
        feedback: null,
        mode: 'practice',
        reviewQueue: [],
        reviewIndex: 0,
      })
    } catch (error) {
      console.warn('[lessonStore] Failed to generate prompt', error)
      set({ error: 'お題の生成に失敗しました。時間をおいて再度お試しください。' })
      const prompt = fallbackPrompt(theme)
      set({
        currentPrompt: prompt,
        userAnswer: '',
        feedback: null,
      })
    } finally {
      set({ isGeneratingPrompt: false })
    }
  },
  setUserAnswer: (answer) => set({ userAnswer: answer }),
  clearFeedback: () => set({ feedback: null }),
  evaluateAnswer: async () => {
    const { currentPrompt, userAnswer, feedback } = get()
    if (!currentPrompt) {
      set({ error: 'お題が読み込まれていません。' })
      return
    }
    if (!userAnswer.trim()) {
      set({ error: 'まずは回答を入力してください。' })
      return
    }
    if (feedback) {
      return
    }

    set({ isEvaluating: true, error: null })
    try {
      const { apiKey, model } = useOpenRouterStore.getState()
      let result: Feedback | null = null
      if (apiKey) {
        result = await evaluateWithLLM({
          apiKey,
          model,
          prompt: currentPrompt,
          userAnswer,
        })
      }
      if (!result) {
        result = fallbackFeedback(currentPrompt, userAnswer)
      }
      set({ feedback: result })
    } catch (error) {
      console.warn('[lessonStore] Failed to evaluate answer', error)
      const result = fallbackFeedback(currentPrompt, userAnswer)
      set({
        feedback: result,
        error: 'フィードバックの取得に失敗したため、ローカル評価を表示します。',
      })
    } finally {
      set({ isEvaluating: false })
    }
  },
  next: async () => {
    const { currentPrompt, userAnswer, feedback, mode, reviewQueue, reviewIndex } = get()
    if (!currentPrompt) {
      return
    }

    useHistoryStore.getState().add({ prompt: currentPrompt, userAnswer, feedback })

    if (mode === 'review') {
      const nextIndex = reviewIndex + 1
      if (nextIndex < reviewQueue.length) {
        const nextItem = reviewQueue[nextIndex]
        set({
          currentPrompt: nextItem.prompt,
          userAnswer: '',
          feedback: nextItem.feedback,
          reviewIndex: nextIndex,
          error: null,
        })
        return
      }

      set({ mode: 'practice', reviewQueue: [], reviewIndex: 0 })
      await get().generatePrompt()
      return
    }

    await get().generatePrompt()
  },
  enterReviewMode: async () => {
    const wrongOnes = useHistoryStore.getState().getWrongOnes()
    if (wrongOnes.length === 0) {
      set({ error: '復習する履歴がまだありません。' })
      return
    }

    set({
      mode: 'review',
      reviewQueue: wrongOnes,
      reviewIndex: 0,
      currentPrompt: wrongOnes[0].prompt,
      userAnswer: '',
      feedback: wrongOnes[0].feedback,
      error: null,
    })
  },
  exitReviewMode: () => {
    set({ mode: 'practice', reviewQueue: [], reviewIndex: 0, error: null })
  },
  focusHistoryItem: (item) => {
    set({
      mode: 'review',
      reviewQueue: [item],
      reviewIndex: 0,
      currentPrompt: item.prompt,
      userAnswer: '',
      feedback: item.feedback,
      error: null,
    })
  },
}))
