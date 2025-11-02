import type { FormEvent } from 'react'

import { useLessonStore } from '../stores/useLessonStore'

const scoreToColor = (score: number) => {
  if (score >= 80) return 'bg-green-100 text-green-800'
  if (score >= 60) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

const HomePage = () => {
  const {
    currentPrompt,
    userAnswer,
    feedback,
    isGeneratingPrompt,
    isEvaluating,
    error,
    setUserAnswer,
    evaluateAnswer,
    next,
  } = useLessonStore((state) => ({
    currentPrompt: state.currentPrompt,
    userAnswer: state.userAnswer,
    feedback: state.feedback,
    isGeneratingPrompt: state.isGeneratingPrompt,
    isEvaluating: state.isEvaluating,
    error: state.error,
    setUserAnswer: state.setUserAnswer,
    evaluateAnswer: state.evaluateAnswer,
    next: state.next,
  }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    await evaluateAnswer()
  }

  const handleNext = async () => {
    await next()
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-900">現在のお題</h2>
        {isGeneratingPrompt && (
          <p className="mt-2 text-sm text-slate-500">お題を準備中です...</p>
        )}
        {!currentPrompt && !isGeneratingPrompt && (
          <p className="mt-2 text-sm text-slate-500">
            お題を読み込んでいます。少しだけお待ちください。
          </p>
        )}
        {currentPrompt && (
          <div className="mt-3 space-y-2">
            <p className="text-xl font-medium text-slate-800">{currentPrompt.ja}</p>
            <div className="flex gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-slate-100 px-2 py-1">
                テーマ: {currentPrompt.theme}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1">
                レベル: {currentPrompt.level}
              </span>
            </div>
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="block text-sm font-medium text-slate-700">
            あなたの英作文
          </span>
          <textarea
            className="mt-1 min-h-[140px] w-full rounded-xl border border-slate-200 p-3 focus:border-indigo-400 focus:outline-none focus:ring"
            placeholder="I went to see a movie with my friend yesterday."
            value={userAnswer}
            onChange={(event) => setUserAnswer(event.target.value)}
            disabled={isGeneratingPrompt}
          />
        </label>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isEvaluating || isGeneratingPrompt}
          >
            {isEvaluating ? '採点中...' : '採点する'}
          </button>
          <button
            type="button"
            className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleNext}
            disabled={isGeneratingPrompt}
          >
            次のお題へ
          </button>
        </div>
      </form>

      {feedback && (
        <section className={`rounded-2xl p-6 shadow ${scoreToColor(feedback.score)}`}>
          <h3 className="text-lg font-semibold">フィードバック</h3>
          <p className="mt-2 text-sm">スコア: {feedback.score}</p>
          <div className="mt-3 space-y-2 text-sm">
            <p>
              <span className="font-semibold">正解例:</span> {feedback.correctExample}
            </p>
            <p>
              <span className="font-semibold">差分:</span> {feedback.difference}
            </p>
            <p>
              <span className="font-semibold">文法ポイント:</span> {feedback.grammarPoint}
            </p>
            <p>
              <span className="font-semibold">メッセージ:</span> {feedback.encouragement}
            </p>
          </div>
        </section>
      )}
    </div>
  )
}

export default HomePage
