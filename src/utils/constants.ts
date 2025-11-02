export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export const DEFAULT_MODEL = 'openrouter/auto'
export const DEFAULT_LEVEL = 'normal'
export const DEFAULT_GRANULARITY = 'normal'

export const MODEL_PRESETS = [
  'openai/gpt-5-mini',
  'google/gemini-2.5-flash',
  'anthropic/claude-haiku-4.5',
  'x-ai/grok-4-fast',
] as const

export const SCORE_THRESHOLDS = {
  success: 85,
  warning: 60,
} as const

export const THEMES = ['daily', 'travel', 'business', 'grammar', 'casual'] as const
export const LEVELS = ['easy', 'normal', 'hard'] as const

export type Theme = (typeof THEMES)[number]
export type DifficultyLevel = (typeof LEVELS)[number]
export type Granularity = 'short' | 'normal' | 'detail'

export const MAX_HISTORY_ITEMS = 100
export const PROMPT_POOL_MAX = 10

