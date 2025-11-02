import type { ChatMessage } from './openrouter'

export type EnglishLevel = 'beginner' | 'intermediate' | 'advanced'
export type FeedbackGranularity = 'light' | 'standard' | 'detailed'

const levelDescriptions: Record<EnglishLevel, string> = {
  beginner: 'Beginner English learner with limited vocabulary and short sentence structures.',
  intermediate: 'Intermediate English learner comfortable with everyday conversations but still refining grammar and nuance.',
  advanced: 'Advanced English learner preparing for academic or professional communication and nuanced expression.',
}

const granularityDescriptions: Record<FeedbackGranularity, string> = {
  light: 'Provide a brief summary of key strengths and a single recommendation for improvement.',
  standard: 'Provide a balanced set of strengths and areas to improve with actionable guidance.',
  detailed: 'Provide a thorough assessment with prioritized feedback, concrete examples, and step-by-step next actions.',
}

interface BasePromptOptions {
  level: EnglishLevel
  theme?: string
}

export interface PromptGenerationOptions extends BasePromptOptions {
  desiredLength?: number
}

export const buildPromptGenerationMessages = ({
  level,
  theme,
  desiredLength,
}: PromptGenerationOptions): ChatMessage[] => {
  const system: ChatMessage = {
    role: 'system',
    content: `You are an experienced ESL instructor creating engaging speaking prompts. Tailor prompts to the learner level: ${levelDescriptions[level]}`,
  }

  const userLines = [
    'Create a single speaking prompt for the learner.',
    'Encourage original thinking and personal connection.',
    'Avoid providing any sample answer.',
  ]

  if (theme) {
    userLines.push(`Incorporate the theme: "${theme}".`)
  }

  if (desiredLength) {
    userLines.push(`Target ${desiredLength} sentences worth of speaking time.`)
  }

  return [system, { role: 'user', content: userLines.join('\n') }]
}

export interface EvaluationMessageOptions extends BasePromptOptions {
  prompt: string
  answer: string
  granularity: FeedbackGranularity
}

export const buildEvaluationMessages = ({
  level,
  theme,
  prompt,
  answer,
  granularity,
}: EvaluationMessageOptions): ChatMessage[] => {
  const system: ChatMessage = {
    role: 'system',
    content: [
      'You are a supportive ESL speaking coach.',
      `Assess responses for the level: ${levelDescriptions[level]}`,
      granularityDescriptions[granularity],
      'Respond in JSON with keys: rating (0-100), summary, strengths (array), improvements (array), nextSteps (array).',
    ].join(' '),
  }

  const themeLine = theme ? `Theme context: ${theme}.` : ''

  const user: ChatMessage = {
    role: 'user',
    content: [
      themeLine,
      `Prompt: ${prompt}`,
      `Learner answer: ${answer}`,
      'Remember to focus on constructive encouragement.',
    ]
      .filter(Boolean)
      .join('\n'),
  }

  return [system, user]
}
