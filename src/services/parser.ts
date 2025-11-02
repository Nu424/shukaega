import { DEFAULT_LEVEL, DEFAULT_GRANULARITY } from '../utils/constants'

export type ParsedPrompt = {
  ja: string
  theme: string
  level: string
}

export type ParsedFeedback = {
  score: number
  correctExample: string
  difference: string
  grammarPoint: string
  encouragement: string
  variations: string[]
  raw: string
}

function tryParseJson(text: string) {
  try {
    return JSON.parse(text)
  } catch (error) {
    return null
  }
}

export function extractFirstJson(text: string): unknown | null {
  const trimmed = text.trim()

  if (!trimmed) {
    return null
  }

  const direct = tryParseJson(trimmed)
  if (direct) {
    return direct
  }

  const startIndex = trimmed.indexOf('{')
  if (startIndex === -1) {
    return null
  }

  let depth = 0
  for (let index = startIndex; index < trimmed.length; index += 1) {
    const char = trimmed[index]
    if (char === '{') {
      depth += 1
    }
    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        const candidate = trimmed.slice(startIndex, index + 1)
        const parsed = tryParseJson(candidate)
        if (parsed) {
          return parsed
        }
      }
    }
  }

  return null
}

function ensureString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value.trim()
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(' ')
  }
  if (value == null) {
    return fallback
  }
  return String(value)
}

function ensureStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => ensureString(entry))
      .filter((entry) => entry.length > 0)
  }
  if (typeof value === 'string') {
    return value
      .split(/\r?\n|;|、/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  }
  return []
}

export function parseGeneratedPrompt(rawText: string): ParsedPrompt {
  const extracted = extractFirstJson(rawText)

  if (extracted && typeof extracted === 'object' && !Array.isArray(extracted)) {
    const record = extracted as Record<string, unknown>
    const ja = ensureString(record.ja, ensureString(record.prompt, ''))
    const theme = ensureString(record.theme || record.topic || 'daily', 'daily')
    const level = ensureString(record.level, DEFAULT_LEVEL)

    if (ja) {
      return {
        ja,
        theme,
        level,
      }
    }
  }

  const fallback = rawText.trim() || '瞬間英作文の練習をしましょう。'

  return {
    ja: fallback,
    theme: 'daily',
    level: DEFAULT_LEVEL,
  }
}

function parsePromptRecord(record: Record<string, unknown>): ParsedPrompt | null {
  const ja = ensureString(record.ja, ensureString(record.prompt, ''))
  const theme = ensureString(record.theme || record.topic || 'daily', 'daily')
  const level = ensureString(record.level, DEFAULT_LEVEL)

  if (!ja) {
    return null
  }

  return {
    ja,
    theme,
    level,
  }
}

export function parseGeneratedPromptsBatch(rawText: string): ParsedPrompt[] {
  const extracted = extractFirstJson(rawText)

  if (extracted && typeof extracted === 'object' && !Array.isArray(extracted)) {
    const record = extracted as Record<string, unknown>
    const maybePrompts = record.prompts
    if (Array.isArray(maybePrompts)) {
      const parsed = maybePrompts
        .map((item) => (item && typeof item === 'object' ? parsePromptRecord(item as Record<string, unknown>) : null))
        .filter((item): item is ParsedPrompt => item != null)
      if (parsed.length > 0) {
        return parsed
      }
    }

    const singleFromRecord = parsePromptRecord(record)
    if (singleFromRecord) {
      return [singleFromRecord]
    }
  }

  return [parseGeneratedPrompt(rawText)]
}

function normalizeScore(score: unknown) {
  const numeric = typeof score === 'number' ? score : Number(score)
  if (Number.isFinite(numeric)) {
    return Math.max(0, Math.min(100, Math.round(numeric)))
  }
  return 0
}

export function parseEvaluation(rawText: string): ParsedFeedback {
  const extracted = extractFirstJson(rawText)

  if (extracted && typeof extracted === 'object' && !Array.isArray(extracted)) {
    const record = extracted as Record<string, unknown>
    const score = normalizeScore(record.score)
    const correctExample = ensureString(record.correct_example ?? record.correctExample)
    const difference = ensureString(record.difference ?? record.diff ?? record.improvement)
    const grammarPoint = ensureString(record.grammar_point ?? record.grammarPoint ?? record.explanation)
    const encouragement = ensureString(record.encouragement ?? record.message ?? 'よく頑張りました！✨')
    const variations = ensureStringArray(record.variations ?? record.examples)

    return {
      score,
      correctExample,
      difference,
      grammarPoint,
      encouragement,
      variations,
      raw: rawText,
    }
  }

  const fallbackEncouragement = rawText.trim().slice(0, 120) || 'よくできました！🎉'

  return {
    score: 0,
    correctExample: '',
    difference: '',
    grammarPoint: '',
    encouragement: fallbackEncouragement,
    variations: [],
    raw: rawText,
  }
}

export function parseGranularity(value: unknown) {
  if (value === 'short' || value === 'normal' || value === 'detail') {
    return value
  }
  return DEFAULT_GRANULARITY
}

