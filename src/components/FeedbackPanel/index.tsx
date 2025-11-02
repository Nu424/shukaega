type FeedbackStatus = 'success' | 'warning' | 'error' | 'idle'

type FeedbackPanelProps = {
  status: FeedbackStatus
  correctExample?: string
  difference?: string
  grammarPoint?: string
  encouragement?: string
  variations?: string[]
  onAddToReview?: () => void
  onNext?: () => void
}

const statusStyles: Record<FeedbackStatus, string> = {
  idle: 'bg-slate-50 border-slate-200 text-slate-600',
  success: 'bg-green-50 border-green-200 text-green-700',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  error: 'bg-red-50 border-red-200 text-red-700',
}

export default function FeedbackPanel({
  status,
  correctExample,
  difference,
  grammarPoint,
  encouragement,
  variations = [],
  onAddToReview,
  onNext,
}: FeedbackPanelProps) {
  const containerClass = `rounded-3xl border p-6 shadow-inner transition ${statusStyles[status]}`

  return (
    <section className={containerClass}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">フィードバック</h2>
        <span className="text-xs uppercase tracking-wide">{status.toUpperCase()}</span>
      </div>
      {status === 'idle' ? (
        <p className="mt-4 text-sm text-slate-500">回答を送信すると、ここに改善ポイントが表示されます。</p>
      ) : (
        <div className="mt-4 space-y-3 text-sm">
          {encouragement && <p className="text-base font-medium">{encouragement}</p>}
          {correctExample && (
            <p>
              <span className="font-semibold">正解候補：</span>
              <span>{correctExample}</span>
            </p>
          )}
          {difference && (
            <p>
              <span className="font-semibold">差分：</span>
              <span>{difference}</span>
            </p>
          )}
          {grammarPoint && (
            <p>
              <span className="font-semibold">ポイント：</span>
              <span>{grammarPoint}</span>
            </p>
          )}
          {variations.length > 0 && (
            <div>
              <p className="font-semibold">他の例：</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {variations.map((variation) => (
                  <li key={variation}>{variation}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            {onAddToReview && (
              <button
                type="button"
                onClick={onAddToReview}
                className="rounded-full border border-current px-4 py-2 text-sm font-medium transition hover:bg-white/30"
              >
                復習リストに追加する
              </button>
            )}
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                className="rounded-full border border-current px-4 py-2 text-sm font-medium transition hover:bg-white/30"
              >
                次のお題へ
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
