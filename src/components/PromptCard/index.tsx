type PromptCardProps = {
  japanese: string
  theme: string
  level: string
  source: 'local' | 'llm'
  onNext?: () => void
}

export default function PromptCard({ japanese, theme, level, source, onNext }: PromptCardProps) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-md transition hover:shadow-lg">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-600">{theme}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">{level}</span>
        <span className="text-slate-400">{source === 'local' ? 'ローカルお題' : 'LLM生成'}</span>
      </div>
      <p className="mt-4 text-2xl font-semibold leading-relaxed text-slate-800">{japanese}</p>
      {onNext && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onNext}
            className="rounded-full border border-indigo-100 px-5 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
          >
            次のお題へ
          </button>
        </div>
      )}
    </section>
  )
}
