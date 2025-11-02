import { useEffect, useMemo, useState } from 'react'
import { chatCompletion, subscribeToOpenRouterNotifications } from './services/openrouter'
import { buildEvaluationMessages, buildPromptGenerationMessages } from './services/promptBuilder'
import type { EnglishLevel, FeedbackGranularity } from './services/promptBuilder'
import { parseFeedbackResponse } from './services/parser'
import type { Feedback } from './types/feedback'
import {
  enqueueReviewPrompt,
  generatePrompt,
  getReviewQueue,
  type GeneratePromptResult,
} from './utils/localPrompts'

const DEFAULT_MODEL = 'openrouter/anthropic/claude-3.5-haiku'
const STORAGE_KEY = 'openrouter:api-key'

const levels: EnglishLevel[] = ['beginner', 'intermediate', 'advanced']
const granularities: FeedbackGranularity[] = ['light', 'standard', 'detailed']

const useStoredApiKey = () => {
  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem(STORAGE_KEY) ?? ''
  })

  const save = (value: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, value)
    }
    setApiKey(value)
  }

  return [apiKey, save] as const
}

interface ToastProps {
  message: string
  onClose: () => void
}

const Toast = ({ message, onClose }: ToastProps) => {
  useEffect(() => {
    const timeout = window.setTimeout(onClose, 4000)
    return () => window.clearTimeout(timeout)
  }, [onClose])

  return (
    <div className="toast" role="status">
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss notification">
        ×
      </button>
    </div>
  )
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (key: string) => void
}

const ApiKeyModal = ({ isOpen, onClose, onSave }: ModalProps) => {
  const [draftKey, setDraftKey] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setDraftKey('')
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <h2>Enter your OpenRouter API key</h2>
        <p>
          Your key is stored locally in this browser. Avoid saving it on shared or public computers. You can
          create or manage keys at{' '}
          <a href="https://openrouter.ai" target="_blank" rel="noreferrer">
            openrouter.ai
          </a>
          .
        </p>
        <label className="field">
          <span>API key</span>
          <input
            type="password"
            value={draftKey}
            onChange={(event) => setDraftKey(event.target.value)}
            placeholder="sk-or-v1-..."
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => {
              if (draftKey.trim().length > 0) {
                onSave(draftKey.trim())
                onClose()
              }
            }}
          >
            Save key
          </button>
        </div>
        <p className="notice">
          Tip: For shared devices, paste your key only for the current session and clear it when finished using the
          “Reset API key” button.
        </p>
      </div>
    </div>
  )
}

const emptyFeedback: Feedback = {
  rating: null,
  summary: '',
  strengths: [],
  improvements: [],
  nextSteps: [],
  raw: '',
}

