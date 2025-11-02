import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'

import { evaluateAnswer, generatePromptsBatch, MissingApiKeyError, OpenRouterError } from '../services/openrouter'
import { parseEvaluation, parseGeneratedPromptsBatch, type ParsedFeedback, type ParsedPrompt } from '../services/parser'
import { PROMPT_POOL_MAX, SCORE_THRESHOLDS } from '../utils/constants'
import { useOpenRouterStore } from './useOpenRouterStore'

export type LessonPrompt = ParsedPrompt & {
  id: string
  source: 'local' | 'llm'
}

export type LessonFeedback = ParsedFeedback

type LessonStoreState = {
  currentPrompt: LessonPrompt | null
  promptQueue: LessonPrompt[]
  generationContext: {
    theme: string | null
    level: string | null
  } | null
  selectedTheme: string | null
  userAnswer: string
  feedback: LessonFeedback | null
  isGeneratingPrompt: boolean
  isEvaluating: boolean
  isRefilling: boolean
  error: string | null
  lastResult?: {
    prompt: LessonPrompt | null
    answer: string
    feedback: LessonFeedback | null
  }
  promptPoolMax: number
  setUserAnswer: (value: string) => void
  resetFeedback: () => void
  setSelectedTheme: (theme: string | null) => void
  loadPrompt: (prompt: LessonPrompt) => void
  initializeQueue: (theme?: string | null) => Promise<LessonPrompt | null>
  generatePrompt: (theme?: string | null, options?: { force?: boolean }) => Promise<LessonPrompt | null>
  evaluateAnswer: () => Promise<LessonFeedback | null>
  next: (theme?: string | null) => Promise<LessonPrompt | null>
  retrySimilar: () => Promise<LessonPrompt | null>
}

const isBrowser = typeof window !== 'undefined'
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}
const PROMPT_REFILL_THRESHOLD = Math.floor(PROMPT_POOL_MAX / 2)

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function notifyMissingApiKey() {
  if (isBrowser) {
    window.dispatchEvent(
      new CustomEvent('nav-settings', {
        detail: {
          reason: 'missing-api-key',
          message: 'OpenRouter APIキーを設定してください。',
        },
      }),
    )
  }
}

function feedbackFromError(raw: string, message: string): LessonFeedback {
  return {
    score: 0,
    correctExample: '',
    difference: '',
    grammarPoint: '',
    encouragement: message,
    variations: [],
    raw,
  }
}

async function requestPromptBatch(count: number, theme: string | null, level: string | null) {
  const { apiKey, model } = useOpenRouterStore.getState()
  const raw = await generatePromptsBatch({
    apiKey,
    model,
    theme: theme ?? undefined,
    level: level ?? undefined,
    count,
  })
  const parsed = parseGeneratedPromptsBatch(raw)
  return parsed.map<LessonPrompt>((entry) => ({
    ...entry,
    id: createId('llm'),
    source: 'llm',
  }))
}

