import { OPENROUTER_API_URL } from '../utils/constants'
import { buildPromptGenerationMessages, buildEvaluationMessages, type ChatMessage } from './promptBuilder'

export class MissingApiKeyError extends Error {
  constructor() {
    super('OpenRouter API key is not set')
    this.name = 'MissingApiKeyError'
  }
}

export class OpenRouterError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'OpenRouterError'
    this.status = status
    this.body = body
  }
}

type FetchChatCompletionParams = {
  apiKey: string | null
  model: string
  messages: ChatMessage[]
  options?: {
    temperature?: number
    maxTokens?: number
    responseFormat?: unknown
  }
}

type OpenRouterChoice = {
  message?: {
    content?: string | null
  }
}

type OpenRouterResponse = {
  choices?: OpenRouterChoice[]
}

const PROMPT_BATCH_RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'prompt_batch',
    schema: {
      type: 'object',
      required: ['prompts'],
      properties: {
        prompts: {
          type: 'array',
          minItems: 1,
          maxItems: 20,
          items: {
            type: 'object',
            required: ['ja', 'theme', 'level'],
            properties: {
              ja: { type: 'string' },
              theme: { type: 'string' },
              level: { type: 'string' },
            },
          },
        },
      },
    },
  },
} as const

const EVALUATION_RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'evaluation',
    schema: {
      type: 'object',
      required: ['score', 'correct_example', 'difference', 'grammar_point', 'encouragement', 'variations'],
      properties: {
        score: { type: 'integer', minimum: 0, maximum: 100 },
        correct_example: { type: 'string' },
        difference: { type: 'string' },
        grammar_point: { type: 'string' },
        encouragement: { type: 'string' },
        variations: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  },
} as const

async function safeParseJson(response: Response) {
  try {
    return await response.json()
  } catch (error) {
    return null
  }
}

function isResponseFormatUnsupported(error: unknown) {
  return error instanceof OpenRouterError && [400, 415, 422].includes(error.status)
}

async function fetchWithJsonSchema(
  params: FetchChatCompletionParams,
  schema: typeof PROMPT_BATCH_RESPONSE_FORMAT | typeof EVALUATION_RESPONSE_FORMAT,
) {
  try {
    return await fetchChatCompletion({
      ...params,
      options: {
        ...params.options,
        responseFormat: schema,
      },
    })
  } catch (error) {
    if (isResponseFormatUnsupported(error)) {
      const { options, ...rest } = params
      const nextOptions = options ? { ...options } : undefined
      if (nextOptions) {
        delete (nextOptions as Record<string, unknown>).responseFormat
      }
      return fetchChatCompletion({
        ...rest,
        options: nextOptions,
      })
    }
    throw error
  }
}

export async function fetchChatCompletion({ apiKey, model, messages, options }: FetchChatCompletionParams): Promise<string> {
  if (!apiKey) {
    throw new MissingApiKeyError()
  }

  const payload: Record<string, unknown> = {
    model,
    messages,
  }

  if (options?.temperature !== undefined) {
    payload.temperature = options.temperature
  }

  if (options?.maxTokens !== undefined) {
    payload.max_tokens = options.maxTokens
  }

  if (options?.responseFormat) {
    payload.response_format = options.responseFormat
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorBody = await safeParseJson(response)
    const message = response.status === 401
      ? 'OpenRouter APIキーが正しいか確認してください。'
      : response.status === 429
        ? 'リクエストが多すぎます。少し時間をおいて再試行してください。'
        : 'OpenRouter APIでエラーが発生しました。'
    throw new OpenRouterError(message, response.status, errorBody)
  }

  const data = (await safeParseJson(response)) as OpenRouterResponse | null

  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    throw new OpenRouterError('OpenRouterからのレスポンスにコンテンツが含まれていません。', response.status, data)
  }

  return content
}

type GeneratePromptParams = {
  apiKey: string | null
  model: string
  theme?: string
  level?: string
}

export async function generatePrompt({ apiKey, model, theme, level }: GeneratePromptParams) {
  const messages = buildPromptGenerationMessages({ theme, level })
  return fetchWithJsonSchema({ apiKey, model, messages }, PROMPT_BATCH_RESPONSE_FORMAT)
}

type EvaluateAnswerParams = {
  apiKey: string | null
  model: string
  ja: string
  userAnswer: string
  level?: string
  granularity?: Parameters<typeof buildEvaluationMessages>[0]['granularity']
}

export async function evaluateAnswer({ apiKey, model, ja, userAnswer, level, granularity }: EvaluateAnswerParams) {
  const messages = buildEvaluationMessages({ ja, userAnswer, level, granularity })
  return fetchWithJsonSchema({ apiKey, model, messages }, EVALUATION_RESPONSE_FORMAT)
}

type GeneratePromptsBatchParams = {
  apiKey: string | null
  model: string
  theme?: string
  level?: string
  count: number
}

export async function generatePromptsBatch({ apiKey, model, theme, level, count }: GeneratePromptsBatchParams) {
  const messages = buildPromptGenerationMessages({ theme, level, count })
  return fetchWithJsonSchema({ apiKey, model, messages }, PROMPT_BATCH_RESPONSE_FORMAT)
}

