export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
}

export interface ChatCompletionResponse {
  id: string
  choices: Array<{
    index: number
    message: ChatMessage & { refusal?: string }
    finish_reason: string
  }>
}

export type OpenRouterNotificationType = 'retry' | 'error' | 'info'

export interface OpenRouterNotification {
  type: OpenRouterNotificationType
  message: string
  attempt?: number
}

type Listener = (notification: OpenRouterNotification) => void

const listeners = new Set<Listener>()

export const subscribeToOpenRouterNotifications = (listener: Listener) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const notify = (event: OpenRouterNotification) => {
  listeners.forEach((listener) => listener(event))
}

const shouldRetry = (status: number) => status === 429 || status >= 500

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export class OpenRouterError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'OpenRouterError'
    this.status = status
  }
}

export interface ChatCompletionOptions extends ChatCompletionRequest {
  apiKey: string
  signal?: AbortSignal
  retries?: number
  retryDelayMs?: number
}

export const chatCompletion = async ({
  apiKey,
  model,
  messages,
  maxTokens,
  temperature,
  signal,
  retries = 2,
  retryDelayMs = 800,
}: ChatCompletionOptions): Promise<ChatCompletionResponse> => {
  let attempt = 0
  let lastError: unknown = null

  while (attempt <= retries) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
      })

      if (!response.ok) {
        if (shouldRetry(response.status) && attempt < retries) {
          attempt += 1
          notify({
            type: 'retry',
            message: `OpenRouter request throttled (status ${response.status}). Retrying...`,
            attempt,
          })
          await delay(retryDelayMs * attempt)
          continue
        }

        const errorText = await response.text()
        throw new OpenRouterError(
          `OpenRouter request failed with status ${response.status}: ${errorText}`,
          response.status,
        )
      }

      const data = (await response.json()) as ChatCompletionResponse
      if (!data.choices?.length) {
        throw new OpenRouterError('OpenRouter response did not include any choices.')
      }

      return data
    } catch (error) {
      lastError = error
      if (error instanceof OpenRouterError) {
        notify({ type: 'error', message: error.message })
        break
      }

      if (attempt < retries) {
        attempt += 1
        notify({
          type: 'retry',
          message: 'OpenRouter request failed. Attempting again...',
          attempt,
        })
        await delay(retryDelayMs * attempt)
      } else {
        notify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown OpenRouter error occurred.',
        })
        break
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('OpenRouter request failed.')
}
