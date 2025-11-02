import type { Feedback, Prompt } from '../types/lesson'
import { getRandomPrompt } from '../utils/localPrompts'

export type PromptRequestOptions = {
  apiKey: string
  model: string
  theme?: string
}

export type EvaluateOptions = {
  apiKey: string
  model: string
  prompt: Prompt
  userAnswer: string
}

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'

const buildPromptRequestBody = (options: PromptRequestOptions) => {
  const { theme } = options
  const userContent = theme
    ? `Generate a short Japanese sentence for instant translation practice.
Theme: ${theme}. Respond in JSON with keys ja, theme, level.`
    : 'Generate a short Japanese sentence for instant translation practice. Respond in JSON with keys ja, theme, level.'

  return {
    model: options.model,
    messages: [
      {
        role: 'system',
        content:
          'You are an assistant that outputs a single short Japanese sentence for instant English composition practice. Respond in JSON.',
      },
      {
        role: 'user',
        content: userContent,
      },
    ],
  }
}

const buildEvaluationRequestBody = (options: EvaluateOptions) => ({
  model: options.model,
  messages: [
    {
      role: 'system',
      content:
        'You are an encouraging English teacher. Evaluate the learner\'s English sentence against the Japanese prompt. Respond in JSON with keys score, correctExample, difference, grammarPoint, encouragement.',
    },
    {
      role: 'user',
      content: `Japanese prompt: ${options.prompt.ja}\nLearner answer: ${options.userAnswer}`,
    },
  ],
})

const parsePromptFromResponse = (response: any): Prompt | null => {
  try {
    const content = response?.choices?.[0]?.message?.content
    if (typeof content !== 'string') return null

    const cleaned = content.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned) as Partial<Prompt>

    if (!parsed.ja) return null

    return {
      id: `llm-${Date.now()}`,
      ja: parsed.ja,
      theme: parsed.theme ?? 'general',
      level: parsed.level ?? 'normal',
      source: 'llm',
    }
  } catch (error) {
    console.warn('[openrouter] Failed to parse prompt response', error)
    return null
  }
}

const parseFeedbackFromResponse = (response: any, raw: string): Feedback | null => {
  try {
    const content = response?.choices?.[0]?.message?.content ?? raw
    const cleaned = typeof content === 'string' ? content.replace(/```json|```/g, '').trim() : ''
    const parsed = cleaned ? JSON.parse(cleaned) as Partial<Feedback> : {}

    return {
      score: typeof parsed.score === 'number' ? parsed.score : 60,
      correctExample: parsed.correctExample ?? 'I went to see a movie with my friend yesterday.',
      difference: parsed.difference ?? 'Focus on verb tense and word order.',
      grammarPoint: parsed.grammarPoint ?? 'Past tense of go -> went.',
      encouragement: parsed.encouragement ?? 'Great effort! Keep practicing 😊',
      raw: typeof content === 'string' ? content : raw,
    }
  } catch (error) {
    console.warn('[openrouter] Failed to parse feedback response', error)
    return null
  }
}

const performRequest = async (
  apiKey: string,
  body: Record<string, unknown>,
): Promise<any> => {
  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter request failed with status ${response.status}`)
  }

  return response.json()
}

export const requestPrompt = async (
  options: PromptRequestOptions,
): Promise<Prompt | null> => {
  try {
    const response = await performRequest(options.apiKey, buildPromptRequestBody(options))
    const prompt = parsePromptFromResponse(response)
    return prompt ?? null
  } catch (error) {
    console.warn('[openrouter] Prompt request failed, falling back to local data', error)
    return null
  }
}

export const evaluateAnswer = async (
  options: EvaluateOptions,
): Promise<Feedback | null> => {
  try {
    const response = await performRequest(
      options.apiKey,
      buildEvaluationRequestBody(options),
    )
    return parseFeedbackFromResponse(response, JSON.stringify(response))
  } catch (error) {
    console.warn('[openrouter] Evaluation request failed, using fallback feedback', error)
    return null
  }
}

export const fallbackFeedback = (prompt: Prompt, answer: string): Feedback => {
  const similarity = Math.min(answer.length / Math.max(prompt.ja.length, 1), 1)
  const score = Math.round(50 + similarity * 40)

  return {
    score,
    correctExample: 'Consider a natural English translation based on the key verbs.',
    difference: 'Focus on conveying tense and polite expressions clearly.',
    grammarPoint: 'Look at verb conjugation and article usage.',
    encouragement: score > 70 ? 'Nice! Just a little polish needed ✨' : 'Keep going! You\'re getting closer 💪',
    raw: 'Fallback feedback generated locally',
  }
}

export const fallbackPrompt = (theme?: string): Prompt => getRandomPrompt(theme)