function App() {
  const [apiKey, setStoredApiKey] = useStoredApiKey()
  const [model, setModel] = useState(DEFAULT_MODEL)
  const [level, setLevel] = useState<EnglishLevel>('intermediate')
  const [theme, setTheme] = useState('')
  const [granularity, setGranularity] = useState<FeedbackGranularity>('standard')
  const [promptResult, setPromptResult] = useState<GeneratePromptResult | null>(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<Feedback>(emptyFeedback)
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false)
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [notification, setNotification] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fallbackMessage, setFallbackMessage] = useState<string>('')
  const [reviewCount, setReviewCount] = useState<number>(getReviewQueue().length)

  useEffect(() => {
    if (!apiKey) {
      setIsModalOpen(true)
    }
  }, [apiKey])

  useEffect(() => {
    const unsubscribe = subscribeToOpenRouterNotifications((event) => {
      setNotification(event.message)
      if (event.type === 'error') {
        setToastMessage(event.message)
      }
    })
    return unsubscribe
  }, [])

  const hasPrompt = Boolean(promptResult?.prompt)

  const handleSaveKey = (key: string) => {
    setStoredApiKey(key)
    setToastMessage('OpenRouter API key saved locally. Avoid leaving it on shared computers.')
  }

  const handleResetKey = () => {
    setStoredApiKey('')
    setToastMessage('OpenRouter API key removed from this browser.')
    setIsModalOpen(true)
  }

  const generatePromptHandler = async () => {
    setIsLoadingPrompt(true)
    setFallbackMessage('')
    setPromptResult(null)
    setNotification('')

    const result = await generatePrompt({
      level,
      theme,
      remoteGenerator: apiKey
        ? async () => {
            const response = await chatCompletion({
              apiKey,
              model,
              messages: buildPromptGenerationMessages({ level, theme }),
            })
            const content = response.choices[0]?.message?.content ?? ''
            if (!content.trim()) {
              throw new Error('Empty prompt received from OpenRouter.')
            }
            return content
          }
        : undefined,
    })

    if (result.source !== 'remote') {
      setFallbackMessage('Using a local prompt because the API response was unavailable.')
      if (!apiKey) {
        setNotification('Add an API key to unlock AI-generated prompts.')
      }
    }

    setPromptResult(result)
    setIsLoadingPrompt(false)
    setAnswer('')
    setFeedback(emptyFeedback)
  }

  const evaluateAnswerHandler = async () => {
    if (!hasPrompt) return
    if (!apiKey) {
      setIsModalOpen(true)
      return
    }

    setIsLoadingFeedback(true)
    setFallbackMessage('')

    try {
      const response = await chatCompletion({
        apiKey,
        model,
        messages: buildEvaluationMessages({
          level,
          theme,
          prompt: promptResult?.prompt ?? '',
          answer,
          granularity,
        }),
      })
      const content = response.choices[0]?.message?.content ?? ''
      const parsed = parseFeedbackResponse(content)
      setFeedback(parsed.feedback)
      if (parsed.isFallback) {
        setFallbackMessage('Showing raw AI response because structured feedback could not be parsed safely.')
      }
    } catch (error) {
      console.error(error)
      setToastMessage('Failed to retrieve feedback. Showing last known prompt.')
      setFallbackMessage('Feedback could not be generated at this time.')
    } finally {
      setIsLoadingFeedback(false)
    }
  }

  const reviewLabel = useMemo(() => {
    if (promptResult?.source === 'review') {
      return 'From your review list'
    }
    if (promptResult?.source === 'preset') {
      return 'From local prompt presets'
    }
    if (promptResult?.source === 'remote') {
      return 'Generated by OpenRouter'
    }
    return ''
  }, [promptResult])

  const addPromptToReview = () => {
    if (!promptResult?.prompt) return
    enqueueReviewPrompt({
      id: `review-${Date.now()}`,
      prompt: promptResult.prompt,
      level,
      theme,
      createdAt: Date.now(),
    })
    setReviewCount(getReviewQueue().length)
    setToastMessage('Saved to your review queue. It will appear before new prompts next time.')
  }

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>Speaking Prompt Coach</h1>
          <p className="subtitle">Generate speaking prompts and receive AI-powered feedback with fallback safety.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="secondary" onClick={() => setIsModalOpen(true)}>
            {apiKey ? 'Update API key' : 'Add API key'}
          </button>
          {apiKey && (
            <button type="button" className="link" onClick={handleResetKey}>
              Reset API key
            </button>
          )}
        </div>
      </header>

      <section className="controls">
        <div className="field">
          <label htmlFor="level">Learner level</label>
          <select id="level" value={level} onChange={(event) => setLevel(event.target.value as EnglishLevel)}>
            {levels.map((item) => (
              <option key={item} value={item}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="theme">Theme (optional)</label>
          <input
            id="theme"
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
            placeholder="travel, business, hobbies..."
          />
        </div>

        <div className="field">
          <label htmlFor="granularity">Feedback detail</label>
          <select
            id="granularity"
            value={granularity}
            onChange={(event) => setGranularity(event.target.value as FeedbackGranularity)}
          >
            {granularities.map((item) => (
              <option key={item} value={item}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="model">Model</label>
          <input
            id="model"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="openrouter/anthropic/claude-3.5-haiku"
          />
        </div>

        <button type="button" className="primary" onClick={generatePromptHandler} disabled={isLoadingPrompt}>
          {isLoadingPrompt ? 'Generating…' : 'Generate prompt'}
        </button>
      </section>

      {notification && <p className="notification">{notification}</p>}
      {fallbackMessage && <p className="fallback">{fallbackMessage}</p>}

      {promptResult && (
        <section className="prompt">
          <header>
            <h2>Speaking prompt</h2>
            {reviewLabel && <span className="badge">{reviewLabel}</span>}
          </header>
          <p>{promptResult.prompt}</p>
          <div className="prompt-actions">
            <button type="button" className="secondary" onClick={addPromptToReview}>
              Save for review
            </button>
            {reviewCount > 0 && <span className="meta">Review queue: {reviewCount}</span>}
          </div>
        </section>
      )}

      <section className="answer">
        <h2>Your answer</h2>
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Record what you would say in response to the prompt."
          rows={8}
        />
        <button
          type="button"
          className="primary"
          onClick={evaluateAnswerHandler}
          disabled={!hasPrompt || !answer.trim() || isLoadingFeedback}
        >
          {isLoadingFeedback ? 'Evaluating…' : 'Get feedback'}
        </button>
      </section>

      {feedback.summary && (
        <section className="feedback">
          <header>
            <h2>Feedback</h2>
            {feedback.rating !== null && <span className="badge">Score: {feedback.rating}/100</span>}
          </header>
          <p>{feedback.summary}</p>

          {feedback.strengths.length > 0 && (
            <div>
              <h3>Strengths</h3>
              <ul>
                {feedback.strengths.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback.improvements.length > 0 && (
            <div>
              <h3>Areas to improve</h3>
              <ul>
                {feedback.improvements.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback.nextSteps.length > 0 && (
            <div>
              <h3>Next steps</h3>
              <ul>
                {feedback.nextSteps.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      <ApiKeyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveKey} />
    </div>
  )
}

export default App
