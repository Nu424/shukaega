import type { Feedback, ParseFeedbackResult } from '../types/feedback'

const sanitizeForDisplay = (text: string) =>
  text
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, (match) => ({ '<': '&lt;', '>': '&gt;' }[match] ?? match))
    .trim()

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split(/[\n,]/)
      .map((part) => part.trim())
      .filter(Boolean)
  }
  return []
}

const clampRating = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.min(100, Math.max(0, Math.round(value)))
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (!Number.isNaN(parsed)) {
      return Math.min(100, Math.max(0, Math.round(parsed)))
    }
  }
  return null
}

const tryParseJSON = (text: string): Record<string, unknown> | null => {
  const jsonCandidate = text.match(/\{[\s\S]*\}/)
  if (!jsonCandidate) return null

  try {
    return JSON.parse(jsonCandidate[0]) as Record<string, unknown>
  } catch (error) {
    console.warn('Failed to parse JSON from LLM response', error)
    return null
  }
}

export const parseFeedbackResponse = (raw: string): ParseFeedbackResult => {
  const sanitizedRaw = sanitizeForDisplay(raw)
  const parsed = tryParseJSON(raw)

  if (!parsed) {
    return {
      feedback: {
        rating: null,
        summary: sanitizedRaw || 'The AI was unable to produce structured feedback. Showing raw response.',
        strengths: [],
        improvements: [],
        nextSteps: [],
        raw: sanitizedRaw,
      },
      isFallback: true,
    }
  }

  const feedback: Feedback = {
    rating: clampRating(parsed.rating),
    summary:
      typeof parsed.summary === 'string' && parsed.summary.trim().length > 0
        ? parsed.summary.trim()
        : sanitizedRaw || 'No summary provided.',
    strengths: normalizeStringArray(parsed.strengths),
    improvements: normalizeStringArray(parsed.improvements),
    nextSteps: normalizeStringArray(parsed.nextSteps),
    raw: sanitizedRaw,
  }

  const missingCoreData =
    !feedback.summary && feedback.strengths.length === 0 && feedback.improvements.length === 0

  if (missingCoreData) {
    return {
      feedback: {
        rating: null,
        summary: sanitizedRaw || 'The AI did not return actionable feedback. Showing raw text instead.',
        strengths: [],
        improvements: [],
        nextSteps: [],
        raw: sanitizedRaw,
      },
      isFallback: true,
    }
  }

  return {
    feedback,
    isFallback: false,
  }
}
