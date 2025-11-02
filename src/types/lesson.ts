export type Prompt = {
  id: string
  ja: string
  theme: string
  level: string
  source: 'local' | 'llm'
}

export type Feedback = {
  score: number
  correctExample: string
  difference: string
  grammarPoint: string
  encouragement: string
  raw: string
}

export type HistoryItem = {
  id: string
  prompt: Prompt
  userAnswer: string
  feedback: Feedback | null
  createdAt: string
}
