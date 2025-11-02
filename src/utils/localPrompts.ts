import type { EnglishLevel } from '../services/promptBuilder'

export interface PresetPrompt {
  id: string
  title: string
  level: EnglishLevel | 'any'
  themes: string[]
  prompt: string
}

export interface ReviewItem {
  id: string
  prompt: string
  level: EnglishLevel
  theme?: string
  createdAt: number
}

export type PromptSource = 'remote' | 'review' | 'preset'

export interface GeneratePromptOptions {
  level: EnglishLevel
  theme?: string
  remoteGenerator?: () => Promise<string>
  preferReview?: boolean
}

export interface GeneratePromptResult {
  prompt: string
  source: PromptSource
  preset?: PresetPrompt
  reviewItem?: ReviewItem
}

const STORAGE_KEY = 'esl-coach:review-queue'

const isBrowser = typeof window !== 'undefined'

const defaultPrompts: PresetPrompt[] = [
  {
    id: 'travel-journal',
    title: 'Unexpected Travel Adventure',
    level: 'intermediate',
    themes: ['travel', 'experience'],
    prompt:
      'Describe a memorable travel experience that took an unexpected turn. What happened, how did you react, and what did you learn from the situation? Include feelings and dialogue.',
  },
  {
    id: 'future-career',
    title: 'Future Career Vision',
    level: 'advanced',
    themes: ['career', 'future'],
    prompt:
      'Imagine it is five years from now and you have achieved your dream job. Explain what your daily work looks like, the challenges you face, and how you continue to grow.',
  },
  {
    id: 'daily-routine',
    title: 'Morning Routine Story',
    level: 'beginner',
    themes: ['daily life'],
    prompt:
      'Talk about your usual morning routine from the moment you wake up until you leave your home. Use simple sentences and mention at least three activities.',
  },
  {
    id: 'community-problem',
    title: 'Community Problem Solver',
    level: 'intermediate',
    themes: ['community', 'problem solving'],
    prompt:
      'Describe a challenge that your community faces. Explain why it is important and share a creative solution you would propose, including who would help you.',
  },
  {
    id: 'cultural-celebration',
    title: 'Cultural Celebration',
    level: 'any',
    themes: ['culture', 'tradition'],
    prompt:
      'Share a cultural celebration or tradition that is meaningful to you. Explain the customs, the people involved, and why it matters to your identity.',
  },
]

const loadReviewQueue = (): ReviewItem[] => {
  if (!isBrowser) return []
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as ReviewItem[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => ({
        ...item,
        createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
      }))
      .filter((item) => typeof item.prompt === 'string' && item.prompt.trim().length > 0)
  } catch (error) {
    console.warn('Failed to parse review queue', error)
    return []
  }
}

const saveReviewQueue = (queue: ReviewItem[]) => {
  if (!isBrowser) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

export const getReviewQueue = (): ReviewItem[] => loadReviewQueue()

export const enqueueReviewPrompt = (item: ReviewItem) => {
  const queue = loadReviewQueue()
  const withoutDuplicates = queue.filter((existing) => existing.id !== item.id)
  withoutDuplicates.push(item)
  saveReviewQueue(withoutDuplicates.slice(-20))
}

const shiftReviewPrompt = (): ReviewItem | undefined => {
  const queue = loadReviewQueue()
  const next = queue.shift()
  saveReviewQueue(queue)
  return next
}

const matchPresetPrompts = (level: EnglishLevel, theme?: string): PresetPrompt[] => {
  const normalizedTheme = theme?.toLowerCase()
  return defaultPrompts.filter((preset) => {
    const levelMatches = preset.level === 'any' || preset.level === level
    if (!normalizedTheme) return levelMatches
    return levelMatches && preset.themes.some((candidate) => candidate.toLowerCase().includes(normalizedTheme))
  })
}

const pickRandom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)]

export const generatePrompt = async ({
  level,
  theme,
  remoteGenerator,
  preferReview = true,
}: GeneratePromptOptions): Promise<GeneratePromptResult> => {
  if (preferReview) {
    const reviewItem = shiftReviewPrompt()
    if (reviewItem) {
      return { prompt: reviewItem.prompt, source: 'review', reviewItem }
    }
  }

  if (remoteGenerator) {
    try {
      const prompt = await remoteGenerator()
      if (prompt && prompt.trim().length > 0) {
        return { prompt: prompt.trim(), source: 'remote' }
      }
    } catch (error) {
      console.warn('Remote prompt generation failed, falling back to presets.', error)
    }
  }

  const matches = matchPresetPrompts(level, theme)
  const preset = matches.length > 0 ? pickRandom(matches) : pickRandom(defaultPrompts)

  return { prompt: preset.prompt, source: 'preset', preset }
}
