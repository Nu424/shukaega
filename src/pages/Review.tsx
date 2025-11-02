import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { useHistoryStore } from '../stores/useHistoryStore'
import { useLessonStore } from '../stores/useLessonStore'

export default function Review() {
  const navigate = useNavigate()
  const items = useHistoryStore((state) => state.items)
  const getWrongOnes = useHistoryStore((state) => state.getWrongOnes)
  const removeFromReview = useHistoryStore((state) => state.removeFromReview)
  const loadPrompt = useLessonStore((state) => state.loadPrompt)

  const wrongItems = useMemo(() => getWrongOnes(), [getWrongOnes, items])

  const handleRetry = (id: string) => {
    const target = wrongItems.find((item) => item.id === id)
    if (!target) return
    loadPrompt({
      ...target.prompt,
      id: target.prompt.id,
    })
    navigate('/')
  }

  const handleRemoveFromReview = (id: string) => {
    removeFromReview(id)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-md">
        <h1 className="text-2xl font-semibold text-slate-800">復習モード</h1>
        <p className="mt-2 text-sm text-slate-500">
          最近の回答履歴のうち、スコアが低かったものと手動で追加したお題をピックアップしました。苦手な文を集中的に練習しましょう。
        </p>
      </div>

      {wrongItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-8 text-center text-sm text-slate-500">
          まだ復習リストは空です。日々のトレーニングを続けて、苦手な項目を見つけましょう！
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {wrongItems.map((item) => (
            <article key={item.id} className="rounded-3xl bg-white p-5 shadow-md transition hover:shadow-lg">
              <header className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wide text-slate-400">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-600">{item.prompt.theme}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">{item.prompt.level}</span>
                  {item.isManualReview && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-600">手動追加</span>
                  )}
                </div>
                <time className="text-slate-400">{new Date(item.createdAt).toLocaleString()}</time>
              </header>
              <p className="mt-4 text-lg font-semibold text-slate-800">{item.prompt.ja}</p>
              <p className="mt-3 text-sm text-slate-500">あなたの回答: {item.userAnswer || '（未回答）'}</p>
              {item.feedback?.difference && (
                <p className="mt-2 text-sm text-slate-500">差分メモ: {item.feedback.difference}</p>
              )}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-semibold text-slate-600">
                  スコア: {item.feedback?.score ?? '未採点'}
                </span>
                <button
                  type="button"
                  onClick={() => handleRetry(item.id)}
                  className="rounded-full border border-indigo-100 px-5 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
                >
                  もう一度チャレンジ
                </button>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRemoveFromReview(item.id)}
                  className="text-xs text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
                >
                  復習リストから外す
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
