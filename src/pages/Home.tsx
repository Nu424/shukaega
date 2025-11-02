import { useEffect, useMemo, useState } from 'react'

import AnswerInput from '../components/AnswerInput'
import FeedbackPanel from '../components/FeedbackPanel'
import PromptCard from '../components/PromptCard'
import { mapScoreToStatus, useLessonStore } from '../stores/useLessonStore'
import { useHistoryStore } from '../stores/useHistoryStore'
import { THEMES } from '../utils/constants'

export default function Home() {
  const {
    currentPrompt,
    userAnswer,
    setUserAnswer,
    feedback,
    isGeneratingPrompt,
    isEvaluating,
    isRefilling,
    error,
    promptQueue,
    promptPoolMax,
    selectedTheme,
    setSelectedTheme,
    initializeQueue,
    evaluateAnswer,
    next,
    retrySimilar,
  } = useLessonStore()
  const addHistoryItem = useHistoryStore((state) => state.add)
  const markHistoryForReview = useHistoryStore((state) => state.addToReview)
  const historyItems = useHistoryStore((state) => state.items)
  const [isInitialised, setIsInitialised] = useState(false)
  const [customTheme, setCustomTheme] = useState('')
  const [reviewNotice, setReviewNotice] = useState('')

  useEffect(() => {
    if (!currentPrompt && !isGeneratingPrompt && !isInitialised) {
      initializeQueue(selectedTheme ?? null).finally(() => setIsInitialised(true))
    }
  }, [currentPrompt, initializeQueue, isGeneratingPrompt, isInitialised, selectedTheme])

  const handleSubmit = async () => {
    await evaluateAnswer()
  }

  const handleNextPrompt = async () => {
    if (isGeneratingPrompt) return

    const trimmedAnswer = userAnswer.trim()
    if (currentPrompt && trimmedAnswer) {
      addHistoryItem({
        prompt: currentPrompt,
        userAnswer: trimmedAnswer,
        feedback,
      })
    }

    await next(selectedTheme ?? null)
  }

  const handleRetrySimilar = async () => {
    await retrySimilar()
  }

  const handleThemeChange = async (theme: string | null) => {
    if (isGeneratingPrompt) return
    setSelectedTheme(theme)
    setIsInitialised(false)
    try {
      await initializeQueue(theme)
    } finally {
      setIsInitialised(true)
    }
  }

  const handleApplyCustomTheme = async () => {
    const trimmed = customTheme.trim()
    if (!trimmed) {
      await handleThemeChange(null)
      return
    }
    await handleThemeChange(trimmed)
  }

  const handleAddToReview = () => {
    if (!currentPrompt) return
    const trimmedAnswer = userAnswer.trim()

    const existingItem = historyItems.find((item) => item.prompt.id === currentPrompt.id)
    if (existingItem) {
      markHistoryForReview(existingItem.id)
    } else {
      addHistoryItem({
        prompt: currentPrompt,
        userAnswer: trimmedAnswer,
        feedback,
        isManualReview: true,
      })
    }

    setReviewNotice('復習リストに追加しました。')
    window.setTimeout(() => setReviewNotice(''), 2000)
  }

  const status = mapScoreToStatus(feedback?.score)
  const queueRemaining = promptQueue.length
  const activeThemeLabel = useMemo(() => {
    if (!selectedTheme) return 'ランダム'
    return selectedTheme
  }, [selectedTheme])

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl bg-white p-6 shadow-md">
        <header className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-slate-700">テーマを選択</h2>
          <p className="text-sm text-slate-500">選択したテーマに合わせてお題をまとめて生成します。何も選ばない場合はランダムに出題されます。</p>
        </header>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleThemeChange(null)}
            disabled={isGeneratingPrompt}
            className={`rounded-full px-4 py-2 text-sm transition ${selectedTheme == null ? 'bg-indigo-600 text-white shadow' : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:text-indigo-600'}`}
          >
            ランダム
          </button>
          {THEMES.map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => handleThemeChange(theme)}
              disabled={isGeneratingPrompt && selectedTheme !== theme}
              className={`rounded-full px-4 py-2 text-sm transition ${selectedTheme === theme ? 'bg-indigo-600 text-white shadow' : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:text-indigo-600'}`}
            >
              {theme}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={customTheme}
            onChange={(event) => setCustomTheme(event.target.value)}
            placeholder="カスタムテーマを入力 (例: 留学生活)"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleApplyCustomTheme}
              disabled={isGeneratingPrompt}
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              適用
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomTheme('')
                void handleThemeChange(null)
              }}
              disabled={isGeneratingPrompt}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed"
            >
              クリア
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            現在のテーマ: <span className="font-semibold text-slate-700">{activeThemeLabel}</span>
          </span>
          <span>
            キュー: {currentPrompt ? queueRemaining + 1 : queueRemaining}/{promptPoolMax}
            {isRefilling && <span className="ml-2 text-indigo-500">補充中...</span>}
          </span>
        </div>
      </section>

      <PromptCard
        japanese={currentPrompt?.ja ?? 'お題を準備しています...'}
        theme={currentPrompt?.theme ?? activeThemeLabel}
        level={currentPrompt?.level ?? '...'}
        source={currentPrompt?.source ?? 'llm'}
        onRetrySimilar={isGeneratingPrompt ? undefined : handleRetrySimilar}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleAddToReview}
          disabled={!currentPrompt || isGeneratingPrompt}
          className="rounded-full border border-indigo-100 px-5 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
        >
          復習リストに追加する
        </button>
        {reviewNotice && <span className="text-xs text-emerald-600">{reviewNotice}</span>}
      </div>
      <AnswerInput
        value={userAnswer}
        onChange={setUserAnswer}
        onSubmit={handleSubmit}
        onNext={handleNextPrompt}
        isSubmitting={isEvaluating || isGeneratingPrompt}
      />
      {isGeneratingPrompt && (
        <p className="rounded-2xl border border-dashed border-indigo-200 bg-white/40 px-4 py-3 text-sm text-indigo-500">
          お題を生成しています…数秒お待ちください。
        </p>
      )}
      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <FeedbackPanel
        status={status}
        correctExample={feedback?.correctExample}
        difference={feedback?.difference}
        grammarPoint={feedback?.grammarPoint}
        encouragement={feedback?.encouragement}
        variations={feedback?.variations}
      />
    </div>
  )
}
