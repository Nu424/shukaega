export interface Feedback {
  rating: number | null
  summary: string
  strengths: string[]
  improvements: string[]
  nextSteps: string[]
  raw: string
}

export interface ParseFeedbackResult {
  feedback: Feedback
  isFallback: boolean
}