export const useLessonStore = create<LessonStoreState>()(
  persist(
    (set, get) => {
      const ensureQueue = async (options: { theme: string | null; force?: boolean }): Promise<LessonPrompt | null> => {
        const desiredTheme = options.theme
        const { level } = useOpenRouterStore.getState()
        const state = get()
        const currentContext = state.generationContext
        const sameTheme = currentContext?.theme === desiredTheme
        const sameLevel = currentContext?.level === (level ?? null)
        const needsRefresh = options.force || !sameTheme || !sameLevel || state.promptQueue.length === 0

        if (needsRefresh) {
          const count = state.promptPoolMax
          try {
            const prompts = await requestPromptBatch(count, desiredTheme, level ?? null)
            if (prompts.length === 0) {
              throw new OpenRouterError('お題の生成結果が空でした。', 500, null)
            }
            const [first, ...rest] = prompts
            set({
              currentPrompt: first,
              promptQueue: rest,
              generationContext: { theme: desiredTheme, level: level ?? null },
              selectedTheme: desiredTheme,
              userAnswer: '',
              feedback: null,
              error: null,
            })
            void refillQueue()
            return first
          } catch (error) {
            handlePromptError(error)
            return null
          }
        }

        const queue = state.promptQueue
        const [nextPrompt, ...rest] = queue
        if (!nextPrompt) {
          return ensureQueue({ theme: desiredTheme, force: true })
        }

        set({
          currentPrompt: nextPrompt,
          promptQueue: rest,
          selectedTheme: desiredTheme,
          userAnswer: '',
          feedback: null,
          error: null,
        })

        void refillQueue()
        return nextPrompt
      }

      const refillQueue = async () => {
        const state = get()
        if (state.isRefilling) return
        if (!state.generationContext) return
        if (state.promptQueue.length >= state.promptPoolMax) return
        if (state.promptQueue.length > PROMPT_REFILL_THRESHOLD) return

        set({ isRefilling: true })
        try {
          const needed = state.promptPoolMax - state.promptQueue.length
          if (needed <= 0) {
            return
          }
          const prompts = await requestPromptBatch(
            needed,
            state.generationContext.theme,
            state.generationContext.level,
          )
          if (prompts.length === 0) {
            return
          }
          set((current) => ({ promptQueue: [...current.promptQueue, ...prompts] }))
        } catch (error) {
          handlePromptError(error)
        } finally {
          set({ isRefilling: false })
        }
      }

      const handlePromptError = (error: unknown) => {
        if (error instanceof MissingApiKeyError) {
          notifyMissingApiKey()
          set({ error: 'OpenRouter APIキーを設定してください。', isGeneratingPrompt: false })
          return
        }

        if (error instanceof OpenRouterError) {
          set({ error: error.message, isGeneratingPrompt: false })
          return
        }

        set({ error: 'お題の生成に失敗しました。少し時間をおいて再試行してください。', isGeneratingPrompt: false })
      }

      return {
        currentPrompt: null,
        promptQueue: [],
        generationContext: null,
        selectedTheme: null,
        userAnswer: '',
        feedback: null,
        isGeneratingPrompt: false,
        isEvaluating: false,
        isRefilling: false,
        error: null,
        promptPoolMax: PROMPT_POOL_MAX,
        setUserAnswer(value) {
          set({ userAnswer: value })
        },
        resetFeedback() {
          set({ feedback: null, error: null })
        },
        setSelectedTheme(theme) {
          set({ selectedTheme: theme ?? null })
        },
        loadPrompt(prompt) {
          set({ currentPrompt: prompt, userAnswer: '', feedback: null, error: null })
        },
        async initializeQueue(theme) {
          set({ isGeneratingPrompt: true, error: null, feedback: null })
          try {
            return await ensureQueue({ theme: theme ?? null, force: true })
          } finally {
            set({ isGeneratingPrompt: false })
          }
        },
        async generatePrompt(theme, options) {
          set({ isGeneratingPrompt: true, error: null, feedback: null })
          try {
            return await ensureQueue({ theme: theme ?? get().selectedTheme ?? null, force: options?.force })
          } finally {
            set({ isGeneratingPrompt: false })
          }
        },
        async evaluateAnswer() {
          const { currentPrompt, userAnswer } = get()
          if (!currentPrompt) {
            return null
          }

          if (!userAnswer.trim()) {
            const encouragement = 'まずは文章を入力してみましょう！💪'
            const manualFeedback = feedbackFromError('', encouragement)
            set({ feedback: manualFeedback, error: '回答が入力されていません。' })
            return manualFeedback
          }

          set({ isEvaluating: true, error: null })

          const { apiKey, model, level, granularity } = useOpenRouterStore.getState()

          try {
            const raw = await evaluateAnswer({
              apiKey,
              model,
              ja: currentPrompt.ja,
              userAnswer,
              level,
              granularity,
            })
            const parsed = parseEvaluation(raw)
            set({ feedback: parsed, isEvaluating: false })
            return parsed
          } catch (error) {
            if (error instanceof MissingApiKeyError) {
              notifyMissingApiKey()
            }

            let message = '採点に失敗しました。少し時間をおいて再試行してください。'
            if (error instanceof OpenRouterError) {
              message = error.message
            }

            const fallback = feedbackFromError(userAnswer, message)
            set({ feedback: fallback, isEvaluating: false, error: message })
            return fallback
          }
        },
        async next(theme) {
          const snapshot = {
            prompt: get().currentPrompt,
            answer: get().userAnswer,
            feedback: get().feedback,
          }

          set({ userAnswer: '', feedback: null, error: null, lastResult: snapshot })

          return get().generatePrompt(theme ?? get().selectedTheme ?? null)
        },
        async retrySimilar() {
          const theme = get().currentPrompt?.theme ?? get().selectedTheme ?? null
          return get().generatePrompt(theme, { force: true })
        },
      }
    },
    {
      name: 'shukaega-lesson',
      storage: createJSONStorage(() => (isBrowser ? window.localStorage : noopStorage)),
      partialize: (state) => ({
        currentPrompt: state.currentPrompt,
        promptQueue: state.promptQueue,
        generationContext: state.generationContext,
        selectedTheme: state.selectedTheme,
        userAnswer: state.userAnswer,
        feedback: state.feedback,
        lastResult: state.lastResult,
        promptPoolMax: state.promptPoolMax,
      }),
    },
  ),
)

export function mapScoreToStatus(score: number | undefined) {
  if (score == null) return 'idle' as const
  if (score >= SCORE_THRESHOLDS.success) return 'success' as const
  if (score >= SCORE_THRESHOLDS.warning) return 'warning' as const
  return 'error' as const
}

