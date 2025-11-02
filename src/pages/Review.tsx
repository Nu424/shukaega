import { useMemo } from 'react'

import { useHistoryStore } from '../stores/useHistoryStore'
import { useLessonStore } from '../stores/useLessonStore'

type ReviewPageProps = {
  onStartReview: () => void
}

const ReviewPage = ({ onStartReview }: ReviewPageProps) => {
  const { items, getWrongOnes } = useHistoryStore((state) => ({
    items: state.items,
    getWrongOnes: state.getWrongOnes,
  }))
  const { enterReviewMode, focusHistoryItem } = useLessonStore((state) => ({
    enterReviewMode: state.enterReviewMode,
    focusHistoryItem: state.focusHistoryItem,
  }))

  const wrongOnes = useMemo(() => getWrongOnes(), [getWrongOnes])

  const handleStartReview = async () => {
    await enterReviewMode()
    onStartReview()
  }

  const handleFocusItem = (itemId: string) => {
    const target = items.find((item) => item.id === itemId)
    if (!target) return
    focusHistoryItem(target)
    onStartReview()
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-900">復習モード</h2>
        <p className="mt-1 text-sm text-slate-600">
          間違えたお題だけを連続で解き直すことができます。
        </p>
        <button
          type="button"
          className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-white shadow transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          onClick={handleStartReview}
          disabled={wrongOnes.length === 0}
        >
          間違えたお題を復習する（{wrongOnes.length}件）
        </button>
        {wrongOnes.length === 0 && (
          <p className="mt-2 text-sm text-slate-500">
            間違えたお題がまだありません。まずは通常モードで練習しましょう！
          </p>
        )}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-slate-900">学習履歴</h3>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            まだ履歴がありません。お題を解くとここに記録されます。
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-800">
                  {item.prompt.ja}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  あなたの解答: {item.userAnswer || '（未入力）'}
                </p>
                {item.feedback && (
                  <p className="mt-1 text-xs text-slate-500">
                    スコア: {item.feedback.score} / メッセージ: {item.feedback.encouragement}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                    onClick={() => handleFocusItem(item.id)}
                  >
                    このお題を再挑戦
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default ReviewPage
